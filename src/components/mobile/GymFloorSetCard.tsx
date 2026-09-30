import { motion } from 'framer-motion';
import { Check, Trash2, Zap, Repeat } from 'lucide-react';
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
  onRepeatPrevious?: () => void;
}

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  textAlign: 'center',
  color: 'var(--text-primary)',
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
  onRepeatPrevious,
}: GymFloorSetCardProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();
  const tapScale = reduceMotion ? undefined : { scale: 0.95 };
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
          className="gym-floor-set-summary touch-target-comfortable"
          onClick={onSelectSet}
          disabled={!onSelectSet}
          aria-label={summary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minHeight: '48px',
            padding: '0 0.75rem',
            borderRadius: '12px',
            border: '1px solid var(--premium-line)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            flex: 1,
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          <span className="gym-floor-set-index font-display-medium tabular-nums" aria-hidden="true" style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', minWidth: '2.5rem' }}>
            {setIndex + 1}
          </span>
          <span className="gym-floor-set-detail tabular-nums font-mono" dir="ltr" style={{ flex: 1 }}>
            {set.weight || 0} {set.unit} × {set.repsActual || set.repsTarget || 10} {isRTL ? 'عدة' : 'reps'}
          </span>
          <span className={`gym-floor-set-status badge ${set.isCompleted ? 'ui-badge-emerald' : 'ui-badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
            {set.isCompleted ? (isRTL ? 'مكتملة' : 'Done') : (isRTL ? 'قيد التنفيذ' : 'Active')}
          </span>
        </button>

        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          onClick={handleCompleteToggle}
          className="gym-floor-check-circle touch-target-comfortable"
          style={{ inlineSize: '48px', blockSize: '48px' }}
          aria-pressed={set.isCompleted}
          aria-label={set.isCompleted ? (isRTL ? 'إلغاء تعليم الجولة' : 'Mark set as not done') : (isRTL ? 'تعليم الجولة كمنجزة' : 'Mark set as done')}
        >
          <Check size={22} aria-hidden="true" />
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
      <div className="gym-floor-set-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 className="gym-floor-set-heading font-display-medium text-display-h3" style={{ margin: '0 0 0.25rem' }}>
            {isRTL ? `الجولة ${setIndex + 1} من ${totalSets}` : `Set ${setIndex + 1} of ${totalSets}`}
          </h3>
          {previousRecord ? (
            <div className="gym-floor-set-prev" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--premium-soft)', border: '1px solid var(--premium-line)', borderRadius: '8px', color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Zap size={14} aria-hidden="true" />
              <span>
                {isRTL ? 'السابق' : 'Prev'}: {previousRecord.weight} {previousRecord.unit} × {previousRecord.reps} {isRTL ? 'عدة' : 'reps'}
              </span>
              {onRepeatPrevious && (
                <button
                  type="button"
                  onClick={onRepeatPrevious}
                  className="touch-target"
                  aria-label={isRTL ? 'تكرار الأداء السابق' : 'Repeat previous performance'}
                  style={{ padding: '0.25rem', marginLeft: '0.5rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--accent-amber)', cursor: 'pointer' }}
                >
                  <Repeat className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <p className="gym-floor-set-hint" style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'الجولة الأولى المسجلة' : 'Target: clean form & steady tempo'}
            </p>
          )}
        </div>

        {totalSets > 1 && onDeleteSet && (
          <span className="gym-floor-danger-zone">
            <button
              type="button"
              className="btn-icon btn-ghost gym-floor-delete-set touch-target"
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

      <div className="gym-floor-inputs" style={{ display: 'grid', gap: '1rem' }}>
        <div className="gym-floor-input-row" style={{ display: 'grid', gap: '0.75rem', alignItems: 'start' }}>
          <div className="gym-floor-stepper-group" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <button
              type="button"
              className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
              onClick={() => handleStep(() => onQuickWeightAdjust(-5))}
              aria-label={isRTL ? 'إنقاص الوزن 5' : 'Decrease weight by 5'}
              style={{
                minWidth: '56px',
                minHeight: '56px',
                borderRadius: '12px',
                border: '1px solid var(--premium-line)',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-cyan)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation'
              }}
            >
              −5
            </button>

            <div className="gym-floor-input-value" style={{ flex: '2 1 160px', minWidth: 0 }}>
              <label className="gym-floor-input-label ui-input-label" htmlFor={weightId} style={{ display: 'block' }}>
                {isRTL ? 'الوزن' : 'Weight'}
              </label>
              <div className="gym-floor-input-line ui-input-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id={weightId}
                  className="gym-floor-number-input ui-input-field"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={set.weight === 0 ? '' : set.weight}
                  placeholder="0"
                  onFocus={setFloorInputActive}
                  onBlur={setFloorInputActive}
                  onChange={(event) => onUpdateSet('weight', parseFloat(event.target.value) || 0)}
                  style={{ ...inputStyle, inlineSize: '100%', fontSize: '2.25rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}
                />
                <button
                  type="button"
                  className="gym-floor-unit-toggle touch-target"
                  onClick={() => handleStep(() => onUpdateSet('unit', set.unit === 'kg' ? 'lb' : 'kg'))}
                  aria-label={isRTL ? `تبديل الوحدة، الحالية ${set.unit}` : `Switch unit, currently ${set.unit}`}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    borderRadius: '10px',
                    background: 'var(--surface-glass)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation'
                  }}
                >
                  {set.unit}
                </button>
              </div>
            </div>

            <div className="gym-floor-stepper-pair" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
              <button
                type="button"
                className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
                onClick={() => handleStep(() => onQuickWeightAdjust(2.5))}
                aria-label={isRTL ? 'زيادة الوزن 2.5' : 'Increase weight by 2.5'}
                style={{
                  minWidth: '56px',
                  minHeight: '56px',
                  borderRadius: '12px',
                  border: '1px solid var(--premium-line)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-cyan)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >
                +2.5
              </button>
              <button
                type="button"
                className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
                onClick={() => handleStep(() => onQuickWeightAdjust(5))}
                aria-label={isRTL ? 'زيادة الوزن 5' : 'Increase weight by 5'}
                style={{
                  minWidth: '56px',
                  minHeight: '56px',
                  borderRadius: '12px',
                  border: '1px solid var(--premium-line)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-cyan)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >
                +5
              </button>
            </div>
          </div>

          {onRepeatPrevious && previousRecord && (
            <button
              type="button"
              className="gym-floor-repeat-btn touch-target-comfortable"
              onClick={() => {
                onUpdateSet('weight', previousRecord.weight || 0);
                onUpdateSet('repsActual', previousRecord.reps || 0);
                onUpdateSet('unit', previousRecord.unit || 'kg');
                pulseHaptic(GYM_FLOOR_HAPTICS.select);
              }}
              aria-label={isRTL ? 'تكرار الأداء السابق' : 'Repeat previous performance'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '56px',
                minWidth: '160px',
                padding: '0 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--accent-amber)',
                background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)',
                color: 'var(--accent-amber)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease'
              }}
            >
              <Repeat className="w-4 h-4" aria-hidden="true" />
              <span>{isRTL ? 'تكرار الأداء' : 'Repeat Last'}</span>
            </button>
          )}
        </div>

        <div className="gym-floor-input-row" style={{ display: 'grid', gap: '0.75rem', alignItems: 'start' }}>
          <div className="gym-floor-stepper-group" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <button
              type="button"
              className="gym-floor-thumb-stepper touch-target-comfortable"
              onClick={() => handleStep(() => onQuickRepAdjust(-1))}
              aria-label={isRTL ? 'إنقاص التكرار' : 'Decrease reps'}
              style={{
                minWidth: '56px',
                minHeight: '56px',
                borderRadius: '12px',
                border: '1px solid var(--premium-line)',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-emerald)',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation'
              }}
            >
              −1
            </button>

            <div className="gym-floor-input-value" style={{ flex: '2 1 160px', minWidth: 0 }}>
              <label className="gym-floor-input-label ui-input-label" htmlFor={repsId} style={{ display: 'block' }}>
                {isRTL ? 'التكرار' : 'Reps'}
              </label>
              <div className="gym-floor-input-line ui-input-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id={repsId}
                  className="gym-floor-number-input ui-input-field"
                  type="number"
                  inputMode="numeric"
                  value={set.repsActual || set.repsTarget || ''}
                  placeholder="10"
                  onFocus={setFloorInputActive}
                  onBlur={setFloorInputActive}
                  onChange={(event) => onUpdateSet('repsActual', parseInt(event.target.value) || 0)}
                  style={{ ...inputStyle, inlineSize: '100%', fontSize: '2.25rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}
                />
                <span className="gym-floor-input-suffix" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', paddingInlineEnd: '0.5rem' }}>{isRTL ? 'عدة' : 'reps'}</span>
              </div>
            </div>

            <button
              type="button"
              className="gym-floor-thumb-stepper touch-target-comfortable stepper-green"
              onClick={() => handleStep(() => onQuickRepAdjust(1))}
              aria-label={isRTL ? 'زيادة التكرار' : 'Increase reps'}
              style={{
                minWidth: '56px',
                minHeight: '56px',
                borderRadius: '12px',
                border: '1px solid var(--premium-line)',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-emerald)',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation'
              }}
            >
              +1
            </button>
          </div>
        </div>
      </div>

      <div className="gym-floor-complete-row" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
        <motion.button
          type="button"
          whileTap={tapScale}
          onClick={handleCompleteToggle}
          className={`gym-floor-check-circle ${set.isCompleted ? 'completed' : 'uncompleted'} touch-target`}
          style={{ inlineSize: '5.5rem', blockSize: '5.5rem', minHeight: '88px', minWidth: '88px' }}
          aria-pressed={set.isCompleted}
          aria-label={set.isCompleted ? (isRTL ? 'إلغاء تعليم الجولة' : 'Mark set as not done') : (isRTL ? 'تعليم الجولة كمنجزة' : 'Mark set as done')}
        >
          <Check size={32} aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  );
}
