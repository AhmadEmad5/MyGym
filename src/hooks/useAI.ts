import { useState, useCallback } from 'react';
import { AppData } from '../lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useAI(data: AppData | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I am your AI fitness assistant. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((content: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      let responseContent = "I'm a mock AI right now, but soon I'll be connected to an LLM to help you with your fitness goals!";
      
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('form') || lowerContent.includes('tip')) {
        responseContent = "Remember to keep your core tight and back straight. Focus on the mind-muscle connection!";
      } else if (lowerContent.includes('missed') || lowerContent.includes('reschedule')) {
        responseContent = "I noticed you missed leg day. Would you like me to reschedule it for tomorrow?";
      } else if (lowerContent.includes('history') || lowerContent.includes('progress')) {
        const streak = data?.history.length || 0;
        responseContent = `You've completed ${streak} workouts in total. Keep up the great work!`;
      }

      const newAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      setIsTyping(false);
    }, 1500);
  }, [data]);

  return { messages, isTyping, sendMessage };
}
