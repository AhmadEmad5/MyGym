import { motion } from 'framer-motion';
import { Check, Trash2, Zap } from 'lucide-react';
import type { SetRecord } from '../../lib/api';
import type { PreviousSetReference } from '../../types/ui';
import { useTranslation } from '../../lib/i18n';
import { useFormaReducedMotion } from '../TodayBentoGrid';
import { GYM_FLOOR_HAPTICS, pulseHaptic } from './gymFloorHaptics';

interface GymFloorSetCardProps {
  set: SetRecord;
  setIndex: number;
  totalSets: number;
  previousRecord: PreviousSetReference | null;
  onUpdateSet: (field: 'weight' | 'repsActual' | 'unit', value: any) => void;
  onToggleComplete: () => void;
  onQuickWeightAdjust: (delta: number) => void;
  onQuickRepAdjust: (delta: number) => void;
  onDeleteSet?: () => void;
  isCompact?: boolean;
  onSelectSet?: () => void;
}

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  textAlign: 'center',
  color: 'var(--text-primary)',
  outline: 'none',
  fontVariantNumeric: 'tabular-nums',
};

let floorInputReleaseTimer: ReturnType<typeof setTimeout> | undefined;

function isFloorInputFocused() {
  const active = document.activeElement;
  return active instanceof HTMLElement && active.classList.contains('gym-floor-number-input');
}

/**
 * Flags the page so the fixed thumb dock can step out of the OS keyboard's way.
 * Re-checks real focus on a short delay so an unmounted input can never leave
 * the flag stuck and permanently hide the dock.
 */
function setFloorInputActive() {
  if (isFloorInputFocused()) {
    document.documentElement.dataset.floorInput = 'true';
  }
  if (floorInputReleaseTimer) clearTimeout(floorInputReleaseTimer);
  floorInputReleaseTimer = setTimeout(() => {
    if (!isFloorInputFocused()) {
      delete document.documentElement.dataset.floorInput;
    }
  }, 250);
}

