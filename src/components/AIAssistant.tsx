import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, RotateCcw, AlertTriangle,
  Calendar, Play, Utensils, PlusCircle, Check, Square
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAI, ChatActionCard } from '../hooks/useAI';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { MealRecord } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { useReducedMotion } from './performance/useReducedMotion';

const STARTING_STEPS_EN = ['Reading your training history', 'Analysing recent volume', 'Drafting coaching cues'];
const STARTING_STEPS_AR = ['قراءة سجل تدريبك', 'تحليل الحجم الأخير', 'صياغة الإرشادات'];

export function AIAssistant() {
  const { data, saveMeal } = useData();
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const isArabic = (data?.settings?.language || localStorage.getItem('mygym_lang')) === 'ar';
  const isInSession = location.pathname.startsWith('/session/');

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loggedMealIds, setLoggedMealIds] = useState<Set<string>>(new Set());
  const { messages, isTyping, sendMessage, clearHistory } = useAI(data);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isModalOpenOnPage, setIsModalOpenOnPage] = useState(false);
  const [stoppedAfterIndex, setStoppedAfterIndex] = useState<number | null>(null);
  const [startingStep, setStartingStep] = useState(0);

  const visibleMessages = useMemo(() => {
    if (stoppedAfterIndex === null) return messages;
    return messages.slice(0, stoppedAfterIndex);
  }, [messages, stoppedAfterIndex]);

  useEffect(() => {
    if (!isTyping) {
      setStartingStep(0);
      return;
    }
    const timer = setInterval(() => {
      setStartingStep(prev => (prev + 1) % 3);
    }, 1400);
    return () => clearInterval(timer);
  }, [isTyping]);

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [reducedMotion]);

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, isTyping, isOpen, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    setStoppedAfterIndex(null);
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleStop = () => {
    setStoppedAfterIndex(messages.length);
  };

  const handleClearChat = () => {
    clearHistory();
    setStoppedAfterIndex(null);
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
    } catch {
      notify(isArabic ? 'حدث خطأ أثناء حفظ الوجبة' : 'Failed to save meal', 'error');
    }
  };

  const hasRealConversation = visibleMessages.some(msg => msg.role === 'user');

  const renderMessageBody = (content: string, isStreaming: boolean) => (
    <div className="forma-ai-stream markdown-content">
      <ReactMarkdown>{content}</ReactMarkdown>
      {isStreaming && <span className="forma-ai-cursor" aria-hidden="true" />}
    </div>
  );

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
                  className="btn-icon btn-ghost touch-target"
                  onClick={handleClearChat}
                  title={isArabic ? 'مسح المحادثة' : 'Clear Chat'}
                  aria-label={isArabic ? 'مسح المحادثة' : 'Clear chat'}
                  style={{
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  className="btn-icon btn-ghost touch-target"
                  onClick={() => setIsOpen(false)}
                  title={isArabic ? 'إغلاق' : 'Close'}
                  aria-label={isArabic ? 'إغلاق' : 'Close'}
                  style={{
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer'
                  }}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label={isArabic ? 'محادثة المدرب الذكي' : 'AI coach conversation'}
              style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {!hasRealConversation && !isTyping && (
                <div className="forma-ai-empty">
                  <Bot size={26} aria-hidden="true" style={{ color: 'var(--accent-primary)' }} />
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {isArabic ? 'ابدأ بسؤال عن تدريبك' : 'Ask anything about your training'}
                  </strong>
                  <span>
                    {isArabic
                      ? 'المدرب يقرأ سجل جلساتك ووجباتك واستشفاءك. اختر اقتراحاً أو اكتب سؤالك.'
                      : 'Your coach reads your sessions, meals and recovery. Pick a suggestion or type your own question.'}
                  </span>
                </div>
              )}

              {visibleMessages.map((msg) => {
                const isFailedReply = msg.role === 'assistant' && /^Error:/i.test(msg.content.trim());
                return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {isFailedReply && (
                    <div className="forma-ai-error" role="alert" style={{ maxWidth: '88%', marginBottom: '0.35rem' }}>
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={14} aria-hidden="true" />
                        {isArabic ? 'تعذر الرد' : 'The coach could not answer'}
                      </strong>
                      <span>{msg.content.replace(/^Error:\s*/i, '')}</span>
                    </div>
                  )}
                  <div
                    className={isFailedReply ? 'forma-ai-stream markdown-content' : undefined}
                    style={{
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
                      borderStartEndRadius: msg.role === 'user' ? (isRTL ? '1.15rem' : '0.25rem') : '1.15rem',
                      borderStartStartRadius: msg.role === 'user' ? (isRTL ? '0.25rem' : '1.15rem') : (isRTL ? '1.15rem' : '0.25rem'),
                      borderEndEndRadius: msg.role === 'user' ? (isRTL ? '1.15rem' : '0.25rem') : '1.15rem',
                      borderEndStartRadius: msg.role === 'user' ? (isRTL ? '0.25rem' : '1.15rem') : (isRTL ? '1.15rem' : '0.25rem'),
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      overflowWrap: 'break-word',
                      textAlign: isRTL ? 'right' : 'left',
                      boxShadow: msg.role === 'user' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none',
                      display: isFailedReply ? 'none' : undefined
                    }}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <>
                        {renderMessageBody(msg.content, false)}

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
                );
              })}

              {isTyping && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '1rem'
                  }}
                >
                  <span aria-hidden="true" className="forma-ai-cursor" />
                  <motion.span
                    animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                    transition={reducedMotion ? undefined : { repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                  >
                    {(isArabic ? STARTING_STEPS_AR : STARTING_STEPS_EN)[startingStep]}…
                  </motion.span>
                </div>
              )}

              {stoppedAfterIndex !== null && (
                <div className="forma-state-panel" role="status" style={{ alignSelf: 'stretch' }}>
                  <strong>{isArabic ? 'تم إيقاف الرد' : 'Response stopped'}</strong>
                  <span>{isArabic ? 'يمكنك إرسال سؤال جديد في أي وقت.' : 'You can send a new question at any time.'}</span>
                  <button
                    type="button"
                    className="forma-figure-toggle"
                    style={{ marginBlockStart: '0.35rem' }}
                    onClick={() => setStoppedAfterIndex(null)}
                  >
                    {isArabic ? 'عرض الرد الكامل' : 'Show full response'}
                  </button>
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
                  whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  disabled={isTyping}
                  onClick={() => { setStoppedAfterIndex(null); sendMessage(chip.text); }}
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    minHeight: '40px',
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
                  <span aria-hidden="true">{chip.icon}</span>
                  <span>{chip.text}</span>
                </motion.button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{
              padding: '0.75rem 1rem',
              paddingBlockEnd: 'calc(0.75rem + max(8px, env(safe-area-inset-bottom, 0px)))',
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
                aria-label={t('aiAssistantPlaceholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: '46px',
                  textAlign: isRTL ? 'right' : 'left',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '0.65rem 0.95rem',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)'
                }}
              />
              <AnimatePresence mode="wait" initial={false}>
                {isTyping ? (
                  <motion.button
                    key="stop"
                    type="button"
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    onClick={handleStop}
                    aria-label={isArabic ? 'إيقاف الرد' : 'Stop generating'}
                    style={{
                      minWidth: '46px',
                      minHeight: '46px',
                      padding: '0.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'color-mix(in srgb, var(--danger) 22%, transparent)',
                      color: 'var(--danger)',
                      border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)',
                      cursor: 'pointer'
                    }}
                  >
                    <Square size={16} fill="currentColor" aria-hidden="true" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="send"
                    type="submit"
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    aria-label={isArabic ? 'إرسال' : 'Send message'}
                    style={{
                      minWidth: '46px',
                      minHeight: '46px',
                      padding: '0.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: !inputValue.trim() ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: !inputValue.trim() ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.18s ease'
                    }}
                    disabled={!inputValue.trim()}
                  >
                    <Send className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAssistant;

