import { useState, useCallback, useEffect, useRef } from 'react';
import { useData } from './useData';
import { callWithModelFallback, getAIClient } from '../lib/gemini';

/**
 * A state-changing request the model may only *ask* for. The pipeline never
 * performs these side effects itself: it emits the card, and the hook applies
 * the change only after the user taps Confirm.
 */
export type PendingSessionAction = {
  actionId: string;
  action: 'complete_workout_session';
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionType: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
};

export type ChatActionCard = 
  | {
      type: 'workout_scheduled';
      data: {
        sessionId: string;
        title: string;
        date: string;
        duration: number;
        type: string;
      };
    }
  | {
      type: 'meal_suggestion';
      data: {
        title: string;
        mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        notes?: string;
      };
    }
  | {
      type: 'confirmation_required';
      data: PendingSessionAction;
    };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionCards?: ChatActionCard[];
}

export const CHAT_STORAGE_KEY = 'forma_ai_chat_history';

/**
 * Chat history persisted before cards became a list stored a single object
 * under `actionCard`. Normalise both shapes on restore so an old cached
 * conversation keeps rendering (and, for a pending card, stays confirmable).
 */
function normalizeActionCards(raw: any): ChatActionCard[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return [raw];
  return [];
}

export { normalizeActionCards };

/**
 * Stable, non-reversible handle for an athlete's account.
 *
 * The assistant needs something it can carry across turns so it never asks the
 * athlete to re-introduce themselves, but it never needs the address itself.
 * Every chat turn ships this context to Gemini, so the raw email would put the
 * athlete's identity - and, for a corporate address, their employer - into
 * every prompt and every provider log. The email domain is dropped for the same
 * reason: it is as identifying as the address on a work account.
 *
 * This is a pseudonym for the model, not anonymisation: 32 bits is short enough
 * to be recovered by someone who can enumerate candidates offline, so it must
 * never be treated as a key or used to correlate an athlete across surfaces.
 */
function accountRefFor(email: unknown): string | undefined {
  if (typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return undefined;
  // FNV-1a, 32 bit. Deterministic so the handle survives a reload.
  let hash = 0x811c9dc5;
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `athlete_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * The allowlist of settings the assistant is allowed to see. `UserSettings`
 * carries display, accessibility and notification preferences that no coach
 * needs, so the context is built key by key instead of spreading the object:
 * a spread would silently ship every preference added to the type later.
 */
function pickAISettings(settings: any) {
  if (!settings || typeof settings !== 'object') return undefined;
  return {
    weightUnit: settings.weightUnit,
    language: settings.language
  };
}

/**
 * Reduces the whole athlete document to the non-identifying context the
 * assistant actually reasons over. Anything not built here stays on device:
 * display name, profile photo, body measurements (weight, body fat, girth) and
 * the rest of the settings object never leave the app.
 */
export function sanitizeAIContext(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  const accountRef = raw.user ? accountRefFor(raw.user.email) : undefined;
  return {
    user: accountRef ? { accountRef } : undefined,
    settings: pickAISettings(raw.settings),
    sessions: Array.isArray(raw.sessions)
      ? raw.sessions.slice(-15).map((s: any) => ({
          id: s.id,
          title: s.title,
          date: s.date,
          duration: s.duration,
          type: s.type,
          isCompleted: s.isCompleted,
          exerciseCount: s.exercises?.length || 0
        }))
      : [],
    routines: Array.isArray(raw.routines)
      ? raw.routines.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          exercises: (r.exercises || []).map((e: any) => e.name)
        }))
      : [],
    recentHistory: Array.isArray(raw.history)
      ? raw.history.slice(-7).map((h: any) => ({
          title: h.title,
          date: h.date,
          burnedCalories: h.burnedCalories
        }))
      : [],
    recentMeals: Array.isArray(raw.meals)
      ? raw.meals.slice(0, 7).map((m: any) => ({
          title: m.title,
          mealType: m.mealType,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fats: m.fats,
          date: m.date
        }))
      : []
  };
}

function buildSystemInstruction(sanitized: any, isArabic: boolean) {
  return `You are an elite, encouraging fitness AI assistant in the FORMA app.
${isArabic ? 'CRITICAL: The user has selected Arabic. Respond primarily in natural, motivating Arabic unless asked otherwise.' : 'Respond in helpful, motivating English.'}
Here is a concise summary of the user's data for context:
${JSON.stringify(sanitized)}
Limit your responses to a few paragraphs, be concise and helpful.

CRITICAL INSTRUCTIONS FOR INTERACTIVE ACTION CARDS:
1. If the user asks for a meal suggestion, post-workout food, high-protein recipe, or diet idea: YOU MUST CALL the 'suggest_meal' tool so an interactive action card is rendered.
2. If the user asks to schedule, plan, or add a workout: YOU MUST CALL the 'add_workout_session' tool so that an interactive workout card is rendered.
3. You have NO tool that deletes anything, and you must never claim to have deleted, removed, cancelled or reset any session, meal, routine or history. If the user asks you to delete data, tell them to do it themselves from the relevant screen and describe where to find it.
4. Calling 'complete_workout_session' does NOT mark the session complete. It only renders a confirmation card that the user must approve. Never tell the user the session is completed - instead ask them to tap Confirm on the card. If they decline, nothing changes.
Only use tools if explicitly requested by the user or if it's the clear intent. Confirm with the user in your response after using a tool.`;
}

export const TOOLS = [{
  functionDeclarations: [
    {
      name: "add_workout_session",
      description: "Schedules a new workout session for a specific date.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: "The title/name of the workout (e.g. Chest Day)" },
          date: { type: 'string', description: "The ISO date string of when the workout should be scheduled. e.g. 2023-10-25T18:00:00Z" },
          type: { type: 'string', description: "The type of workout: Strength, Cardio, Yoga, or Mixed" },
          duration: { type: 'integer', description: "Duration in minutes" }
        },
        required: ["title", "date", "type", "duration"]
      }
    },
    {
      name: "suggest_meal",
      description: "Suggests a specific healthy meal with calculated nutritional macros (calories, protein, carbs, fats) and recipe notes.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: "The name of the meal (e.g., 'Salmon with Quinoa and Asparagus')" },
          mealType: { type: 'string', description: "The meal type: breakfast, lunch, dinner, or snack" },
          calories: { type: 'integer', description: "Estimated total calories (kcal)" },
          protein: { type: 'integer', description: "Protein in grams" },
          carbs: { type: 'integer', description: "Carbohydrates in grams" },
          fats: { type: 'integer', description: "Fat in grams" },
          notes: { type: 'string', description: "Brief recipe description, ingredients or health highlights" }
        },
        required: ["title", "mealType", "calories", "protein", "carbs", "fats"]
      }
    },
    {
      name: "complete_workout_session",
      description: "Requests that a workout session be marked as completed. This does NOT change anything by itself: it renders a confirmation card that the user must approve, and the session is only updated after they confirm.",
      parameters: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: "The ID of the session to mark as completed" }
        },
        required: ["sessionId"]
      }
    }
  ]
}] as any;

