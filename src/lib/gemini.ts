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
// `internal` is deliberately absent. The callable throws HttpsError('internal')
// only after every model in its own cascade has failed and the reserved quota
// unit has already been refunded, so a client retry re-runs the same exhausted
// cascade and only burns rate limit for a result the user can already be shown.
const RETRYABLE_CODES = new Set([
  'functions/aborted',
  'functions/unavailable',
  'functions/deadline-exceeded',
  'functions/resource-exhausted',
  'aborted',
  'unavailable',
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
  /** null means PRO/unlimited; a number is the real remaining free count. */
  remainingQuota?: number | null;
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

/** Exponential backoff with full jitter, so parallel tabs do not resend in lockstep. */
function retryDelayMs(attempt: number): number {
  return RETRY_BASE_DELAY_MS * 2 ** attempt * (0.5 + Math.random() * 0.5);
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
  const attempts = Math.max(0, Math.min(2, Math.floor(maxRetries))) + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryable(error)) {
        break;
      }
      await wait(retryDelayMs(attempt));
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
        // One retry, not three. The callable already walks its own model
        // cascade, so a client retry only covers a genuinely transient
        // transport failure - anything the server could recover from it has
        // already tried by the time the error reaches us.
        return withRetry(
          () =>
            invokeProxy({
              contents: request.contents,
              systemInstruction: request.config?.systemInstruction,
              tools: request.config?.tools
            }),
          1
        );
      }
    }
  };
}

/**
 * Kept as the single entry point for chat/tool-calling callers, but no longer a
 * fallback loop. The callable ignores the requested model and always starts its
 * own cascade at `GEMINI_FALLBACK_MODELS[0]`, so re-entering this with a
 * different model re-ran the identical 4-model sequence and multiplied the
 * upstream calls (3 models x 3 attempts x 4 server models) for no new coverage.
 * Model fallback is now the server's job alone.
 */
export async function callWithModelFallback<T>(
  caller: (model: string, client: GeminiProxyClient) => Promise<T>
): Promise<T> {
  return caller(GEMINI_FALLBACK_MODELS[0], getAIClient());
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

  // One retry at most: the server-side model cascade already covers model
  // failures, so extra client attempts only duplicate paid calls.
  const data = await withRetry(() => invokeProxy(payload), options.maxRetries ?? 1);
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
