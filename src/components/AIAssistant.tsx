import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, Bot, RotateCcw, 
  Calendar, Play, Utensils, PlusCircle, Check 
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAI, ChatActionCard } from '../hooks/useAI';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { MealRecord } from '../lib/api';
import ReactMarkdown from 'react-markdown';

export function AIAssistant() {
  const { data, saveMeal } = useData();
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isArabic = (data?.settings?.language || localStorage.getItem('mygym_lang')) === 'ar';
  const isInSession = location.pathname.startsWith('/session/');

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loggedMealIds, setLoggedMealIds] = useState<Set<string>>(new Set());
  const { messages, isTyping, sendMessage, clearHistory } = useAI(data);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isModalOpenOnPage, setIsModalOpenOnPage] = useState(false);

  useEffect(() => {
    const checkModalState = () => {
      const hasModal = 
        document.body.classList.contains('modal-open') || 
        !!document.querySelector('.portal-modal-backdrop') ||
        !!document.querySelector('[role="dialog"]');
      setIsModalOpenOnPage(hasModal);
    };

    checkModalState();
    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleClearChat = () => {
    clearHistory();
    notify(isArabic ? 'تم مسح سجل المحادثة بنجاح' : 'Chat history cleared successfully', 'info');
  };

  const handleAddMealToToday = async (messageId: string, cardData: Extract<ChatActionCard, { type: 'meal_suggestion' }>['data']) => {
    try {
      const newMeal: MealRecord = {
        id: 'ai_meal_' + Date.now(),
        date: new Date().toISOString(),
        mealType: cardData.mealType,
        title: cardData.title,
        calories: cardData.calories,
        protein: cardData.protein,
        carbs: cardData.carbs,
        fats: cardData.fats,
        aiNotes: cardData.notes || (isArabic ? 'اقتراح ذكي من مدرب FORMA' : 'Suggested by FORMA AI Coach')
      };
      await saveMeal(newMeal);
      setLoggedMealIds(prev => new Set(prev).add(messageId));
      notify(isArabic ? `تمت إضافة "${cardData.title}" إلى وجبات اليوم! 🥗` : `Added "${cardData.title}" to today's meals! 🥗`, 'success');
    } catch (e: any) {
      notify(isArabic ? 'حدث خطأ أثناء حفظ الوجبة' : 'Failed to save meal', 'error');
    }
  };

  const PROMPT_CHIPS = useMemo(() => {
    return isArabic ? [
      { icon: '🥩', text: 'اقترح وجبة بعد التمرين غنية بالبروتين (+40g)' },
      { icon: '📊', text: 'حلل التزامي وتطوري هذا الأسبوع' },
      { icon: '🔄', text: 'أشعر بإرهاق في أسفل الظهر، كيف أعدل تمرين اليوم؟' },
      { icon: '🏋️', text: 'صمم لي جدول Push/Pull/Legs متقدم' }
    ] : [
      { icon: '🥩', text: 'Suggest a post-workout high-protein meal (+40g)' },
      { icon: '📊', text: 'Analyze my consistency and progress this week' },
      { icon: '🔄', text: 'I feel lower back fatigue, how should I adapt today\'s workout?' },
      { icon: '🏋️', text: 'Design an advanced Push/Pull/Legs routine for me' }
    ];
  }, [isArabic]);

  // If inside active workout session or modal is active, hide the floating AI button
  if (isInSession || isModalOpenOnPage) return null;

  return (
    <>
      <motion.button
        className="ai-fab"
        style={{
          position: 'fixed',
          bottom: 'calc(5.5rem + max(0px, env(safe-area-inset-bottom, 0px)))',
          [isRTL ? 'left' : 'right']: '1.5rem',
          width: '3.6rem',
          height: '3.6rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(56, 189, 248, 0.45), 0 0 20px rgba(16, 185, 129, 0.25)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          zIndex: 90,
          cursor: 'pointer',
          transition: 'bottom 0.25s ease'
        }}
        whileHover={{ scale: 1.08, boxShadow: '0 12px 30px -4px rgba(56, 189, 248, 0.6)' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="ai-panel"
            style={{
              position: 'fixed',
              bottom: 'calc(9.5rem + max(0px, env(safe-area-inset-bottom, 0px)))',
              [isRTL ? 'left' : 'right']: '1.5rem',
              width: '400px',
              maxWidth: 'calc(100vw - 2rem)',
              height: '580px',
              maxHeight: 'calc(100dvh - 11rem)',
              background: 'linear-gradient(160deg, rgba(16, 25, 45, 0.96) 0%, rgba(9, 14, 25, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '24px',
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 32px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              overflow: 'hidden',
              direction: isRTL ? 'rtl' : 'ltr'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('aiAssistantTitle')}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isArabic ? 'مدرب FORMA الذكي · متصل' : 'FORMA Coach · Online'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button 
                  className="btn-icon btn-ghost" 
                  onClick={handleClearChat}
                  title={isArabic ? 'مسح المحادثة' : 'Clear Chat'}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="btn-icon btn-ghost" 
                  onClick={() => setIsOpen(false)}
                  title={isArabic ? 'إغلاق' : 'Close'}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer'
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
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
                  <div className="markdown-content" style={{
                    maxWidth: '88%',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '1.15rem',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)' 
                      : 'rgba(255, 255, 255, 0.04)',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                    border: msg.role === 'user' 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.07)',
                    borderBottomRightRadius: msg.role === 'user' ? (isRTL ? '1.15rem' : '0.25rem') : '1.15rem',
                    borderBottomLeftRadius: msg.role === 'user' ? (isRTL ? '0.25rem' : '1.15rem') : (isRTL ? '1.15rem' : '0.25rem'),
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    overflowWrap: 'break-word',
                    textAlign: isRTL ? 'right' : 'left',
                    boxShadow: msg.role === 'user' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none'
                  }}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>

                        {/* Rich Interactive Action Card */}
                        {msg.actionCard && (
                          <div style={{ marginTop: '0.65rem' }}>
                            {msg.actionCard.type === 'workout_scheduled' && (
                              <div style={{
                                padding: '0.85rem',
                                borderRadius: '0.75rem',
                                backgroundColor: 'rgba(var(--accent-primary-rgb, 14, 165, 233), 0.08)',
                                border: '1px solid rgba(var(--accent-primary-rgb, 14, 165, 233), 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--accent-primary)' }}>
                                    <Calendar className="w-4 h-4" />
                                    <span>{isArabic ? 'تمرين مجدول' : 'Scheduled Workout'}</span>
                                  </div>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.15rem 0.5rem', 
                                    borderRadius: '9999px', 
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    color: 'var(--text-secondary)'
                                  }}>
                                    {msg.actionCard.data.type}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {msg.actionCard.data.title}
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  ⏱️ {msg.actionCard.data.duration} {isArabic ? 'دقيقة' : 'min'}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.2rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (msg.actionCard?.type === 'workout_scheduled') {
                                        navigate('/session/' + msg.actionCard.data.sessionId);
                                        setIsOpen(false);
                                      }
                                    }}
                                    className="btn btn-primary"
                                    style={{
                                      padding: '0.4rem 0.5rem',
                                      fontSize: '0.76rem',
                                      borderRadius: '0.5rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.3rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>{isArabic ? 'بدء فوراً' : 'Start Now'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate('/plan');
                                      setIsOpen(false);
                                    }}
                                    className="btn btn-ghost"
                                    style={{
                                      padding: '0.4rem 0.5rem',
                                      fontSize: '0.76rem',
                                      borderRadius: '0.5rem',
                                      border: '1px solid var(--border-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{isArabic ? 'فتح بالتقويم' : 'Calendar'}</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {msg.actionCard.type === 'meal_suggestion' && (
                              <div style={{
                                padding: '0.85rem',
                                borderRadius: '0.75rem',
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: '#10b981' }}>
                                    <Utensils className="w-4 h-4" />
                                    <span>{isArabic ? 'وجبة مقترحة' : 'Meal Suggestion'}</span>
                                  </div>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.15rem 0.5rem', 
                                    borderRadius: '9999px', 
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    fontWeight: 600
                                  }}>
                                    {msg.actionCard.data.mealType}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {msg.actionCard.data.title}
                                </div>

                                {msg.actionCard.data.notes && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.3 }}>
                                    {msg.actionCard.data.notes}
                                  </div>
                                )}

                                {/* Macros Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginTop: '0.1rem' }}>
                                  <div style={{ padding: '0.3rem 0.2rem', borderRadius: '0.45rem', backgroundColor: 'rgba(239, 68, 68, 0.12)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 600 }}>{isArabic ? 'سعرة' : 'Cals'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.actionCard.data.calories}</div>
                                  </div>
                                  <div style={{ padding: '0.3rem 0.2rem', borderRadius: '0.45rem', backgroundColor: 'rgba(59, 130, 246, 0.12)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#3b82f6', fontWeight: 600 }}>{isArabic ? 'بروتين' : 'Protein'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.actionCard.data.protein}g</div>
                                  </div>
                                  <div style={{ padding: '0.3rem 0.2rem', borderRadius: '0.45rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 600 }}>{isArabic ? 'كارب' : 'Carbs'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.actionCard.data.carbs}g</div>
                                  </div>
                                  <div style={{ padding: '0.3rem 0.2rem', borderRadius: '0.45rem', backgroundColor: 'rgba(139, 92, 246, 0.12)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#8b5cf6', fontWeight: 600 }}>{isArabic ? 'دهون' : 'Fats'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.actionCard.data.fats}g</div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={loggedMealIds.has(msg.id)}
                                  onClick={() => {
                                    if (msg.actionCard?.type === 'meal_suggestion') {
                                      handleAddMealToToday(msg.id, msg.actionCard.data);
                                    }
                                  }}
                                  style={{
                                    marginTop: '0.2rem',
                                    padding: '0.45rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                    backgroundColor: loggedMealIds.has(msg.id) ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
                                    color: loggedMealIds.has(msg.id) ? '#10b981' : '#ffffff',
                                    border: loggedMealIds.has(msg.id) ? '1px solid #10b981' : 'none',
                                    cursor: loggedMealIds.has(msg.id) ? 'default' : 'pointer'
                                  }}
                                >
                                  {loggedMealIds.has(msg.id) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{isArabic ? 'تمت الإضافة إلى وجبات اليوم ✓' : 'Added to Today\'s Meals ✓'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <PlusCircle className="w-3.5 h-3.5" />
                                      <span>{isArabic ? 'إضافة إلى وجبات اليوم' : 'Add to Today\'s Meals'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {(msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '1rem' }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                  >
                    {t('aiAssistantTyping')}
                  </motion.div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Prompt Chips */}
            <div 
              style={{ 
                padding: '0.65rem 0.85rem', 
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                gap: '0.45rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {PROMPT_CHIPS.map((chip, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  disabled={isTyping}
                  onClick={() => sendMessage(chip.text)}
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    color: 'var(--text-primary)',
                    cursor: isTyping ? 'not-allowed' : 'pointer',
                    opacity: isTyping ? 0.6 : 1,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.text}</span>
                </motion.button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center',
              background: 'rgba(10, 16, 28, 0.85)'
            }}>
              <input 
                type="text" 
                className="input" 
                placeholder={t('aiAssistantPlaceholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                  flex: 1,
                  textAlign: isRTL ? 'right' : 'left',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '0.65rem 0.95rem',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                style={{
                  minWidth: '42px',
                  minHeight: '42px',
                  padding: '0.5rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: !inputValue.trim() || isTyping ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: !inputValue.trim() || isTyping ? 'not-allowed' : 'pointer',
                  boxShadow: !inputValue.trim() || isTyping ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.18s ease'
                }} 
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAssistant;

