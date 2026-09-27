import { GoogleGenAI } from '@google/genai';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from './firebase';

export const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest'
] as const;

export interface GenerateGeminiOptions {
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  tools?: any[];
  maxRetries?: number;
}

export interface CloudAIResponse {
  text: string;
  functionCalls?: any[];
  isPro: boolean;
  remainingQuota?: number;
}

export function getGeminiApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function getAIClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes an AI operation with automatic model fallback across all supported fast & reliable models.
 */
export async function callWithModelFallback<T>(caller: (model: string, client: GoogleGenAI) => Promise<T>): Promise<T> {
  const client = getAIClient();
  let lastError: any = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      return await caller(model, client);
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.warn(`Gemini model ${model} failed, attempting next fallback model. Reason: ${msg}`);
      continue;
    }
  }

  const errMsg = lastError?.message || 'AI service is temporarily experiencing high demand. Please try again in a moment.';
  throw new Error(errMsg);
}

/**
 * Secure Gemini Content Generator:
 * 1. Primary Route: Executes on Firebase Cloud Functions backend.
 *    - Authenticates the user.
 *    - Enforces free tier daily limits and PRO perks.
 *    - Keeps the Gemini API key 100% hidden and secure on the cloud.
 * 2. Fallback Route: If Cloud Functions is not yet deployed or in local offline dev mode,
 *    gracefully falls back to direct client-side execution if VITE_GEMINI_API_KEY is present.
 */
export async function generateGeminiContent(options: GenerateGeminiOptions): Promise<string> {
  // Try secure Cloud Function first if user is logged in and functions is initialized
  if (functions && auth?.currentUser) {
    try {
      const callable = httpsCallable<GenerateGeminiOptions, CloudAIResponse>(
        functions,
        'generateGeminiContent'
      );
      const result = await callable(options);
      if (result.data?.text) {
        return result.data.text;
      }
    } catch (cloudErr: any) {
      const code = cloudErr?.code;
      const message = cloudErr?.message || '';

      // Quota exhausted (Rate Limit reached on free tier)
      if (code === 'functions/resource-exhausted' || message.includes('استنفدت') || message.includes('limit')) {
        throw new Error(message || 'لقد استنفدت حدك اليومي المجاني من طلبات الذكاء الاصطناعي. اشترك في FORMA PRO للمتابعة بدون حدود.');
      }

      // Unauthenticated
      if (code === 'functions/unauthenticated') {
        throw new Error('يرجى تسجيل الدخول لاستخدام ميزات الذكاء الاصطناعي في FORMA.');
      }

      console.warn('Cloud Function unavailable or errored, evaluating local fallback:', cloudErr);
    }
  }

  // Fallback to client-side API key if available
  const localKey = getGeminiApiKey();
  if (localKey) {
    return await callWithModelFallback(async (model, client) => {
      const parts: any[] = [];
      
      if (options.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: options.mimeType || 'image/jpeg',
            data: options.imageBase64
          }
        });
      }

      parts.push({ text: options.prompt });

      const config: any = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.tools && options.tools.length > 0) {
        config.tools = options.tools;
      }

      const response = await client.models.generateContent({
        model,
        contents: [{ parts }],
        ...(Object.keys(config).length > 0 ? { config } : {})
      });

      const text = response.text || '';
      if (text.trim()) {
        return text;
      }
      throw new Error('Empty response from model');
    });
  }

  throw new Error('يرجى تسجيل الدخول لاستخدام الذكاء الاصطناعي عبر الخادم السحابي.');
}

/**
 * Robust Gemini JSON Generator that automatically extracts and parses JSON objects
 * even if enclosed in markdown code fences.
 */
export async function generateGeminiJson<T = any>(options: GenerateGeminiOptions): Promise<T> {
  const rawText = await generateGeminiContent(options);
  
  // Clean markdown fences
  const cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseErr) {
    // Attempt fuzzy JSON extraction (match first { ... } or [ ... ])
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error('Failed to parse AI response as JSON.');
  }
}
