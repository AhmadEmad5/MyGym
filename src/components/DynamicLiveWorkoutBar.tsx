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

export function DynamicLiveWorkoutBar() {
  const { data } = useData();
  const { activeCardio } = useActiveCardio();
  const { t, isRTL, tTitle, tExercise } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const timerState = useWorkoutTimer();

  const isInSession = location.pathname.startsWith('/session/');

  // Check for any active workout session started today that is not yet completed
  const activeSession = useMemo(() => {
    if (!data?.sessions) return null;
    const today = new Date();
    // Friday is strictly an off-day / gym is closed
    if (today.getDay() === 5) return null;

    const uncompletedToday = data.sessions.filter(
      s => isSameDay(new Date(s.date), today) && !s.isCompleted
    );

    if (uncompletedToday.length === 0) return null;

    // Pick session with progress or the latest one
    const inProgress = uncompletedToday.find(s => 
      s.exercises?.some(e => e.sets?.some(set => set.isCompleted || (set.repsActual && set.repsActual > 0)))
    );

    return inProgress || uncompletedToday[0];
  }, [data?.sessions]);

  // If currently in session view, no active session, or cardio timer is already active for this session, hide
  if (isInSession || !activeSession || (activeCardio && activeCardio.sessionId === activeSession.id)) return null;

  const totalSets = activeSession.exercises?.reduce((sum, e) => sum + (e.sets?.length || 0), 0) || 0;
  const completedSets = activeSession.exercises?.reduce(
    (sum, e) => sum + (e.sets?.filter(s => s.isCompleted).length || 0), 0
  ) || 0;

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const isRestTimerActive = timerState.secondsLeft !== null && timerState.secondsLeft >= 0;
  const restMinutes = isRestTimerActive ? Math.floor(timerState.secondsLeft! / 60) : 0;
  const restSeconds = isRestTimerActive ? timerState.secondsLeft! % 60 : 0;
  const formattedRest = `${restMinutes}:${restSeconds.toString().padStart(2, '0')}`;

  const handleResume = () => {
    gymAudio.triggerSubtleHaptic([20]);
    navigate(`/session/${activeSession.id}`);
  };

  const handleAdjustTimer = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    gymAudio.triggerVibration([12]);
    workoutTimer.adjust(delta);
  };

  // Ring geometry for mini timer
  const rMini = 12;
  const cMini = 2 * Math.PI * rMini; // ~75.4
  const timerFraction = isRestTimerActive && timerState.totalSeconds > 0 
    ? Math.max(0, Math.min(1, timerState.secondsLeft! / timerState.totalSeconds)) 
    : 0;
  const offsetMini = cMini * (1 - timerFraction);

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Floating Dynamic Island HUD"
        initial={{ y: -60, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -60, opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 460, damping: 32 }}
        style={{
          position: 'fixed',
          top: 'calc(10px + max(0px, env(safe-area-inset-top, 0px)))',
          left: 0,
          right: 0,
          marginInline: 'auto',
          zIndex: 9999,
          width: 'calc(100% - 24px)',
          maxWidth: isRestTimerActive ? '440px' : '410px',
          background: 'linear-gradient(135deg, rgba(12, 18, 30, 0.92) 0%, rgba(6, 10, 18, 0.96) 100%)',
          border: isRestTimerActive 
            ? '1px solid rgba(198, 244, 50, 0.4)' 
            : '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: isRestTimerActive
            ? '0 12px 32px -4px rgba(0, 0, 0, 0.75), 0 0 24px rgba(198, 244, 50, 0.2)'
            : '0 12px 32px -4px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '9999px',
          padding: '0.4rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          cursor: 'pointer',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={handleResume}
      >
        {/* Left Side: Dynamic Beacon / Circular Timer Ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          {isRestTimerActive ? (
            <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="16" cy="16" r={rMini} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                <circle
                  cx="16"
                  cy="16"
                  r={rMini}
                  fill="none"
                  stroke="#c6f432"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={cMini}
                  strokeDashoffset={offsetMini}
                  style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock className="w-3.5 h-3.5 text-[#c6f432]" style={{ color: '#c6f432' }} />
              </div>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
              position: 'relative'
            }}>
              <Dumbbell className="w-4 h-4 animate-pulse" />
              <span style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8'
              }} />
            </div>
          )}

          {/* Center Info */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {isRestTimerActive ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#c6f432',
                    letterSpacing: '0.02em'
                  }} className="tabular-nums">
                    {formattedRest}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 600 }}>
                    {isRTL ? 'وقت الراحة' : 'Resting'}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px'
                }}>
                  {tExercise(timerState.exerciseName) || tTitle(activeSession.title)}
                </span>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px'
                  }}>
                    {tTitle(activeSession.title)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                    {completedSets}/{totalSets} {t('sets')}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {progressPercent}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {isRestTimerActive && (
            <button
              type="button"
              onClick={(e) => handleAdjustTimer(e, 15)}
              className="btn btn-ghost"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title={isRTL ? 'إضافة 15 ثانية راحة' : 'Add 15s rest'}
            >
              <Plus className="w-3 h-3" />
              <span>15s</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: 800,
              borderRadius: '9999px',
              background: isRestTimerActive 
                ? 'linear-gradient(135deg, #c6f432 0%, #a3e635 100%)' 
                : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              color: isRestTimerActive ? '#0b1108' : '#ffffff',
              border: 'none',
              boxShadow: isRestTimerActive 
                ? '0 4px 12px rgba(198, 244, 50, 0.35)' 
                : '0 4px 12px rgba(56, 189, 248, 0.35)',
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
            <Play className="w-3 h-3 fill-current" />
            <span>{isRTL ? 'استئناف' : 'Resume'}</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

export default DynamicLiveWorkoutBar;
