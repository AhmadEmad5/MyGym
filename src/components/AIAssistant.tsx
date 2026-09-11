import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { AppData, api } from '../lib/api';

export function AIAssistant() {
  const [data, setData] = useState<AppData | null>(null);
  
  useEffect(() => {
    api.getData().then(setData);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isTyping, sendMessage } = useAI(data);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <>
      <motion.button
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          zIndex: 90,
          cursor: 'pointer'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '6rem',
              right: '2rem',
              width: '350px',
              height: '500px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-tertiary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Assistant</h3>
              </div>
              <button 
                className="btn-icon btn-ghost" 
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.25rem' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    borderBottomRightRadius: msg.role === 'user' ? '0' : '1rem',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '0' : '1rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.4
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '1rem', borderBottomLeftRadius: 0 }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                  >
                    Typing...
                  </motion.div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Ask about workouts..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }} disabled={!inputValue.trim()}>
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
