import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();

// Server-held Gemini credential. Bound to the function so it is only resolved
// at invocation time from Secret Manager, never from a VITE_ client variable.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Available Gemini models with automatic cascading fallback
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest'
];

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const DEFAULT_MAX_IMAGE_BASE64_CHARS = 800_000;
const DEFAULT_MAX_AI_REQUESTS_PER_MINUTE = 10;
const MAX_PROMPT_CHARS = 32_000;
const MAX_CONTENTS_ITEMS = 50;
const MAX_CONTENTS_CHARS = 1_000_000;
const MAX_TOOL_ITEMS = 8;
const BURST_WINDOW_MS = 60_000;

function readPositiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const MAX_IMAGE_BASE64_CHARS = readPositiveIntEnv('MAX_IMAGE_BASE64_CHARS', DEFAULT_MAX_IMAGE_BASE64_CHARS);
const MAX_AI_REQUESTS_PER_MINUTE = readPositiveIntEnv('MAX_AI_REQUESTS_PER_MINUTE', DEFAULT_MAX_AI_REQUESTS_PER_MINUTE);
const DEFAULT_DAILY_FREE_AI_LIMIT = 10;
const DAILY_FREE_AI_LIMIT = readPositiveIntEnv('DAILY_FREE_AI_LIMIT', DEFAULT_DAILY_FREE_AI_LIMIT);

// Origins permitted to call this function from a browser. Empty = no allowlist is
// enforced, which keeps emulator/CI and unknown deploy domains working; App Check
// remains the primary control. Populate ALLOWED_ORIGINS in production.
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter((origin) => origin.length > 0)
);

interface GenerateAIRequest {
  prompt?: string;
  contents?: any[];
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  tools?: any[];
}

interface GenerateAIResponse {
  text: string;
  functionCalls?: any[];
  isPro: boolean;
  remainingQuota?: number;
}

function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getBurstBucketKey(): string {
  return String(Math.floor(Date.now() / BURST_WINDOW_MS));
}

function assertCallableSize(totalChars: number): void {
  if (totalChars > MAX_CONTENTS_CHARS) {
    throw new HttpsError(
      'invalid-argument',
      `Request payload is too large. Maximum supported size is ${MAX_CONTENTS_CHARS} characters.`
    );
  }
}

function assertImageWithinLimits(imageBase64: string, mimeType?: string): void {
  if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    throw new HttpsError(
      'invalid-argument',
      `Image payload is too large. Maximum supported size is ${MAX_IMAGE_BASE64_CHARS} base64 characters.`
    );
  }
  const resolvedMime = mimeType || 'image/jpeg';
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(resolvedMime)) {
    throw new HttpsError('invalid-argument', `Unsupported image mime type: ${resolvedMime}`);
  }
  if (!BASE64_PATTERN.test(imageBase64)) {
    throw new HttpsError('invalid-argument', 'Image payload is not valid base64 data.');
  }
}

function sanitizeContents(contents: any[]): any[] {
  if (contents.length > MAX_CONTENTS_ITEMS) {
    throw new HttpsError(
      'invalid-argument',
      `Conversation history is too long. Maximum supported turns is ${MAX_CONTENTS_ITEMS}.`
    );
  }
  return contents.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpsError('invalid-argument', 'Each conversation turn must be an object.');
    }
    const role = item.role === 'model' || item.role === 'user' ? item.role : undefined;
    const parts = Array.isArray(item.parts) ? item.parts : [];
    if (parts.length === 0) {
      throw new HttpsError('invalid-argument', 'Each conversation turn must contain at least one part.');
    }
    return role ? { role, parts } : { parts };
  });
}

function sanitizeTools(tools: any): any[] | undefined {
  if (tools === undefined || tools === null) return undefined;
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  if (tools.length > MAX_TOOL_ITEMS) {
    throw new HttpsError('invalid-argument', `Too many tool definitions. Maximum supported is ${MAX_TOOL_ITEMS}.`);
  }
  return tools;
}

function assertPromptWithinLimits(prompt: string): void {
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new HttpsError(
      'invalid-argument',
      `Prompt is too long. Maximum supported length is ${MAX_PROMPT_CHARS} characters.`
    );
  }
}

function assertOriginAllowed(headers: unknown): void {
  if (ALLOWED_ORIGINS.size === 0) return;
  const origin = (headers as { origin?: unknown } | undefined)?.origin;
  // No Origin header means a non-browser client (Capacitor, Electron, curl).
  // Those are covered by App Check, so absence is not treated as a failure.
  if (typeof origin !== 'string' || origin.trim().length === 0) return;
  if (!ALLOWED_ORIGINS.has(origin.trim().toLowerCase())) {
    throw new HttpsError('permission-denied', 'Request origin is not allowed.');
  }
}

