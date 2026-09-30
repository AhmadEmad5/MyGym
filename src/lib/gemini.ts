import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from './firebase';

export const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest'
] as const;

export const GEMINI_MAX_IMAGE_BASE64_CHARS = 800_000;
export const GEMINI_MAX_PROMPT_CHARS = 32_000;
export const GEMINI_MAX_TOTAL_CHARS = 1_000_000;

const AUTH_WAIT_TIMEOUT_MS = 5000;
const RETRY_BASE_DELAY_MS = 600;
const RETRYABLE_CODES = new Set([
  'functions/aborted',
  'functions/unavailable',
  'functions/internal',
  'functions/deadline-exceeded',
  'functions/resource-exhausted',
  'aborted',
  'unavailable',
  'internal',
  'deadline-exceeded'
]);

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const MESSAGES = {
  signedInRequired: 'يرجى تسجيل الدخول لاستخدام ميزات الذكاء الاصطناعي في FORMA.',
  serviceUnavailable: 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة بعد قليل.',
  dailyLimit: 'لقد استنفدت حدك اليومي المجاني من طلبات الذكاء الاصطناعي. اشترك في FORMA PRO للمتابعة بدون حدود.',
  tooLarge: 'الصورة أو الطلب كبير جداً. يرجى اختيار صورة أصغر أو تقصير النص.',
  invalidRequest: 'طلب غير صالح للخدمة السحابية.',
  emptyResponse: 'تعذر الحصول على استجابة من نموذج الذكاء الاصطناعي.',
  generic: 'تعذر الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
};

/**
 * Re-entering the callable cannot fix one of these: they are thrown locally,
 * before any network call, so retrying only adds dead waiting and repeats the
 * same failing invocation.
 */
const LOCAL_ERROR_MESSAGES = new Set<string>(Object.values(MESSAGES));

export interface GenerateGeminiOptions {
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  tools?: any[];
  maxRetries?: number;
  contents?: any[];
}

export interface CloudAIResponse {
  text: string;
  functionCalls?: any[];
  isPro: boolean;
  remainingQuota?: number;
}

export interface GeminiProxyRequest {
  model?: string;
  contents?: any[];
  config?: {
    systemInstruction?: string;
    tools?: any[];
  };
}

export interface GeminiProxyClient {
  models: {
    generateContent(request: GeminiProxyRequest): Promise<CloudAIResponse>;
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveAuthError(): Error {
  return new Error(MESSAGES.signedInRequired);
}

function requireFunctions() {
  if (!functions) {
    throw new Error(MESSAGES.serviceUnavailable);
  }
  return functions;
}

function isRetryable(error: any): boolean {
  if (!error) return false;
  if (error instanceof Error && LOCAL_ERROR_MESSAGES.has(error.message)) return false;
  const code = typeof error.code === 'string' ? error.code : '';
  if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
    return false;
  }
  if (code === 'functions/unauthenticated' || code === 'unauthenticated') {
    return false;
  }
  if (RETRYABLE_CODES.has(code)) return true;
  if (code) return false;
  return true;
}

function toFriendlyError(error: any): Error {
  if (error instanceof Error && error.message === MESSAGES.signedInRequired) {
    return error;
  }
  const code = typeof error?.code === 'string' ? error.code : '';
  const rawMessage = typeof error?.message === 'string' ? error.message : '';

  if (code === 'functions/unauthenticated' || code === 'unauthenticated') {
    return resolveAuthError();
  }
  if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
    return new Error(rawMessage || MESSAGES.dailyLimit);
  }
  if (code === 'functions/invalid-argument' || code === 'invalid-argument') {
    return new Error(rawMessage || MESSAGES.invalidRequest);
  }
  if (code === 'functions/permission-denied' || code === 'permission-denied') {
    return resolveAuthError();
  }
  if (code === 'functions/failed-precondition' || code === 'failed-precondition') {
    return new Error(rawMessage || MESSAGES.serviceUnavailable);
  }
  if (code === 'functions/unavailable' || code === 'unavailable' || code === 'functions/deadline-exceeded') {
    return new Error(MESSAGES.serviceUnavailable);
  }
  if (code === 'functions/internal' || code === 'internal') {
    return new Error(rawMessage || MESSAGES.generic);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(rawMessage || MESSAGES.generic);
}

async function waitForAuthenticatedUser(timeoutMs: number): Promise<boolean> {
  const authInstance = auth;
  if (!authInstance) return false;
  if (authInstance.currentUser) return true;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    let unsubscribe: (() => void) | undefined;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      resolve(value);
    };

    timer = setTimeout(() => finish(false), timeoutMs);
    unsubscribe = onAuthStateChanged(authInstance, (user) => finish(Boolean(user)));
  });
}

