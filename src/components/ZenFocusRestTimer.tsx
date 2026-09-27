
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useWorkoutTimer, workoutTimer } from '../lib/workoutTimer';

interface ZenFocusRestTimerProps {
  defaultRestTime: number;
  onCompleteZenSet: () => void;
  isSetCompleted: boolean;
  t: (key: any) => string;
}

export function ZenFocusRestTimer({
  defaultRestTime,
  onCompleteZenSet,
  isSetCompleted,
  t
}: ZenFocusRestTimerProps) {
  const { secondsLeft, isRunning, totalSeconds } = useWorkoutTimer();

  if (isRunning && secondsLeft !== null && secondsLeft > 0) {
    const zenTotal = totalSeconds > 0 ? totalSeconds : (defaultRestTime || 90);
    const fraction = Math.max(0, Math.min(1, secondsLeft / zenTotal));
    const r = 44;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - fraction);

    return (
      <div className="zen-circular-rest-container">
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('zenRestTimer')}
        </span>

        <div style={{ position: 'relative', width: '108px', height: '108px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="3" />
            <circle 
              cx="54" 
              cy="54" 
              r={r} 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeDasharray={circ} 
              strokeDashoffset={offset} 
              style={{ transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            className="zen-stepper-btn"
            onClick={() => workoutTimer.adjust(30)}
          >
            +30s
          </button>
          <button
            type="button"
            className="zen-stepper-btn"
            onClick={() => workoutTimer.stop()}
          >
            {t('skipRest')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      className="zen-complete-big-btn"
      onClick={onCompleteZenSet}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: isSetCompleted ? 'rgba(16, 185, 129, 0.25)' : undefined,
        border: isSetCompleted ? '1px solid #10b981' : undefined
      }}
    >
      <Check size={24} />
      <span>{isSetCompleted ? t('workoutCompleted') : t('zenCompleteSet')}</span>
    </motion.button>
  );
}