interface QuotaReservation {
  isPro: boolean;
  usageCount: number;
}

/**
 * Atomically checks the burst + daily limits and reserves one unit of quota.
 *
 * The read and the increment share a single Firestore transaction, so N parallel
 * invocations serialise on the usage document and cannot all pass a pre-check
 * taken from a stale snapshot. The unit is reserved BEFORE the paid Gemini call;
 * refundQuotaReservation gives it back if generation fails.
 */
async function reserveQuota(params: {
  userRef: admin.firestore.DocumentReference;
  usageRef: admin.firestore.DocumentReference;
  today: string;
  burstBucket: string;
  dailyLimit: number;
}): Promise<QuotaReservation> {
  const { userRef, usageRef, today, burstBucket, dailyLimit } = params;

  try {
    return await db.runTransaction(async (tx) => {
      const userSnapshot = await tx.get(userRef);
      const usageSnapshot = await tx.get(usageRef);

      const userData = userSnapshot.data() || {};
      const isPro = Boolean(userData.isPro || userData.subscription?.status === 'active');

      const usageData = usageSnapshot.exists ? usageSnapshot.data() || {} : {};
      const currentUsage = Number(usageData.count) || 0;
      const currentBurstCount =
        usageData.burstBucket === burstBucket ? Number(usageData.burstCount) || 0 : 0;

      if (currentBurstCount >= MAX_AI_REQUESTS_PER_MINUTE) {
        throw new HttpsError(
          'resource-exhausted',
          'تم تجاوز الحد الأقصى للطلبات المتزامنة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.'
        );
      }

      if (!isPro && currentUsage >= dailyLimit) {
        throw new HttpsError(
          'resource-exhausted',
          `لقد استنفدت حدك اليومي المجاني (${dailyLimit} طلبات). اشترك في FORMA PRO للحصول على استخدام غير محدود!`
        );
      }

      const usageCount = currentUsage + 1;
      const burstCount = currentBurstCount + 1;
      tx.set(
        usageRef,
        {
          date: today,
          count: usageCount,
          burstBucket,
          burstCount,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { isPro, usageCount };
    });
  } catch (err: any) {
    // Re-throw our own quota decisions unchanged; only genuine infrastructure
    // failures are translated. Failing closed here is deliberate: without a
    // committed reservation we cannot tell whether quota is available.
    if (err instanceof HttpsError) throw err;
    console.error('Quota reservation transaction failed:', err?.message || err);
    throw new HttpsError(
      'unavailable',
      'تعذر التحقق من رصيد الطلبات حالياً. يرجى المحاولة بعد قليل.'
    );
  }
}

/**
 * Returns a reserved unit after a failed generation. Best effort by design: it is
 * only ever called on the failure path, where a Firestore blip must not mask the
 * original generation error. Never throws.
 */
async function refundQuotaReservation(params: {
  usageRef: admin.firestore.DocumentReference;
  today: string;
  burstBucket: string;
}): Promise<void> {
  const { usageRef, today, burstBucket } = params;
  try {
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(usageRef);
      if (!snapshot.exists) return;
      const data = snapshot.data() || {};
      // The UTC day rolled over while we were generating; the reservation now
      // belongs to a different document and this refund would be a no-op.
      if (data.date !== today) return;

      const patch: admin.firestore.DocumentData = {
        count: Math.max(0, (Number(data.count) || 0) - 1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };
      // Only give the burst slot back if the stored bucket is still ours; if the
      // window has rolled over the reservation has already lapsed on its own.
      if (data.burstBucket === burstBucket) {
        patch.burstCount = Math.max(0, (Number(data.burstCount) || 0) - 1);
      }
      tx.set(usageRef, patch, { merge: true });
    });
  } catch (err: any) {
    console.warn('Failed to refund reserved AI quota:', err?.message || err);
  }
}

/**
 * Secure Firebase Cloud Function:
 * 1. Verifies App Check, then authenticates the caller (requires Firebase Auth token)
 * 2. Builds and size-checks the Gemini payload
 * 3. Checks subscription status (PRO vs FREE) and reserves one unit of quota in a
 *    single Firestore transaction, so the daily limit and the per-minute burst cap
 *    hold under concurrency
 * 4. Executes Gemini API on the backend with zero key leakage
 * 5. Refunds the reserved unit if generation fails, so a Gemini outage does not
 *    burn the user's daily quota
 */
export const generateGeminiContent = onCall<GenerateAIRequest, Promise<GenerateAIResponse>>(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [GEMINI_API_KEY],
    // Without this the callable is an open relay: any script can mint a Firebase
    // account and spend the Gemini key. The SDK answers 401 before the handler
    // runs when the App Check token is missing or invalid, so `request.app` is
    // always populated below. See CLIENT ACTION REQUIRED in functions/.env.example:
    // the client MUST call initializeAppCheck() before this can be deployed.
    enforceAppCheck: true,
  },
  async (request) => {
    // Defence in depth on top of App Check: reject browser callers from origins we
    // do not serve. Native (Capacitor/Electron) callers send no Origin header and
    // are governed by App Check alone, so a missing header is not a failure.
    assertOriginAllowed(request.rawRequest?.headers);

    // 1. Verify User Authentication
    const auth = request.auth;
    if (!auth || !auth.uid || !auth.token) {
      throw new HttpsError(
        'unauthenticated',
        'يجب تسجيل الدخول لاستخدام ميزات الذكاء الاصطناعي (Authentication required).'
      );
    }

    const { prompt, contents, systemInstruction, imageBase64, mimeType, tools } = request.data ?? {};
    if (!prompt && (!contents || !Array.isArray(contents) || contents.length === 0)) {
      throw new HttpsError('invalid-argument', 'A valid prompt string or contents array is required.');
    }
    if (typeof prompt === 'string') {
      assertPromptWithinLimits(prompt);
    }
    if (typeof systemInstruction === 'string' && systemInstruction.length > MAX_PROMPT_CHARS) {
      throw new HttpsError(
        'invalid-argument',
        `System instruction is too long. Maximum supported length is ${MAX_PROMPT_CHARS} characters.`
      );
    }
    if (typeof imageBase64 === 'string') {
      assertImageWithinLimits(imageBase64, mimeType);
    }
    const sanitizedTools = sanitizeTools(tools);
    assertCallableSize(
      JSON.stringify({
        prompt: prompt ?? '',
        contents: contents ?? [],
        systemInstruction: systemInstruction ?? '',
        imageBase64: imageBase64 ?? '',
        tools: sanitizedTools ?? []
      }).length
    );

    // 2. Resolve Gemini API Key from environment or Firebase Secret
    const apiKey = GEMINI_API_KEY.value() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY environment variable on Cloud Functions.');
      throw new HttpsError(
        'failed-precondition',
        'مفتاح الذكاء الاصطناعي غير مهيأ على الخادم السحابي (GEMINI_API_KEY missing).'
      );
    }

    const uid = auth.uid;
    const userRef = db.collection('users').doc(uid);
    const today = getTodayDateKey();
    const usageRef = userRef.collection('ai_usage').doc(today);
    const burstBucket = getBurstBucketKey();

    // 3. Construct Contents Payload (before any quota is spent, so a malformed
    // request cannot burn a reservation).
    let requestContents: any[] = [];
    if (contents && Array.isArray(contents) && contents.length > 0) {
      requestContents = sanitizeContents(contents);
    } else {
      const parts: any[] = [];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }
      if (prompt) {
        parts.push({ text: prompt });
      }
      requestContents = [{ parts }];
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (sanitizedTools) {
      config.tools = sanitizedTools;
    }

    // 4. Check subscription + atomically reserve one unit of quota. The check and
    // the increment commit together, so concurrent calls cannot all pass a
    // snapshot taken before any of them wrote.
    const reservation = await reserveQuota({
      userRef,
      usageRef,
      today,
      burstBucket,
      dailyLimit: DAILY_FREE_AI_LIMIT,
    });

    // 5. Execute AI Generation with Fallback
    const aiClient = new GoogleGenAI({ apiKey });
    let lastError: any = null;
    let generatedText = '';
    let functionCalls: any[] | undefined = undefined;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: requestContents,
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });

        const text = response.text || '';
        const fCalls = response.functionCalls;

        if (text.trim() || (fCalls && fCalls.length > 0)) {
          generatedText = text;
          functionCalls = fCalls;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed in cloud function: ${err?.message || err}`);
      }
    }

    if (!generatedText && (!functionCalls || functionCalls.length === 0)) {
      const msg = lastError?.message || 'تعذر الحصول على استجابة من نموذج الذكاء الاصطناعي.';
      // Give the reserved unit back so a transient Gemini outage does not
      // permanently consume the user's daily quota. Best effort, never throws.
      await refundQuotaReservation({ usageRef, today, burstBucket });
      throw new HttpsError('internal', msg);
    }

    // 6. Success. The reservation already counted this request, so no further
    // Firestore write happens here: a counter blip cannot discard a generation
    // that Gemini already paid for.
    return {
      text: generatedText,
      functionCalls,
      isPro: reservation.isPro,
      remainingQuota: reservation.isPro
        ? 9999
        : Math.max(0, DAILY_FREE_AI_LIMIT - reservation.usageCount),
    };
  }
);
