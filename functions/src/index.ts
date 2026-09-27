import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();

// Available Gemini models with automatic cascading fallback
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest'
];

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

/**
 * Helper to get today's date in YYYY-MM-DD UTC format
 */
function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Secure Firebase Cloud Function:
 * 1. Authenticates caller (requires Firebase Auth token)
 * 2. Checks user subscription status (PRO vs FREE)
 * 3. Enforces daily rate limiting / quota on FREE tier
 * 4. Executes Gemini API on the backend with zero key leakage
 * 5. Increments daily usage counter in Firestore
 */
export const generateGeminiContent = onCall<GenerateAIRequest, Promise<GenerateAIResponse>>(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
  },
  async (request) => {
    // 1. Verify User Authentication
    const auth = request.auth;
    if (!auth || !auth.uid) {
      throw new HttpsError(
        'unauthenticated',
        'يجب تسجيل الدخول لاستخدام ميزات الذكاء الاصطناعي (Authentication required).'
      );
    }

    const { prompt, contents, systemInstruction, imageBase64, mimeType, tools } = request.data;
    if (!prompt && (!contents || !Array.isArray(contents) || contents.length === 0)) {
      throw new HttpsError('invalid-argument', 'A valid prompt string or contents array is required.');
    }

    // 2. Resolve Gemini API Key from environment or Firebase Secret
    const apiKey = process.env.GEMINI_API_KEY;
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

    // 3. Check Subscription & Quota Limit
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const isPro = Boolean(userData.isPro || userData.subscription?.status === 'active');

    const dailyLimit = parseInt(process.env.DAILY_FREE_AI_LIMIT || '10', 10);
    let currentUsage = 0;

    if (!isPro) {
      const usageDoc = await usageRef.get();
      if (usageDoc.exists) {
        currentUsage = usageDoc.data()?.count || 0;
      }

      if (currentUsage >= dailyLimit) {
        throw new HttpsError(
          'resource-exhausted',
          `لقد استنفدت حدك اليومي المجاني (${dailyLimit} طلبات). اشترك في FORMA PRO للحصول على استخدام غير محدود!`
        );
      }
    }

    // 4. Construct Contents Payload
    let requestContents: any[] = [];
    if (contents && Array.isArray(contents) && contents.length > 0) {
      requestContents = contents;
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
    if (tools && Array.isArray(tools) && tools.length > 0) {
      config.tools = tools;
    }

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
      throw new HttpsError('internal', msg);
    }

    // 6. Increment Usage Count for Free Tier
    if (!isPro) {
      await usageRef.set(
        {
          count: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      currentUsage += 1;
    }

    return {
      text: generatedText,
      functionCalls,
      isPro,
      remainingQuota: isPro ? 9999 : Math.max(0, dailyLimit - currentUsage),
    };
  }
);