export function GymFloorSetCard({
  set,
  setIndex,
  totalSets,
  previousRecord,
  onUpdateSet,
  onToggleComplete,
  onQuickWeightAdjust,
  onQuickRepAdjust,
  onDeleteSet,
  isCompact = false,
  onSelectSet,
}: GymFloorSetCardProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();
  const tapScale = reduceMotion ? undefined : { scale: 0.9 };
  const weightId = `gym-floor-weight-${setIndex}`;
  const repsId = `gym-floor-reps-${setIndex}`;
  const summary = `${set.weight || 0} ${set.unit} × ${set.repsActual || set.repsTarget || 10} ${isRTL ? 'عدة' : 'reps'}`;

  const handleCompleteToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    pulseHaptic(set.isCompleted ? GYM_FLOOR_HAPTICS.select : GYM_FLOOR_HAPTICS.setComplete);
    onToggleComplete();
  };

  const handleStep = (adjust: () => void) => {
    pulseHaptic(GYM_FLOOR_HAPTICS.step);
    adjust();
  };

  if (isCompact) {
    return (
      <motion.div
        layout={!reduceMotion}
        className={`gym-floor-set-row ${set.isCompleted ? 'is-complete' : ''}`.trim()}
        role="group"
        aria-label={`${isRTL ? 'الجولة' : 'Set'} ${setIndex + 1}: ${summary}`}
      >
        <button
          type="button"
          className="gym-floor-set-summary"
          onClick={onSelectSet}
          disabled={!onSelectSet}
          aria-label={summary}
        >
          <span className="gym-floor-set-index tabular-nums" aria-hidden="true">
            {setIndex + 1}
          </span>
          <span className="gym-floor-set-detail tabular-nums" dir="ltr">
            {set.weight || 0} {set.unit} × {set.repsActual || set.repsTarget || 10} {isRTL ? 'عدة' : 'reps'}
          </span>
        </button>

        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.88 }}
          onClick={handleCompleteToggle}
          className={`gym-floor-check-circle ${set.isCompleted ? 'completed' : 'uncompleted'}`}
          style={{ inlineSize: '3rem', blockSize: '3rem' }}
          aria-pressed={set.isCompleted}
          aria-label={set.isCompleted ? (isRTL ? 'إلغاء تعليم الجولة' : 'Mark set as not done') : (isRTL ? 'تعليم الجولة كمنجزة' : 'Mark set as done')}
        >
          <Check size={20} aria-hidden="true" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={!reduceMotion}
      className={`gym-floor-current-set-card ${set.isCompleted ? 'is-completed' : ''}`.trim()}
      style={{ marginBlockEnd: '1rem' }}
    >
      <div className="gym-floor-set-header">
        <div>
          <h3 className="gym-floor-set-heading">
            {isRTL ? `الجولة ${setIndex + 1} من ${totalSets}` : `Set ${setIndex + 1} of ${totalSets}`}
          </h3>
          {previousRecord ? (
            <p className="gym-floor-set-prev">
              <Zap size={14} aria-hidden="true" />
              <span>
                {isRTL ? 'السابق' : 'Prev'}: {previousRecord.weight} {previousRecord.unit} × {previousRecord.reps} {isRTL ? 'عدة' : 'reps'}
              </span>
            </p>
          ) : (
            <p className="gym-floor-set-hint">{isRTL ? 'الجولة الأولى المسجلة' : 'Target: clean form & steady tempo'}</p>
          )}
        </div>

        {totalSets > 1 && onDeleteSet && (
          <span className="gym-floor-danger-zone">
            <button
              type="button"
              className="btn-icon btn-ghost gym-floor-delete-set"
              onClick={() => {
                pulseHaptic(GYM_FLOOR_HAPTICS.select);
                onDeleteSet();
              }}
              aria-label={isRTL ? 'حذف الجولة' : 'Delete set'}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      <div className="gym-floor-inputs">
        <div className="gym-floor-input-row">
          <button
            type="button"
            className="gym-floor-thumb-stepper"
            onClick={() => handleStep(() => onQuickWeightAdjust(-2.5))}
            aria-label={isRTL ? 'إنقاص الوزن 2.5' : 'Decrease weight by 2.5'}
          >
            −2.5
          </button>

          <div className="gym-floor-input-value">
            <label className="gym-floor-input-label" htmlFor={weightId}>
              {isRTL ? 'الوزن' : 'Weight'}
            </label>
            <div className="gym-floor-input-line">
              <input
                id={weightId}
                className="gym-floor-number-input"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight === 0 ? '' : set.weight}
                placeholder="0"
                onFocus={setFloorInputActive}
                onBlur={setFloorInputActive}
                onChange={(event) => onUpdateSet('weight', parseFloat(event.target.value) || 0)}
                style={{ ...inputStyle, inlineSize: '5.5rem', fontSize: '1.8rem', fontWeight: 900 }}
              />
              <button
                type="button"
                className="gym-floor-unit-toggle"
                onClick={() => handleStep(() => onUpdateSet('unit', set.unit === 'kg' ? 'lb' : 'kg'))}
                aria-label={isRTL ? `تبديل الوحدة، الحالية ${set.unit}` : `Switch unit, currently ${set.unit}`}
              >
                {set.unit}
              </button>
            </div>
          </div>

          <div className="gym-floor-stepper-pair">
            <button
              type="button"
              className="gym-floor-thumb-stepper stepper-cyan"
              onClick={() => handleStep(() => onQuickWeightAdjust(2.5))}
              aria-label={isRTL ? 'زيادة الوزن 2.5' : 'Increase weight by 2.5'}
            >
              +2.5
            </button>
            <button
              type="button"
              className="gym-floor-thumb-stepper stepper-cyan"
              onClick={() => handleStep(() => onQuickWeightAdjust(5))}
              aria-label={isRTL ? 'زيادة الوزن 5' : 'Increase weight by 5'}
            >
              +5
            </button>
          </div>
        </div>

        <div className="gym-floor-input-row">
          <button
            type="button"
            className="gym-floor-thumb-stepper"
            onClick={() => handleStep(() => onQuickRepAdjust(-1))}
            aria-label={isRTL ? 'إنقاص التكرار' : 'Decrease reps'}
          >
            −1
          </button>

          <div className="gym-floor-input-value">
            <label className="gym-floor-input-label" htmlFor={repsId}>
              {isRTL ? 'التكرار' : 'Reps'}
            </label>
            <div className="gym-floor-input-line">
              <input
                id={repsId}
                className="gym-floor-number-input"
                type="number"
                inputMode="numeric"
                value={set.repsActual || set.repsTarget || ''}
                placeholder="10"
                onFocus={setFloorInputActive}
                onBlur={setFloorInputActive}
                onChange={(event) => onUpdateSet('repsActual', parseInt(event.target.value) || 0)}
                style={{ ...inputStyle, inlineSize: '5rem', fontSize: '1.8rem', fontWeight: 900 }}
              />
              <span className="gym-floor-input-suffix">{isRTL ? 'عدة' : 'reps'}</span>
            </div>
          </div>

          <button
            type="button"
            className="gym-floor-thumb-stepper stepper-green"
            onClick={() => handleStep(() => onQuickRepAdjust(1))}
            aria-label={isRTL ? 'زيادة التكرار' : 'Increase reps'}
          >
            +1
          </button>
        </div>
      </div>

      <div className="gym-floor-complete-row">
        <motion.button
          type="button"
          whileTap={tapScale}
          onClick={handleCompleteToggle}
          className={`gym-floor-check-circle ${set.isCompleted ? 'completed' : 'uncompleted'}`}
          style={{ inlineSize: '4.25rem', blockSize: '4.25rem' }}
          aria-pressed={set.isCompleted}
          aria-label={set.isCompleted ? (isRTL ? 'إلغاء تعليم الجولة' : 'Mark set as not done') : (isRTL ? 'تعليم الجولة كمنجزة' : 'Mark set as done')}
        >
          <Check size={28} aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  );
}
