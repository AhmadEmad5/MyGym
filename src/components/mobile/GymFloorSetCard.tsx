import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Zap, Copy } from 'lucide-react';
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
  const [justCopied, setJustCopied] = useState(false);
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

  const handleCopyPrevious = (event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (!onRepeatPrevious) return;
    setJustCopied(true);
    pulseHaptic(GYM_FLOOR_HAPTICS.setComplete);
    onRepeatPrevious();
    setTimeout(() => setJustCopied(false), 1400);
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
            gap: '0.65rem',
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
          <span className="gym-floor-set-index font-display-medium tabular-nums" aria-hidden="true" style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', minWidth: '2.2rem' }}>
            {setIndex + 1}
          </span>
          <span className="gym-floor-set-detail tabular-nums font-mono" dir="ltr" style={{ flex: 1 }}>
            {set.weight || 0} {set.unit} × {set.repsActual || set.repsTarget || 10} {isRTL ? 'عدة' : 'reps'}
          </span>
          {previousRecord && (
            <span className="gym-floor-compact-ghost font-mono" dir="ltr" title={isRTL ? 'الأداء السابق' : 'Previous performance'}>
              <Zap size={10} aria-hidden="true" />
              <span>{previousRecord.weight}×{previousRecord.reps}</span>
            </span>
          )}
          <span className={`gym-floor-set-status badge ${set.isCompleted ? 'ui-badge-emerald' : 'ui-badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
            {set.isCompleted ? (isRTL ? 'مكتملة' : 'Done') : (isRTL ? 'قيد التنفيذ' : 'Active')}
          </span>
        </button>

        {previousRecord && onRepeatPrevious && !set.isCompleted && (
          <button
            type="button"
            onClick={handleCopyPrevious}
            className="gym-floor-compact-copy-btn touch-target"
            aria-label={isRTL ? 'نسخ الأداء السابق بنقرة واحدة' : '1-Tap copy previous performance'}
            title={isRTL ? 'نسخ الأداء السابق' : '1-Tap Copy Previous'}
          >
            <Copy size={13} aria-hidden="true" />
          </button>
        )}

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
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h3 className="gym-floor-set-heading font-display-medium text-display-h3" style={{ margin: '0 0 0.25rem' }}>
            {isRTL ? `الجولة ${setIndex + 1} من ${totalSets}` : `Set ${setIndex + 1} of ${totalSets}`}
          </h3>
          {previousRecord ? (
            <div className="gym-floor-ghost-banner" role="region" aria-label={isRTL ? 'شبح الأداء السابق' : 'Previous performance ghost'}>
              <div className="gym-floor-ghost-info">
                <span className="gym-floor-ghost-tag">
                  <Zap size={13} aria-hidden="true" />
                  <span>{isRTL ? 'الأداء السابق' : 'Ghost Record'}</span>
                </span>
                <span className="gym-floor-ghost-stat font-mono" dir="ltr">
                  <strong>{previousRecord.weight}</strong> {previousRecord.unit || set.unit} × <strong>{previousRecord.reps}</strong> {isRTL ? 'عدة' : 'reps'}
                </span>
              </div>
              {onRepeatPrevious && (
                <motion.button
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.93 }}
                  onClick={handleCopyPrevious}
                  className={`gym-floor-ghost-copy-btn ${justCopied ? 'is-copied' : ''}`}
                  aria-label={isRTL ? 'نسخ الأداء السابق بنقرة واحدة' : 'Copy previous performance in 1 tap'}
                >
                  {justCopied ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      <span>{isRTL ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>{isRTL ? 'نسخ بنقرة ⚡' : '1-Tap Copy ⚡'}</span>
                    </>
                  )}
                </motion.button>
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

      <div className="gym-floor-inputs" style={{ display: 'grid', gap: '0.5rem' }}>
        {/* Weight row: four controls that must all fit a ~300px card.
            A number input keeps a large intrinsic minimum, so the centre
            column is `minmax(64px, 1fr)` and the input itself is given
            `minWidth: 0` - without both, the input refuses to shrink, its
            content overflows the column, and the +5 button is pushed past the
            card edge and clipped. */}
        <div
          className="gym-floor-input-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(64px, 1fr) auto auto',
            gap: '0.35rem',
            alignItems: 'end'
          }}
        >
          <button
            type="button"
            className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
            onClick={() => handleStep(() => onQuickWeightAdjust(-5))}
            aria-label={isRTL ? 'إنقاص الوزن 5' : 'Decrease weight by 5'}
            style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
          >
            −5
          </button>

          <div className="gym-floor-input-value" style={{ minWidth: 0 }}>
            <label className="gym-floor-input-label ui-input-label" htmlFor={weightId} style={{ display: 'block' }}>
              {isRTL ? 'الوزن' : 'Weight'}
            </label>
            <div className="gym-floor-input-line ui-input-box" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
              <input
                id={weightId}
                className="gym-floor-number-input ui-input-field"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight === 0 ? '' : set.weight}
                placeholder={previousRecord && previousRecord.weight > 0 ? String(previousRecord.weight) : "0"}
                onFocus={setFloorInputActive}
                onBlur={setFloorInputActive}
                onChange={(event) => onUpdateSet('weight', parseFloat(event.target.value) || 0)}
                style={{
                  ...inputStyle,
                  inlineSize: '100%',
                  minInlineSize: 0,
                  fontSize: 'clamp(1.5rem, 7vw, 1.9rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'center'
                }}
              />
              <button
                type="button"
                className="gym-floor-unit-toggle"
                onClick={() => handleStep(() => onUpdateSet('unit', set.unit === 'kg' ? 'lb' : 'kg'))}
                aria-label={isRTL ? `تبديل الوحدة، الحالية ${set.unit}` : `Switch unit, currently ${set.unit}`}
                style={{ minWidth: '40px', minHeight: '40px', padding: '0.2rem 0.4rem', flexShrink: 0 }}
              >
                {set.unit}
              </button>
            </div>
            {previousRecord && previousRecord.weight > 0 && set.weight === 0 && (
              <button
                type="button"
                onClick={() => {
                  pulseHaptic(GYM_FLOOR_HAPTICS.step);
                  onUpdateSet('weight', previousRecord.weight);
                }}
                className="gym-floor-ghost-chip"
                aria-label={isRTL ? `استخدام ${previousRecord.weight} كغ` : `Use ghost ${previousRecord.weight} ${previousRecord.unit || set.unit}`}
              >
                <Zap size={11} aria-hidden="true" />
                <span>{isRTL ? `استخدم ${previousRecord.weight}` : `Use ${previousRecord.weight} ${previousRecord.unit || set.unit}`}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
            onClick={() => handleStep(() => onQuickWeightAdjust(2.5))}
            aria-label={isRTL ? 'زيادة الوزن 2.5' : 'Increase weight by 2.5'}
            style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
          >
            +2.5
          </button>
          <button
            type="button"
            className="gym-floor-thumb-stepper touch-target-comfortable stepper-cyan"
            onClick={() => handleStep(() => onQuickWeightAdjust(5))}
            aria-label={isRTL ? 'زيادة الوزن 5' : 'Increase weight by 5'}
            style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
          >
            +5
          </button>
        </div>

        {/* Reps row: three controls, so it can give the number more room. */}
        <div
          className="gym-floor-input-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(64px, 1fr) auto',
            gap: '0.35rem',
            alignItems: 'end'
          }}
        >
          <button
            type="button"
            className="gym-floor-thumb-stepper touch-target-comfortable"
            onClick={() => handleStep(() => onQuickRepAdjust(-1))}
            aria-label={isRTL ? 'إنقاص التكرار' : 'Decrease reps'}
            style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
          >
            −1
          </button>

          <div className="gym-floor-input-value" style={{ minWidth: 0 }}>
            <label className="gym-floor-input-label ui-input-label" htmlFor={repsId} style={{ display: 'block' }}>
              {isRTL ? 'التكرار' : 'Reps'}
            </label>
            <div className="gym-floor-input-line ui-input-box" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
              <input
                id={repsId}
                className="gym-floor-number-input ui-input-field"
                type="number"
                inputMode="numeric"
                value={set.repsActual || set.repsTarget || ''}
                placeholder={previousRecord && previousRecord.reps > 0 ? String(previousRecord.reps) : "10"}
                onFocus={setFloorInputActive}
                onBlur={setFloorInputActive}
                onChange={(event) => onUpdateSet('repsActual', parseInt(event.target.value) || 0)}
                style={{
                  ...inputStyle,
                  inlineSize: '100%',
                  minInlineSize: 0,
                  fontSize: 'clamp(1.5rem, 7vw, 1.9rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'center'
                }}
              />
              <span className="gym-floor-input-suffix" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                {isRTL ? 'عدة' : 'reps'}
              </span>
            </div>
            {previousRecord && previousRecord.reps > 0 && !set.repsActual && (
              <button
                type="button"
                onClick={() => {
                  pulseHaptic(GYM_FLOOR_HAPTICS.step);
                  onUpdateSet('repsActual', previousRecord.reps);
                }}
                className="gym-floor-ghost-chip"
                aria-label={isRTL ? `استخدام ${previousRecord.reps} عدة` : `Use ghost ${previousRecord.reps} reps`}
              >
                <Zap size={11} aria-hidden="true" />
                <span>{isRTL ? `استخدم ${previousRecord.reps} عدة` : `Use ${previousRecord.reps} reps`}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="gym-floor-thumb-stepper touch-target-comfortable stepper-green"
            onClick={() => handleStep(() => onQuickRepAdjust(1))}
            aria-label={isRTL ? 'زيادة التكرار' : 'Increase reps'}
            style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
          >
            +1
          </button>
        </div>

        {onRepeatPrevious && previousRecord && (
          <button
            type="button"
            className="gym-floor-repeat-btn touch-target"
            onClick={handleCopyPrevious}
            aria-label={isRTL ? 'تكرار الأداء السابق' : 'Repeat previous performance'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              minHeight: '44px',
              inlineSize: '100%',
              padding: '0 1rem',
              borderRadius: '12px',
              border: '1px solid var(--color-pr-hit)',
              background: 'color-mix(in srgb, var(--color-pr-hit) 12%, transparent)',
              color: 'var(--color-pr-hit)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            {justCopied ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{isRTL ? 'تم نسخ الأداء السابق بنجاح!' : 'Previous performance matched!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>{isRTL ? '⚡ نسخ الأداء السابق بنقرة واحدة' : '⚡ 1-Tap Match Previous Set'}</span>
              </>
            )}
          </button>
        )}
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
