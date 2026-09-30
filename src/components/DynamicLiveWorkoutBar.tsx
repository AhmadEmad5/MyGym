import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Dumbbell, Clock, Plus } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { useData } from '../hooks/useData';
import { useActiveCardio } from '../hooks/useActiveCardio';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useWorkoutTimer, workoutTimer } from '../lib/workoutTimer';
import { useReducedMotion } from './performance/useReducedMotion';

const BAR_INSET = 'max(0.75rem, var(--shell-safe-inline-start, 0px))';

export function DynamicLiveWorkoutBar() {
  const { data } = useData();
  const { activeCardio, remainingSeconds } = useActiveCardio();
  const { t, isRTL, tTitle, tExercise } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const timerState = useWorkoutTimer();
  const reducedMotion = useReducedMotion();

  const isInSession = location.pathname.startsWith('/session/');

  const activeSession = useMemo(() => {
    if (!data?.sessions) return null;
    const today = new Date();
    if (today.getDay() === 5) return null;

    const uncompletedToday = data.sessions.filter(
      s => isSameDay(new Date(s.date), today) && !s.isCompleted
    );

    if (uncompletedToday.length === 0) return null;

    const inProgress = uncompletedToday.find(s =>
      s.exercises?.some(e => e.sets?.some(set => set.isCompleted || (set.repsActual && set.repsActual > 0)))
    );

    return inProgress || uncompletedToday[0];
  }, [data?.sessions]);

  // Both global bars claim the same fixed slot at the top of the viewport, so
  // they must never be on screen together: the cardio timer owns the slot while
  // it is running (it carries its own controls and a way back to the workout),
  // and this bar owns it the rest of the time.
  const isCardioBarOnScreen = Boolean(activeCardio && remainingSeconds > 0);

  const shouldRender = Boolean(
    !isInSession
    && activeSession
    && !(activeCardio && (activeCardio.sessionId === activeSession.id || isCardioBarOnScreen))
  );

  const totalSets = activeSession?.exercises?.reduce((sum, e) => sum + (e.sets?.length || 0), 0) || 0;
  const completedSets = activeSession?.exercises?.reduce(
    (sum, e) => sum + (e.sets?.filter(s => s.isCompleted).length || 0), 0
  ) || 0;

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const isRestTimerActive = timerState.secondsLeft !== null && timerState.secondsLeft >= 0;
  const restMinutes = isRestTimerActive ? Math.floor(timerState.secondsLeft! / 60) : 0;
  const restSeconds = isRestTimerActive ? timerState.secondsLeft! % 60 : 0;
  const formattedRest = `${restMinutes}:${restSeconds.toString().padStart(2, '0')}`;

  const handleResume = () => {
    if (!activeSession) return;
    gymAudio.triggerSubtleHaptic([20]);
    navigate(`/session/${activeSession.id}`);
  };

  const handleAdjustTimer = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    gymAudio.triggerVibration([12]);
    workoutTimer.adjust(delta);
  };

  const rMini = 12;
  const cMini = 2 * Math.PI * rMini;
  const timerFraction = isRestTimerActive && timerState.totalSeconds > 0
    ? Math.max(0, Math.min(1, timerState.secondsLeft! / timerState.totalSeconds))
    : 0;
  const offsetMini = cMini * (1 - timerFraction);

  const sessionLabel = activeSession ? tTitle(activeSession.title) : '';
  const restSubLabel = timerState.exerciseName
    ? tExercise(timerState.exerciseName)
    : sessionLabel;
  const statusText = isRestTimerActive
    ? `${formattedRest} · ${isRTL ? 'وقت الراحة' : 'Resting'} · ${restSubLabel}`
    : `${sessionLabel} · ${completedSets}/${totalSets} ${t('sets')} · ${progressPercent}%`;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          display: shouldRender ? 'block' : 'none',
          blockSize: 'calc(3.4rem + max(0px, var(--shell-safe-top, 0px)))',
          flex: '0 0 auto'
        }}
      />

      <AnimatePresence>
        {shouldRender && activeSession && (
          <motion.aside
            aria-label={isRTL ? 'شريط التمرين المباشر' : 'Live workout bar'}
            initial={reducedMotion ? { opacity: 0 } : { y: -60, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { y: -60, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 32 }}
            style={{
              position: 'fixed',
              insetBlockStart: 'calc(0.5rem + max(0px, var(--shell-safe-top, 0px)))',
              insetInlineStart: BAR_INSET,
              insetInlineEnd: BAR_INSET,
              marginInline: 'auto',
              zIndex: 900,
              inlineSize: 'calc(100% - 1.5rem)',
              maxWidth: '440px',
              minHeight: '2.6rem',
              boxSizing: 'border-box',
              background: 'var(--premium-surface)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent)',
              boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '9999px',
              padding: '0.35rem 0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              cursor: 'pointer',
              direction: isRTL ? 'rtl' : 'ltr',
              willChange: 'transform, opacity',
              contain: 'layout paint'
            }}
            onClick={handleResume}
            onKeyDown={(event) => {
              // The bar is tappable end-to-end, so it needs a keyboard
              // equivalent. Role stays `complementary` so the nested rest-timer
              // and Resume controls keep their own semantics.
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleResume();
              }
            }}
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              {isRestTimerActive ? (
                <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }} aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="16" cy="16" r={rMini} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                    <circle
                      cx="16"
                      cy="16"
                      r={rMini}
                      fill="none"
                      stroke="var(--success)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={cMini}
                      strokeDashoffset={offsetMini}
                      style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.25s linear' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  </div>
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--premium-soft)',
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    flexShrink: 0
                  }}
                >
                  <Dumbbell className="w-4 h-4" />
                </div>
              )}

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {isRestTimerActive ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--success)' }}>
                        {formattedRest}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {isRTL ? 'وقت الراحة' : 'Resting'}
                      </span>
                    </div>
                    <span title={restSubLabel} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40vw' }}>
                      {restSubLabel}
                    </span>
                  </>
                ) : (
                  <>
                    <span title={sessionLabel} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40vw' }}>
                      {sessionLabel}
                    </span>
                    <span className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {completedSets}/{totalSets} {t('sets')} · {progressPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              {isRestTimerActive && (
                <button
                  type="button"
                  onClick={(e) => handleAdjustTimer(e, 15)}
                  aria-label={isRTL ? 'إضافة 15 ثانية راحة' : 'Add 15s rest'}
                  className="touch-target"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: '0 0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--premium-line)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />
                  <span>15s</span>
                </button>
              )}

              <button
                type="button"
                className="touch-target"
                style={{
                  minHeight: '44px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  background: 'var(--accent-primary)',
                  color: '#04121b',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
              >
                <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                <span>{isRTL ? 'استئناف' : 'Resume'}</span>
              </button>
            </div>

            <span className="forma-sr-only">{statusText}</span>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default DynamicLiveWorkoutBar;
