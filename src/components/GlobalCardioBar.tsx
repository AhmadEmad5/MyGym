import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Plus, CheckCircle, ChevronRight, ChevronLeft, Flame, Sparkles } from 'lucide-react';
import { useActiveCardio } from '../hooks/useActiveCardio';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { CARDIO_COMPLETED_EVENT } from '../lib/cardioTimer';
import { useReducedMotion } from './performance/useReducedMotion';

const BAR_RESERVED_HEIGHT = 'calc(5.2rem + max(0px, env(safe-area-inset-top, 0px)))';

export function GlobalCardioBar() {
  const {
    activeCardio,
    remainingSeconds,
    formattedTime,
    progressPercent,
    isRunning,
    pause,
    resume,
    addTime,
    stop,
    complete
  } = useActiveCardio();

  const { t, isRTL, tTitle, tExercise } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  const [completionNotice, setCompletionNotice] = useState<{
    exerciseName: string;
    sessionTitle: string;
    durationMinutes: number;
    burnedCalories: number;
  } | null>(null);

  useEffect(() => {
    const handleCompleted = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        setCompletionNotice(customEvent.detail);
        gymAudio.playCelebrationFanfare();
        setTimeout(() => setCompletionNotice(null), 6000);
      }
    };

    window.addEventListener(CARDIO_COMPLETED_EVENT, handleCompleted);
    return () => window.removeEventListener(CARDIO_COMPLETED_EVENT, handleCompleted);
  }, []);

  const isInCurrentCardioSession = Boolean(
    activeCardio && location.pathname === `/session/${activeCardio.sessionId}`
  );

  const isHiddenRoute = location.pathname.startsWith('/session/');

  const handleReturnToWorkout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCardio) {
      gymAudio.triggerSubtleHaptic([15]);
      navigate(`/session/${activeCardio.sessionId}`);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pause();
    } else {
      resume();
    }
  };

  const handleAddTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    addTime(60);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isRTL ? 'هل أنت متأكد من إيقاف مؤقت الكارديو؟' : 'Stop cardio timer?')) {
      stop();
    }
  };

  const handleCompleteEarly = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isRTL ? 'هل تريد إنهاء تمرين الكارديو الآن واحتسابه كمكتمل؟' : 'Complete cardio now and save progress?')) {
      await complete();
    }
  };

  if (isHiddenRoute) return null;

  const showBar = Boolean(activeCardio && remainingSeconds > 0);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          display: showBar ? 'block' : 'none',
          blockSize: BAR_RESERVED_HEIGHT,
          flex: '0 0 auto',
          overflowAnchor: 'none'
        }}
      />

      <AnimatePresence>
        {completionNotice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -60 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -60 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 450, damping: 28 }}
            style={{
              position: 'fixed',
              insetBlockStart: 'calc(0.6rem + max(0px, env(safe-area-inset-top, 0px)))',
              insetInlineStart: '0.75rem',
              insetInlineEnd: '0.75rem',
              marginInline: 'auto',
              zIndex: 10000,
              width: 'calc(100% - 1.5rem)',
              maxWidth: '520px',
              background: 'linear-gradient(135deg, var(--success), #059669)',
              color: '#04140d',
              borderRadius: '16px',
              padding: '0.85rem 1.1rem',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <div
                aria-hidden="true"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkles size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  {isRTL ? '🎉 اكتمل تمرين الكارديو بنجاح!' : '🎉 Cardio Completed!'}
                </div>
                <div style={{ fontSize: '0.76rem', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tExercise(completionNotice.exerciseName)} · {completionNotice.durationMinutes} {t('min')} · ~{completionNotice.burnedCalories} kcal
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletionNotice(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#04140d',
                borderRadius: '10px',
                minHeight: '44px',
                padding: '0.35rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isRTL ? 'تم' : 'OK'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBar && activeCardio && (
          <motion.aside
            key="global-cardio-timer-bar"
            aria-label={isRTL ? 'مؤقت الكارديو العام' : 'Global cardio timer'}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -50 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -50 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 28 }}
            onClick={handleReturnToWorkout}
            style={{
              position: 'fixed',
              insetBlockStart: 'calc(0.6rem + max(0px, env(safe-area-inset-top, 0px)))',
              insetInlineStart: '0.75rem',
              insetInlineEnd: '0.75rem',
              marginInline: 'auto',
              zIndex: 900,
              width: 'calc(100% - 1.5rem)',
              maxWidth: '560px',
              background: 'var(--premium-surface)',
              border: isRunning
                ? '1.5px solid color-mix(in srgb, var(--accent-primary) 55%, transparent)'
                : '1.5px solid color-mix(in srgb, var(--warning) 45%, transparent)',
              boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '16px',
              padding: '0.6rem 0.8rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              boxSizing: 'border-box',
              userSelect: 'none',
              willChange: 'transform, opacity',
              contain: 'layout paint'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: isRunning ? 'var(--premium-soft)' : 'color-mix(in srgb, var(--warning) 15%, transparent)',
                    border: '1px solid var(--premium-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isRunning ? 'var(--accent-primary)' : 'var(--warning)',
                    flexShrink: 0
                  }}
                >
                  <Flame size={19} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: isRunning ? 'var(--accent-primary)' : 'var(--warning)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {isRunning
                        ? (isRTL ? 'مؤقت الكارديو نشط' : 'CARDIO RUNNING')
                        : (isRTL ? 'مؤقت الكارديو متوقف مؤقتاً' : 'CARDIO PAUSED')}
                    </span>
                    {!isInCurrentCardioSession && (
                      <span style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {isRTL ? 'في الخلفية' : 'Background'}
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0.1rem 0 0', fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tExercise(activeCardio.exerciseName)}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0.35rem' }}>
                      ({tTitle(activeCardio.sessionTitle)})
                    </span>
                  </h4>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <div
                  className="session-countdown"
                  style={{
                    fontSize: '1.4rem',
                    color: isRunning ? 'var(--accent-primary)' : 'var(--warning)',
                    minWidth: '64px',
                    textAlign: 'end'
                  }}
                >
                  {formattedTime}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    aria-pressed={isRunning}
                    aria-label={isRunning ? (isRTL ? 'إيقاف مؤقت' : 'Pause') : (isRTL ? 'متابعة' : 'Resume')}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '11px',
                      background: isRunning ? 'var(--premium-soft)' : 'color-mix(in srgb, var(--warning) 20%, transparent)',
                      border: '1px solid var(--premium-line)',
                      color: isRunning ? 'var(--accent-primary)' : 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {isRunning ? <Pause size={16} aria-hidden="true" /> : <Play size={16} style={{ marginInlineStart: isRTL ? 0 : 2 }} aria-hidden="true" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTime}
                    aria-label={isRTL ? 'إضافة دقيقة' : 'Add 1 minute'}
                    style={{
                      padding: '0 0.5rem',
                      height: '44px',
                      borderRadius: '11px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--premium-line)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      gap: '0.15rem'
                    }}
                  >
                    <Plus size={12} aria-hidden="true" />
                    <span>1m</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteEarly}
                    aria-label={isRTL ? 'إكمال التمرين الآن' : 'Complete now'}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '11px',
                      background: 'color-mix(in srgb, var(--success) 20%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--success) 40%, transparent)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label={isRTL ? 'إيقاف' : 'Stop'}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '11px',
                      background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Square size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={isRTL ? 'تقدم الكارديو' : 'Cardio progress'}
                style={{ flex: 1, height: '4px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: isRunning ? 'var(--accent-primary)' : 'var(--warning)',
                    borderRadius: '999px',
                    transition: reducedMotion ? 'none' : 'width 0.4s ease'
                  }}
                />
              </div>

              <span className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, minWidth: '32px' }}>
                {progressPercent}%
              </span>

              {!isInCurrentCardioSession && (
                <button
                  type="button"
                  onClick={handleReturnToWorkout}
                  style={{
                    minHeight: '40px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer'
                  }}
                >
                  <span>{isRTL ? 'العودة للتمرين' : 'Return'}</span>
                  {isRTL ? <ChevronLeft size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                </button>
              )}
            </div>

            <span className="forma-sr-only" role="status" aria-live="polite" aria-atomic="true">
              {isRTL
                ? `${tExercise(activeCardio.exerciseName)}: ${formattedTime} متبقية، ${progressPercent}% مكتمل.`
                : `${tExercise(activeCardio.exerciseName)}: ${formattedTime} remaining, ${progressPercent}% complete.`}
            </span>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