interface AssistantPipelineArgs {
  history: ChatMessage[];
  contextData: any;
  isArabic: boolean;
  saveSession: (session: any) => Promise<unknown>;
}

/**
 * Runs the model call, executes any requested tool calls, and returns the
 * assistant reply. Lives outside the hook so it is never re-created by a render
 * and can only be started from an event handler - never from a state updater.
 */
async function runAssistantPipeline({
  history,
  contextData,
  isArabic,
  saveSession,
}: AssistantPipelineArgs): Promise<ChatMessage> {
  const systemInstruction = buildSystemInstruction(sanitizeAIContext(contextData), isArabic);

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const response = await callWithModelFallback((model, client) =>
    client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: TOOLS,
      }
    })
  );

  let responseText = response.text || "";
  const actionCards: ChatActionCard[] = [];

  // Handle function calls
  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionCalls = response.functionCalls;
    const functionResponses: any[] = [];
    for (const call of functionCalls) {
      let result = {};
      try {
        if (call.name === 'add_workout_session') {
          const args = call.args as any;
          let scheduledDate = new Date(args.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Guard: never schedule workout sessions on past days
          if (isNaN(scheduledDate.getTime()) || scheduledDate < today) {
            scheduledDate = new Date();
            scheduledDate.setHours(18, 0, 0, 0);
          }

          const dateStr = new Date(scheduledDate.getTime() - (scheduledDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

          const newSession = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            title: args.title,
            date: dateStr,
            duration: args.duration || 60,
            type: args.type || 'Strength',
            notes: "Added via AI Assistant",
            isCompleted: false,
            exercises: []
          };
          await saveSession(newSession);

          actionCards.push({
            type: 'workout_scheduled',
            data: {
              sessionId: newSession.id,
              title: newSession.title,
              date: newSession.date,
              duration: newSession.duration,
              type: newSession.type
            }
          });
          result = { status: "success", message: `Successfully added ${args.title} on ${scheduledDate.toDateString()}`, sessionId: newSession.id };
        } else if (call.name === 'suggest_meal') {
          const args = call.args as any;
          const mType = (args.mealType || 'lunch').toLowerCase();
          actionCards.push({
            type: 'meal_suggestion',
            data: {
              title: args.title || 'وجبة صحية متوازنة',
              mealType: ['breakfast', 'lunch', 'dinner', 'snack'].includes(mType) ? mType : 'lunch',
              calories: Number(args.calories) || 0,
              protein: Number(args.protein) || 0,
              carbs: Number(args.carbs) || 0,
              fats: Number(args.fats) || 0,
              notes: args.notes || undefined
            }
          });
          result = { status: "success", message: `Meal suggestion card ready for ${args.title}` };
        } else if (call.name === 'complete_workout_session') {
          const args = call.args as any;
          const requestedId = String(args.sessionId ?? '');
          const sessionToComplete = contextData?.sessions?.find((s: any) => String(s.id) === requestedId);

          if (!sessionToComplete) {
            result = { status: "error", message: `Session ${requestedId} was not found in the user's data, so nothing was changed. List the available session ids for the user and let them pick one.` };
          } else {
            // Deliberately no saveSession() here: the only thing this tool does is
            // ask. The write happens in confirmAction(), which only the UI can
            // trigger from an explicit user tap.
            actionCards.push({
              type: 'confirmation_required',
              data: {
                actionId: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                action: 'complete_workout_session',
                sessionId: String(sessionToComplete.id),
                sessionTitle: sessionToComplete.title || 'Workout',
                sessionDate: sessionToComplete.date,
                sessionType: sessionToComplete.type || '',
                status: 'pending'
              }
            });
            result = {
              status: "pending_user_confirmation",
              message: `Nothing has changed yet. A confirmation card was shown to the user for "${sessionToComplete.title}". Tell them the session is NOT completed yet and that they need to tap Confirm on the card. Never state that it is already complete.`
            };
          }
        } else {
          result = { status: "error", message: "Unknown function" };
        }
      } catch (e: any) {
        result = { status: "error", message: e.message };
      }

      functionResponses.push({
        name: call.name,
        response: result
      });
    }

    // Send function response back to the model to get final response.
    // A plain single call: this is a follow-up round-trip, not a second
    // chance at the first one, so it must not re-run any fallback ladder.
    const followUpResponse = await getAIClient().models.generateContent({
      contents: [
        ...contents,
        { role: 'model', parts: functionCalls.map((f: any) => ({ functionCall: f })) },
        { role: 'user', parts: functionResponses.map(f => ({ functionResponse: f })) }
      ],
      config: {
        systemInstruction,
        tools: TOOLS,
      }
    });
    responseText = followUpResponse.text || "Action completed successfully.";
  }

  return {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: responseText || "I'm not sure how to respond to that.",
    timestamp: new Date(),
    actionCards: actionCards.length > 0 ? actionCards : undefined
  };
}