function safeStringifyLength(value: unknown): number {
  if (value === undefined || value === null) return 0;
  try {
    return JSON.stringify(value)?.length || 0;
  } catch {
    // Circular or non-serialisable input: fall back to a character estimate so
    // validation still runs instead of throwing a raw TypeError at the caller.
    return String(value).length;
  }
}

function estimatePayloadChars(options: GenerateGeminiOptions): number {
  const promptChars = options.prompt?.length || 0;
  const systemChars = options.systemInstruction?.length || 0;
  const imageChars = options.imageBase64?.length || 0;
  const toolChars = safeStringifyLength(options.tools);
  const contentsChars = safeStringifyLength(options.contents);
  return promptChars + systemChars + imageChars + toolChars + contentsChars;
}

export function validateGeminiOptions(options: GenerateGeminiOptions): void {
  if (!options || (typeof options.prompt !== 'string' && !Array.isArray(options.contents))) {
    throw new Error(MESSAGES.invalidRequest);
  }
  if (options.prompt && options.prompt.length > GEMINI_MAX_PROMPT_CHARS) {
    throw new Error(MESSAGES.tooLarge);
  }
  if (options.systemInstruction && options.systemInstruction.length > GEMINI_MAX_PROMPT_CHARS) {
    throw new Error(MESSAGES.tooLarge);
  }
  if (options.imageBase64) {
    if (options.imageBase64.length > GEMINI_MAX_IMAGE_BASE64_CHARS) {
      throw new Error(MESSAGES.tooLarge);
    }
    if (!BASE64_PATTERN.test(options.imageBase64.slice(0, 1024))) {
      throw new Error(MESSAGES.invalidRequest);
    }
    const mimeType = options.mimeType || 'image/jpeg';
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new Error(MESSAGES.invalidRequest);
    }
  }
  if (estimatePayloadChars(options) > GEMINI_MAX_TOTAL_CHARS) {
    throw new Error(MESSAGES.tooLarge);
  }
}

async function invokeProxy(payload: {
  prompt?: string;
  contents?: any[];
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  tools?: any[];
}): Promise<CloudAIResponse> {
  const functionsInstance = requireFunctions();
  const signedIn = await waitForAuthenticatedUser(AUTH_WAIT_TIMEOUT_MS);
  if (!signedIn) {
    throw resolveAuthError();
  }
  const callable = httpsCallable<typeof payload, CloudAIResponse>(functionsInstance, 'generateGeminiContent');
  const result = await callable(payload);
  return result.data;
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
  const attempts = Math.max(0, Math.min(3, Math.floor(maxRetries))) + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryable(error)) {
        break;
      }
      await wait(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  throw toFriendlyError(lastError);
}

export function getAIClient(): GeminiProxyClient {
  return {
    models: {
      generateContent: (request: GeminiProxyRequest) => {
        const options: GenerateGeminiOptions = {
          prompt: '',
          contents: request?.contents,
          systemInstruction: request?.config?.systemInstruction,
          tools: request?.config?.tools
        };
        validateGeminiOptions(options);
        return withRetry(
          () =>
            invokeProxy({
              contents: request.contents,
              systemInstruction: request.config?.systemInstruction,
              tools: request.config?.tools
            }),
          2
        );
      }
    }
  };
}

export async function callWithModelFallback<T>(
  caller: (model: string, client: GeminiProxyClient) => Promise<T>
): Promise<T> {
  const client = getAIClient();
  const attempts = Math.min(GEMINI_FALLBACK_MODELS.length, 3);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await caller(GEMINI_FALLBACK_MODELS[attempt], client);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryable(error)) {
        break;
      }
      await wait(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  throw toFriendlyError(lastError);
}

export async function generateGeminiContent(options: GenerateGeminiOptions): Promise<string> {
  validateGeminiOptions(options);

  const payload = {
    prompt: options.prompt,
    systemInstruction: options.systemInstruction,
    imageBase64: options.imageBase64,
    mimeType: options.mimeType,
    tools: options.tools && options.tools.length > 0 ? options.tools : undefined
  };

  const data = await withRetry(() => invokeProxy(payload), options.maxRetries ?? 2);
  const text = typeof data?.text === 'string' ? data.text : '';
  if (!text.trim() && !(data?.functionCalls && data.functionCalls.length > 0)) {
    throw new Error(MESSAGES.emptyResponse);
  }
  return text;
}

export async function generateGeminiJson<T = any>(options: GenerateGeminiOptions): Promise<T> {
  const rawText = await generateGeminiContent(options);

  const cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseErr) {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        throw new Error('Failed to parse AI response as JSON.');
      }
    }
    throw new Error('Failed to parse AI response as JSON.');
  }
}
