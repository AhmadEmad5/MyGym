import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Plus, CheckCircle, ChevronRight, ChevronLeft, Flame, Sparkles } from 'lucide-react';
import { useActiveCardio } from '../hooks/useActiveCardio';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { CARDIO_COMPLETED_EVENT } from '../lib/cardioTimer';

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

  // Completed celebration toast state
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const topOffset = (!isInCurrentCardioSession && isMobile) 
    ? 'calc(58px + max(0px, env(safe-area-inset-top, 0px)))' 
    : 'calc(12px + max(0px, env(safe-area-inset-top, 0px)))';

  if (location.pathname.startsWith('/session/')) {
    return null;
  }

  return (
    <>
      {/* Completion Toast Alert */}
      <AnimatePresence>
        {completionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            style={{
              position: 'fixed',
              top: topOffset,
              left: '12px',
              right: '12px',
              margin: '0 auto',
              zIndex: 10000,
              width: 'calc(100% - 24px)',
              maxWidth: '520px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(6, 95, 70, 0.98))',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '0.85rem 1.1rem',
              boxShadow: '0 20px 45px -10px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={20} className="animate-spin" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  {isRTL ? '🎉 اكتمل تمرين الكارديو بنجاح!' : '🎉 Cardio Completed!'}
                </div>
                <div style={{ fontSize: '0.76rem', opacity: 0.9 }}>
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
                color: '#fff',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isRTL ? 'تم' : 'OK'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Global Sticky Cardio Banner */}
      <AnimatePresence>
        {activeCardio && remainingSeconds > 0 && (
          <motion.div
            key="global-cardio-timer-bar"
            initial={{ opacity: 0, y: -50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={handleReturnToWorkout}
            style={{
              position: 'fixed',
              top: topOffset,
              left: '10px',
              right: '10px',
              margin: '0 auto',
              zIndex: 9998,
              width: 'calc(100% - 20px)',
              maxWidth: '560px',
              background: 'linear-gradient(135deg, rgba(8, 14, 26, 0.96) 0%, rgba(13, 22, 38, 0.98) 100%)',
              border: isRunning ? '1.5px solid rgba(56, 189, 248, 0.55)' : '1.5px solid rgba(234, 179, 8, 0.45)',
              boxShadow: isRunning 
                ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.22)' 
                : '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 20px rgba(234, 179, 8, 0.15)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '16px',
              padding: '0.65rem 0.9rem',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              userSelect: 'none'
            }}
          >
            {/* Top Row: Info, Time, Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
              
              {/* Left Side: Animated Badge & Exercise Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isRunning 
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(16, 185, 129, 0.25))' 
                    : 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(249, 115, 22, 0.25))',
                  border: isRunning ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(234, 179, 8, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isRunning ? '#38bdf8' : '#facc15',
                  flexShrink: 0
                }}>
                  <Flame size={19} className={isRunning ? 'animate-pulse' : ''} />
                  {isRunning && (
                    <span style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8'
                    }} />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: isRunning ? '#38bdf8' : '#facc15',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}>
                      {isRunning 
                        ? (isRTL ? 'مؤقت الكارديو نشط' : 'CARDIO RUNNING') 
                        : (isRTL ? 'مؤقت الكارديو متوقف مؤقتاً' : 'CARDIO PAUSED')}
                    </span>
                    {!isInCurrentCardioSession && (
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '0.08rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'var(--text-secondary)'
                      }}>
                        {isRTL ? 'في الخلفية' : 'Background'}
                      </span>
                    )}
                  </div>

                  <h4 style={{
                    margin: '0.1rem 0 0',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {tExercise(activeCardio.exerciseName)}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0.35rem' }}>
                      ({tTitle(activeCardio.sessionTitle)})
                    </span>
                  </h4>
                </div>
              </div>

              {/* Right Side: Digital Timer & Control Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {/* Big Tabular Digits */}
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: isRunning ? '#38bdf8' : '#facc15',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isRunning ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
                  minWidth: '70px',
                  textAlign: 'right'
                }}>
                  {formattedTime}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {/* Pause / Resume button */}
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    title={isRunning ? (isRTL ? 'إيقاف مؤقت' : 'Pause') : (isRTL ? 'متابعة' : 'Resume')}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: isRunning ? 'rgba(56, 189, 248, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      border: isRunning ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(234, 179, 8, 0.45)',
                      color: isRunning ? '#38bdf8' : '#facc15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.1s active'
                    }}
                  >
                    {isRunning ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: isRTL ? 0 : 2 }} />}
                  </button>

                  {/* +1 min button */}
                  <button
                    type="button"
                    onClick={handleAddTime}
                    title="+1 min"
                    style={{
                      padding: '0 0.45rem',
                      height: '32px',
                      borderRadius: '9px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      gap: '0.15rem'
                    }}
                  >
                    <Plus size={11} />
                    <span>1m</span>
                  </button>

                  {/* Complete early and save */}
                  <button
                    type="button"
                    onClick={handleCompleteEarly}
                    title={isRTL ? 'إكمال التمرين الآن' : 'Complete now'}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={14} />
                  </button>

                  {/* Stop button */}
                  <button
                    type="button"
                    onClick={handleStop}
                    title={isRTL ? 'إيقاف' : 'Stop'}
                    style={{
                      width: '30px',
                      height: '32px',
                      borderRadius: '9px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Square size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Micro Progress Bar with % indicator and Return button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                flex: 1,
                height: '4px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: isRunning 
                    ? 'linear-gradient(90deg, #38bdf8, #10b981)' 
                    : '#facc15',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, minWidth: '32px' }}>
                {progressPercent}%
              </span>

              {!isInCurrentCardioSession && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer'
                }}>
                  <span>{isRTL ? 'العودة للتمرين' : 'Return'}</span>
                  {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