export function useAI(fallbackData: any = null) {
  const { data, saveSession } = useData();
  const contextData = data || fallbackData;
  const isArabic = (contextData?.settings?.language || localStorage.getItem('mygym_lang')) === 'ar';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
              actionCards: normalizeActionCards(m.actionCards ?? m.actionCard)
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored chat history:', e);
      }
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: isArabic 
          ? 'مرحباً! أنا مساعدك الرياضي بالذكاء الاصطناعي. كيف أستطيع مساعدتك اليوم في تمرينك وتغذيتك؟'
          : 'Hi! I am your AI fitness assistant. How can I help you reach your goals today?',
        timestamp: new Date(),
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const lastSentRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Mirror of `messages` so the send handler can read the current history
  // without having to depend on (and be re-created by) the state value.
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Persist chat history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        // Keep at most 40 messages to avoid local storage bloat
        const toSave = messages.slice(-40);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn('Failed to persist chat history:', e);
      }
    }
  }, [messages]);

  // Clear chat history
  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: isArabic 
          ? 'تم مسح المحادثة. مرحباً بك مجدداً! كيف أستطيع مساعدتك اليوم؟'
          : 'Chat cleared. Hello again! How can I help you today?',
        timestamp: new Date(),
      }
    ]);
  }, [isArabic]);

  /**
   * Patch one `confirmation_required` card - identified by `actionId` so a
   * reply holding several requests only moves the one the user acted on.
   * Every status transition (approved, declined, failed) funnels through here.
   */
  const patchPendingAction = useCallback(
    (messageId: string, actionId: string, patchData: Partial<PendingSessionAction>): PendingSessionAction | null => {
      let patched: PendingSessionAction | null = null;
      const next = messagesRef.current.map((m) => {
        if (m.id !== messageId || m.role !== 'assistant' || m.actionCards === undefined) return m;
        let changed = false;
        const cards = m.actionCards.map((card) => {
          if (card.type !== 'confirmation_required' || card.data.actionId !== actionId) return card;
          changed = true;
          patched = { ...card.data, ...patchData };
          return { ...card, data: patched } as ChatActionCard;
        });
        return changed ? { ...m, actionCards: cards } : m;
      });
      messagesRef.current = next;
      setMessages(next);
      return patched;
    },
    []
  );

  /** Locate the card a UI tap refers to, ignoring anything already resolved. */
  const findPendingAction = useCallback(
    (messageId: string, actionId: string): PendingSessionAction | null => {
      const message = messagesRef.current.find((m) => m.id === messageId);
      const card = message?.actionCards?.find(
        (c): c is Extract<ChatActionCard, { type: 'confirmation_required' }> =>
          c.type === 'confirmation_required' && c.data.actionId === actionId
      );
      if (!message || message.role !== 'assistant' || card?.type !== 'confirmation_required') return null;
      return card.data.status === 'pending' ? card.data : null;
    },
    []
  );

  /**
   * Applies a change the model only *asked* for. This is the single place a
   * state-changing assistant action writes data, and it is reachable only from
   * the UI's Confirm button - the model reply cannot reach it.
   *
   * Returns the final status so the caller can raise a toast. A card that is
   * already resolved yields 'noop', so a double tap or a replayed restored
   * card cannot write twice.
   */
  const confirmAction = useCallback(
    async (messageId: string, actionId: string): Promise<PendingSessionAction['status'] | 'noop'> => {
      const pending = findPendingAction(messageId, actionId);
      if (!pending || pending.action !== 'complete_workout_session') return 'noop';

      // Re-read the live session instead of trusting the snapshot captured at
      // tool-call time: it may have been edited or removed since.
      const session = contextData?.sessions?.find((s: any) => String(s.id) === pending.sessionId);
      if (!session) {
        patchPendingAction(messageId, actionId, { status: 'failed' });
        return 'failed';
      }

      try {
        await saveSession({ ...session, isCompleted: true });
        if (!isMountedRef.current) return 'confirmed';
        patchPendingAction(messageId, actionId, { status: 'confirmed' });
        return 'confirmed';
      } catch (e: any) {
        console.error('Failed to apply confirmed AI action:', e);
        if (isMountedRef.current) patchPendingAction(messageId, actionId, { status: 'failed' });
        return 'failed';
      }
    },
    [contextData, saveSession, patchPendingAction, findPendingAction]
  );

  /** Declines a pending request. No write happens anywhere on this path. */
  const cancelAction = useCallback(
    (messageId: string, actionId: string): PendingSessionAction['status'] | 'noop' => {
      if (!findPendingAction(messageId, actionId)) return 'noop';
      patchPendingAction(messageId, actionId, { status: 'cancelled' });
      return 'cancelled';
    },
    [patchPendingAction, findPendingAction]
  );

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Security & Quota guard: Max length validation
    if (trimmed.length > 1000) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: isArabic 
          ? 'الرسالة طويلة جداً. يرجى كتابة رسالة أقل من 1,000 حرف.' 
          : 'Message too long. Please limit your prompt to 1,000 characters.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Rate limiting: enforce 1.5s cooldown between consecutive prompts
    const now = Date.now();
    if (now - lastSentRef.current < 1500) {
      const rateLimitMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: isArabic 
          ? 'يرجى الانتظار لحظة قبل إرسال رسالة أخرى.' 
          : 'Please wait a moment before sending another message.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, rateLimitMsg]);
      return;
    }
    lastSentRef.current = now;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const newMessages = [...messagesRef.current, newUserMsg];
    messagesRef.current = newMessages;
    setMessages(newMessages);
    setIsTyping(true);

    const requestId = ++requestIdRef.current;

    try {
      const assistantMsg = await runAssistantPipeline({
        history: newMessages,
        contextData,
        isArabic,
        saveSession,
      });

      // Ignore the reply if this request was superseded or the hook unmounted.
      if (!isMountedRef.current || requestIdRef.current !== requestId) return;
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("AI Error:", error);

      if (!isMountedRef.current || requestIdRef.current !== requestId) return;

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error?.message || (isArabic ? 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred while processing your request. Please try again.'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      if (isMountedRef.current) setIsTyping(false);
    }
  }, [contextData, saveSession, isArabic]);

  return { messages, isTyping, sendMessage, clearHistory, confirmAction, cancelAction };
}
