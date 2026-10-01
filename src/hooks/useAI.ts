import { useState, useCallback, useEffect } from 'react';
import { useData } from './useData';
import { callWithModelFallback } from '../lib/gemini';

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
    };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionCard?: ChatActionCard;
}

export const CHAT_STORAGE_KEY = 'forma_ai_chat_history';

function sanitizeAIContext(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  return {
    user: raw.user ? { name: raw.user.name, email: raw.user.email } : undefined,
    settings: raw.settings ? {
      weightUnit: raw.settings.weightUnit,
      restTimerSeconds: raw.settings.restTimerSeconds,
      language: raw.settings.language
    } : undefined,
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

export function useAI(fallbackData: any = null) {
  const { data, saveSession, deleteSession } = useData();
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
              timestamp: new Date(m.timestamp)
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
  const lastSentRef = useState<{ time: number }>({ time: 0 })[0];

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
    if (now - lastSentRef.time < 1500) {
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
    lastSentRef.time = now;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const newMessages = [...prev, newUserMsg];
      setIsTyping(true);
      
      setTimeout(async () => {
        try {
          const sanitized = sanitizeAIContext(contextData);
          const systemInstruction = `You are an elite, encouraging fitness AI assistant in the FORMA app.
${isArabic ? 'CRITICAL: The user has selected Arabic. Respond primarily in natural, motivating Arabic unless asked otherwise.' : 'Respond in helpful, motivating English.'}
Here is a concise summary of the user's data for context:
${JSON.stringify(sanitized)}
Limit your responses to a few paragraphs, be concise and helpful.

CRITICAL INSTRUCTIONS FOR INTERACTIVE ACTION CARDS:
1. If the user asks for a meal suggestion, post-workout food, high-protein recipe, or diet idea: YOU MUST CALL the 'suggest_meal' tool so an interactive action card is rendered.
2. If the user asks to schedule, plan, or add a workout: YOU MUST CALL the 'add_workout_session' tool so that an interactive workout card is rendered.
Only use tools if explicitly requested by the user or if it's the clear intent. Confirm with the user in your response after using a tool.`;

          const tools = [{
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
                    mealType: { type: 'string', description: "Meal type: breakfast, lunch, dinner, or snack" },
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
                name: "delete_workout_session",
                description: "Deletes a scheduled workout session from the calendar.",
                parameters: {
                  type: 'object',
                  properties: {
                    sessionId: { type: 'string', description: "The ID of the session to delete" }
                  },
                  required: ["sessionId"]
                }
              },
              {
                name: "complete_workout_session",
                description: "Marks a workout session as completed.",
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

          const contents = newMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }));

          const response = await callWithModelFallback((model, client) =>
            client.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                tools,
              }
            })
          );

          let responseText = response.text || "";
          let actionCard: ChatActionCard | undefined = undefined;

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
                    id: Date.now().toString() + Math.floor(Math.random()*1000),
                    title: args.title,
                    date: dateStr,
                    duration: args.duration || 60,
                    type: args.type || 'Strength',
                    notes: "Added via AI Assistant",
                    isCompleted: false,
                    exercises: []
                  };
                  await saveSession(newSession);
                  
                  actionCard = {
                    type: 'workout_scheduled',
                    data: {
                      sessionId: newSession.id,
                      title: newSession.title,
                      date: newSession.date,
                      duration: newSession.duration,
                      type: newSession.type
                    }
                  };
                  result = { status: "success", message: `Successfully added ${args.title} on ${scheduledDate.toDateString()}`, sessionId: newSession.id };
                } else if (call.name === 'suggest_meal') {
                  const args = call.args as any;
                  const mType = (args.mealType || 'lunch').toLowerCase();
                  actionCard = {
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
                  };
                  result = { status: "success", message: `Meal suggestion card ready for ${args.title}` };
                } else if (call.name === 'delete_workout_session') {
                  const args = call.args as any;
                  await deleteSession(args.sessionId);
                  result = { status: "success", message: `Successfully deleted session ${args.sessionId}` };
                } else if (call.name === 'complete_workout_session') {
                  const args = call.args as any;
                  const sessionToComplete = contextData?.sessions?.find((s: any) => s.id === args.sessionId);
                  if (sessionToComplete) {
                    await saveSession({ ...sessionToComplete, isCompleted: true });
                    result = { status: "success", message: `Successfully marked session ${args.sessionId} as completed` };
                  } else {
                    result = { status: "error", message: `Session ${args.sessionId} not found` };
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

            // Send function response back to the model to get final response
            const followUpResponse = await callWithModelFallback((model, client) =>
              client.models.generateContent({
                model,
                contents: [
                  ...contents,
                  { role: 'model', parts: functionCalls.map((f: any) => ({ functionCall: f })) },
                  { role: 'user', parts: functionResponses.map(f => ({ functionResponse: f })) }
                ],
                config: {
                  systemInstruction,
                  tools,
                }
              })
            );
            responseText = followUpResponse.text || "Action completed successfully.";
          }

          const newAssistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText || "I'm not sure how to respond to that.",
            timestamp: new Date(),
            actionCard
          };

          setMessages(currentMessages => [...currentMessages, newAssistantMsg]);
        } catch (error: any) {
          console.error("AI Error:", error);
          
          const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: error?.message || (isArabic ? 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred while processing your request. Please try again.'),
            timestamp: new Date(),
          };
          setMessages(currentMessages => [...currentMessages, errorMsg]);
        } finally {
          setIsTyping(false);
        }
      }, 0);
      
      return newMessages;
    });

  }, [contextData, saveSession, deleteSession, isArabic]);

  return { messages, isTyping, sendMessage, clearHistory };
}
