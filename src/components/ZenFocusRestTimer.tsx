import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useWorkoutTimer, workoutTimer } from '../lib/workoutTimer';
import { useReducedMotion } from './performance/useReducedMotion';

interface ZenFocusRestTimerProps {
  defaultRestTime: number;
  onCompleteZenSet: () => void;
  isSetCompleted: boolean;
  t: (key: any) => string;
  isRTL?: boolean;
}

export function ZenFocusRestTimer({
  defaultRestTime,
  onCompleteZenSet,
  isSetCompleted,
  t,
  isRTL
}: ZenFocusRestTimerProps) {
  const { secondsLeft, isRunning, totalSeconds } = useWorkoutTimer();
  const reducedMotion = useReducedMotion();

  if (isRunning && secondsLeft !== null && secondsLeft > 0) {
    const zenTotal = totalSeconds > 0 ? totalSeconds : (defaultRestTime || 90);
    const fraction = Math.max(0, Math.min(1, secondsLeft / zenTotal));
    const r = 44;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - fraction);
    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;

    return (
      <div
        className="zen-circular-rest-container"
        role="region"
        aria-label={t('zenRestTimer')}
        style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem' }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('zenRestTimer')}
        </span>

        <div style={{ position: 'relative', width: '124px', height: '124px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="124" height="124" viewBox="0 0 108 108" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="3" />
            <circle
              cx="54"
              cy="54"
              r={r}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              className="session-countdown"
              style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {minutes}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            className="zen-stepper-btn"
            style={{ minHeight: '48px', minWidth: '72px' }}
            onClick={() => workoutTimer.adjust(30)}
            aria-label={isRTL ? 'إضافة 30 ثانية' : 'Add 30 seconds'}
          >
            +30s
          </button>
          <button
            type="button"
            className="zen-stepper-btn"
            style={{ minHeight: '48px', minWidth: '88px' }}
            onClick={() => workoutTimer.stop()}
          >
            {t('skipRest')}
          </button>
        </div>

        <span className="forma-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isRTL
            ? `${minutes} دقيقة و${secs} ثانية متبقية من الراحة`
            : `${minutes} minutes and ${secs} seconds of rest remaining`}
        </span>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      className="zen-complete-big-btn"
      onClick={onCompleteZenSet}
      aria-pressed={isSetCompleted}
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      style={{
        minHeight: '64px',
        background: isSetCompleted ? 'color-mix(in srgb, var(--success) 25%, transparent)' : undefined,
        border: isSetCompleted ? '1px solid var(--success)' : undefined
      }}
    >
      <Check size={24} aria-hidden="true" />
      <span>{isSetCompleted ? t('workoutCompleted') : t('zenCompleteSet')}</span>
    </motion.button>
  );
}
