import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Minimize2, 
  Play, 
  Pause, 
  Check, 
  Dumbbell, 
  Sparkles,
  Zap
} from 'lucide-react';
import { gymAudio } from '../lib/audio';
import { useTranslation } from '../lib/i18n';
import { useReducedMotion } from './performance/useReducedMotion';

interface GlanceableRestOverlayProps {
  isOpen: boolean;
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  exerciseName?: string;
  nextSetNumber?: number;
  totalSets?: number;
  targetWeight?: number;
  targetReps?: number;
  weightUnit?: string;
  onAdjustTime: (delta: number) => void;
  onTogglePause: () => void;
  onSkipRest: () => void;
  onClose: () => void;
}

export function GlanceableRestOverlay({
  isOpen,
  secondsLeft,
  totalSeconds,
  isPaused,
  exerciseName,
  nextSetNumber,
  totalSets,
  targetWeight,
  targetReps,
  weightUnit = 'kg',
  onAdjustTime,
  onTogglePause,
  onSkipRest,
  onClose,
}: GlanceableRestOverlayProps) {
  const { isRTL, tExercise } = useTranslation();
  const reducedMotion = useReducedMotion();

  // Screen Wake Lock while rest overlay is active
  useEffect(() => {
    if (!isOpen) return;

    let wakeLockSentinel: any = null;
    let isMounted = true;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (isMounted) {
            wakeLockSentinel = lock;
          } else {
            lock.release().catch(() => {});
          }
        }
      } catch {
        // WakeLock may fail if device policy or battery saver prevents it
      }
    }

    void requestWakeLock();

    return () => {
      isMounted = false;
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Haptic cue when countdown enters final 3 seconds
  useEffect(() => {
    if (!isOpen) return;
    if (secondsLeft > 0 && secondsLeft <= 3 && !isPaused) {
      gymAudio.triggerSubtleHaptic([20]);
    }
  }, [secondsLeft, isOpen, isPaused]);

  if (!isOpen) return null;

  const validTotal = totalSeconds > 0 ? totalSeconds : 90;
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / validTotal));
  const isFinished = secondsLeft === 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG ring properties
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={isRTL ? 'مؤقت الراحة المكبر' : 'Glanceable Rest Countdown'}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: '#040608',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'calc(1.2rem + max(0px, var(--shell-safe-top, 0px))) 1.5rem calc(1.5rem + max(0px, var(--shell-safe-bottom, 0px)))',
          userSelect: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: isFinished
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 242, 254, 0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Top Header Controls */}
        <header
          style={{
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isFinished ? '#34d399' : '#38bdf8'
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isRTL ? 'وضع الراحة الرياضي' : 'OLED Rest View'}</span>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              {isRTL ? 'الشاشة نشطة' : 'Screen Awake'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isRTL ? 'تصغير الشاشة' : 'Minimize rest screen'}
            className="touch-target-comfortable"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </header>

        {/* Center: Massive Tabular Countdown with SVG Circular Track */}
        <main
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto 0'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '320px',
              height: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* SVG Circular Progress Ring */}
            <svg
              width="320"
              height="320"
              viewBox="0 0 320 320"
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%'
              }}
            >
              {/* Background Track */}
              <circle
                cx="160"
                cy="160"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.07)"
                strokeWidth="12"
              />
              {/* Dynamic Fill Ring */}
              <motion.circle
                cx="160"
                cy="160"
                r={radius}
                fill="none"
                stroke={isFinished ? '#10b981' : isPaused ? '#f59e0b' : '#00f2fe'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
                style={{
                  filter: isFinished
                    ? 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.6))'
                    : 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.5))'
                }}
              />
            </svg>

            {/* Huge Center Numbers */}
            <div
              style={{
                textAlign: 'center',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                className="tabular-nums"
                style={{
                  fontSize: 'clamp(4.2rem, 18vw, 6.2rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  fontFamily: 'monospace, system-ui, sans-serif',
                  color: isFinished ? '#34d399' : isPaused ? '#fbbf24' : '#ffffff',
                  textShadow: isFinished
                    ? '0 0 40px rgba(52, 211, 153, 0.5)'
                    : '0 0 35px rgba(255, 255, 255, 0.15)'
                }}
              >
                {formattedTime}
              </div>

              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isFinished ? '#34d399' : isPaused ? '#fbbf24' : 'rgba(255, 255, 255, 0.55)',
                  marginTop: '0.5rem'
                }}
              >
                {isFinished
                  ? (isRTL ? 'جاهز للجولة التالية!' : 'Ready for next set!')
                  : isPaused
                    ? (isRTL ? 'المؤقت متوقف مؤقتاً' : 'Timer Paused')
                    : (isRTL ? 'وقت الراحة' : 'Resting')}
              </span>
            </div>
          </div>

          {/* Upcoming Set Banner */}
          {exerciseName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '1.4rem',
                maxWidth: '440px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: '#38bdf8',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <Dumbbell className="w-5 h-5" />
              </div>

              <div style={{ minWidth: 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {isRTL ? 'التمرين القادم' : 'Next Up'}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {tExercise(exerciseName)}
                </div>
                {(targetWeight !== undefined || targetReps !== undefined) && (
                  <div style={{ fontSize: '0.86rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.1rem' }}>
                    {nextSetNumber && `${isRTL ? `جولة ${nextSetNumber}` : `Set ${nextSetNumber}`} ${totalSets ? `/${totalSets}` : ''} · `}
                    {targetWeight !== undefined && `${targetWeight} ${weightUnit}`}
                    {targetReps !== undefined && ` × ${targetReps} ${isRTL ? 'عدة' : 'reps'}`}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>

        {/* Bottom Control Bar: Big Tactile Gym-Floor Buttons */}
        <footer
          style={{
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Quick Adjust Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => {
                gymAudio.triggerSubtleHaptic([15]);
                onAdjustTime(-15);
              }}
              className="touch-target-comfortable"
              style={{
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              −15s
            </button>

            <button
              type="button"
              onClick={() => {
                gymAudio.triggerSubtleHaptic([15]);
                onTogglePause();
              }}
              className="touch-target-comfortable"
              style={{
                height: '56px',
                borderRadius: '16px',
                background: isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: isPaused ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isPaused ? '#fbbf24' : '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span>{isPaused ? (isRTL ? 'استئناف' : 'Resume') : (isRTL ? 'إيقاف' : 'Pause')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                gymAudio.triggerSubtleHaptic([15]);
                onAdjustTime(30);
              }}
              className="touch-target-comfortable"
              style={{
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              +30s
            </button>
          </div>

          {/* Primary Action Button: Ready / Skip Rest */}
          <button
            type="button"
            onClick={() => {
              gymAudio.triggerSubtleHaptic([25, 40]);
              onSkipRest();
            }}
            className="touch-target-comfortable"
            style={{
              height: '62px',
              borderRadius: '18px',
              background: isFinished
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #00f2fe, #4facfe)',
              border: 'none',
              color: '#04121b',
              fontSize: '1.15rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: isFinished
                ? '0 10px 25px rgba(16, 185, 129, 0.4)'
                : '0 10px 25px rgba(0, 242, 254, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            {isFinished ? <Check className="w-6 h-6" /> : <Sparkles className="w-5 h-5" />}
            <span>{isFinished ? (isRTL ? 'جاهز! ابدأ الجولة الآن' : 'Ready! Start Set Now') : (isRTL ? 'تخطي الراحة والبدء فوراً' : 'Skip Rest & Go')}</span>
          </button>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
