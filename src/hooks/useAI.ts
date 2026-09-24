import { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useData } from './useData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const aiClient = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: isArabic 
        ? 'مرحباً! أنا مساعدك الرياضي بالذكاء الاصطناعي. كيف أستطيع مساعدتك اليوم في تمرينك وتغذيتك؟'
        : 'Hi! I am your AI fitness assistant. How can I help you reach your goals today?',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const lastSentRef = useState<{ time: number }>({ time: 0 })[0];

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Security & Quota guard: Max length validation
    if (trimmed.length > 1000) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Message too long. Please limit your prompt to 1,000 characters.',
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
        content: 'Please wait a moment before sending another message.',
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
          if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
          }

          const sanitized = sanitizeAIContext(contextData);
          const systemInstruction = `You are an elite, encouraging fitness AI assistant in the MyGym app.
${isArabic ? 'CRITICAL: The user has selected Arabic. Respond primarily in natural, motivating Arabic unless asked otherwise.' : 'Respond in helpful, motivating English.'}
Here is a concise summary of the user's data for context:
${JSON.stringify(sanitized)}
Limit your responses to a few paragraphs, be concise and helpful. You have access to tools to modify the calendar. Only use tools if explicitly requested by the user or if it's the clear intent. Confirm with the user in your response after using a tool.`;

          const tools = [{
            functionDeclarations: [
              {
                name: "add_workout_session",
                description: "Schedules a new workout session for a specific date.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "The title/name of the workout (e.g. Chest Day)" },
                    date: { type: Type.STRING, description: "The ISO date string of when the workout should be scheduled. e.g. 2023-10-25T18:00:00Z" },
                    type: { type: Type.STRING, description: "The type of workout: Strength, Cardio, Yoga, or Mixed" },
                    duration: { type: Type.INTEGER, description: "Duration in minutes" }
                  },
                  required: ["title", "date", "type", "duration"]
                }
              },
              {
                name: "delete_workout_session",
                description: "Deletes a scheduled workout session from the calendar.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    sessionId: { type: Type.STRING, description: "The ID of the session to delete" }
                  },
                  required: ["sessionId"]
                }
              },
              {
                name: "complete_workout_session",
                description: "Marks a workout session as completed.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    sessionId: { type: Type.STRING, description: "The ID of the session to mark as completed" }
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

          let response;
          try {
            response = await aiClient.models.generateContent({
              model: 'gemini-3.6-flash',
              contents,
              config: {
                systemInstruction,
                tools,
              }
            });
          } catch (modelErr) {
            console.warn("Primary gemini-3.6-flash failed in useAI, trying gemini-flash-latest:", modelErr);
            response = await aiClient.models.generateContent({
              model: 'gemini-flash-latest',
              contents,
              config: {
                systemInstruction,
                tools,
              }
            });
          }

          let responseText = response.text || "";

          // Handle function calls
          if (response.functionCalls && response.functionCalls.length > 0) {
            const functionResponses = [];
            for (const call of response.functionCalls) {
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
                  result = { status: "success", message: `Successfully added ${args.title} on ${scheduledDate.toDateString()}`, sessionId: newSession.id };
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
            const followUpResponse = await aiClient.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: [
                ...contents,
                { role: 'model', parts: response.functionCalls.map(f => ({ functionCall: f })) },
                { role: 'user', parts: functionResponses.map(f => ({ functionResponse: f })) }
              ],
              config: {
                systemInstruction,
                tools,
              }
            });
            responseText = followUpResponse.text || "Action completed successfully.";
          }

          const newAssistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText || "I'm not sure how to respond to that.",
            timestamp: new Date(),
          };

          setMessages(currentMessages => [...currentMessages, newAssistantMsg]);
        } catch (error: any) {
          console.error("AI Error:", error);
          
          const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${error.message || "Failed to get response from AI."}`,
            timestamp: new Date(),
          };
          setMessages(currentMessages => [...currentMessages, errorMsg]);
        } finally {
          setIsTyping(false);
        }
      }, 0);
      
      return newMessages;
    });

  }, [contextData, saveSession, deleteSession]);

  return { messages, isTyping, sendMessage };
}
