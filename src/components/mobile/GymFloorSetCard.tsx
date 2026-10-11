import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Zap, Copy } from 'lucide-react';
import type { SetRecord } from '../../lib/api';
import type { PreviousSetReference } from '../../types/ui';
import { useTranslation } from '../../lib/i18n';
import { useFormaReducedMotion } from '../TodayBentoGrid';
import { GYM_FLOOR_HAPTICS, pulseHaptic } from './gymFloorHaptics';
import {
  COMMIT_DEBOUNCE_MS,
  DEFAULT_REPS,
  REPS_FIELD,
  WEIGHT_FIELD,
  caretAfterSanitize,
  clampFieldValue,
  formatFieldValue,
  isFieldDraftInvalid,
  parseFieldDraft,
  sanitizeFieldDraft,
  type NumberFieldConfig
} from './setNumberField';

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

const inputLineStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  minWidth: 0
};

const numberInputStyle: React.CSSProperties = {
  ...inputStyle,
  inlineSize: '100%',
  minInlineSize: 0,
  fontSize: 'clamp(1.5rem, 7vw, 1.9rem)',
  fontWeight: 800,
  fontFamily: 'var(--font-display)',
  textAlign: 'center'
};

interface GymFloorNumberInputProps {
  id: string;
  /** Value the store currently holds; the source of truth once the field is idle. */
  value: number;
  config: NumberFieldConfig;
  /** What a cleared field resolves to on blur (weight 0, reps target). */
  emptyFallback: number;
  /** Nudge size for the arrow keys, matching the thumb steppers. */
  step: number;
  inputMode: 'decimal' | 'numeric';
  placeholder: string;
  onCommit: (value: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** Trailing unit toggle / suffix rendered inside the field box. */
  children?: React.ReactNode;
}

/**
 * A set field that can actually be edited.
 *
 * It keeps its own string draft and pushes a parsed number up on a 300ms
 * debounce plus on blur. Two things made the previous version impossible to
 * type into:
 *
 * 1. `value` was bound straight to the saved number and rendered `''` whenever
 *    that number was `0`, so typing `0` saved a `0` and the field blanked
 *    again under the athlete's finger, caret and all.
 * 2. Every keystroke wrote the whole session, so the value came back through an
 *    async save round-trip (and a failed save rolled the field back mid-word).
 *
 * The draft is now the source of truth while the field is dirty, the store echo
 * is recognised instead of overwriting it, and external edits (steppers, ghost
 * chip, 1-tap copy) are still picked up the moment they land.
 */
function GymFloorNumberInput({
  id,
  value,
  config,
  emptyFallback,
  step,
  inputMode,
  placeholder,
  onCommit,
  onFocus,
  onBlur,
  children
}: GymFloorNumberInputProps) {
  const [draft, setDraft] = useState(() => formatFieldValue(value, config));
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** Last value this field pushed up, so its own echo is not read as an edit. */
  const committedRef = useRef(value);
  const draftRef = useRef(draft);
  /** True from the first keystroke until the field settles, so a bare focus and
   * blur never turns a displayed default into a logged value. */
  const dirtyRef = useRef(false);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const caretRef = useRef<number | null>(null);
  const latestRef = useRef({ config, emptyFallback, onCommit });

  useEffect(() => {
    latestRef.current = { config, emptyFallback, onCommit };
  });

  const cancelPendingCommit = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = undefined;
    }
  }, []);

  const commit = useCallback((next: number) => {
    committedRef.current = next;
    latestRef.current.onCommit(next);
  }, []);

  // Adopt an external edit (thumb stepper, ghost chip, 1-tap copy). A value that
  // merely matches what we already pushed up is our own write coming back and
  // must not touch the draft - that rewrite mid-keystroke was the flicker.
  useEffect(() => {
    if (value === committedRef.current) return;
    committedRef.current = value;
    cancelPendingCommit();
    dirtyRef.current = false;
    caretRef.current = null;
    const next = formatFieldValue(value, config);
    draftRef.current = next;
    setDraft(next);
  }, [value, config, cancelPendingCommit]);

  // Runs after the sanitised draft is in the DOM, so a rejected character can
  // be dropped from the text without dragging the caret along with it.
  useLayoutEffect(() => {
    const caret = caretRef.current;
    if (caret === null) return;
    caretRef.current = null;
    const input = inputRef.current;
    if (!input) return;
    const position = Math.min(caret, input.value.length);
    input.setSelectionRange(position, position);
  });

  const applyDraft = useCallback((nextDraft: string, caret: number | null) => {
    draftRef.current = nextDraft;
    caretRef.current = caret;
    setDraft(nextDraft);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const caret = event.target.selectionStart ?? raw.length;
    const sanitized = sanitizeFieldDraft(raw, config);

    applyDraft(sanitized, sanitized === raw ? null : caretAfterSanitize(raw, caret, config));
    dirtyRef.current = true;

    const { status, value: parsed } = parseFieldDraft(sanitized, config, emptyFallback);
    cancelPendingCommit();
    // Empty is a legal waypoint ("zero weight", "back to the target reps") and
    // an out-of-range value has to be corrected first: committing either now
    // would save something the athlete never finished typing.
    if (status !== 'valid' || parsed === committedRef.current) return;

    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = undefined;
      commit(parsed);
    }, COMMIT_DEBOUNCE_MS);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const base = parseFieldDraft(draftRef.current, config, emptyFallback).value;
    const next = clampFieldValue(base + (event.key === 'ArrowUp' ? step : -step), config);
    cancelPendingCommit();
    dirtyRef.current = true;
    const text = formatFieldValue(next, config);
    applyDraft(text, text.length);
    commit(next);
  };

  const settle = () => {
    cancelPendingCommit();
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    const { value: parsed } = parseFieldDraft(draftRef.current, config, emptyFallback);
    // Leaving the field always resolves what is in the box: an empty or
    // out-of-range draft is replaced by the nearest legal value rather than
    // staying on screen unsaved and flagged.
    const next = clampFieldValue(parsed, config);
    applyDraft(formatFieldValue(next, config), null);
    if (next !== committedRef.current) commit(next);
  };

  const handleBlur = () => {
    settle();
    onBlur();
  };

  // The card can unmount mid-edit - ticking the set done swaps it for the next
  // one - so a debounced draft is written out instead of dropped on the floor.
  // Deps are stable (module-level config, empty-dep callback) so this only runs
  // on a real unmount.
  useEffect(() => () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    cancelPendingCommit();
    const { config: activeConfig, emptyFallback: fallback, onCommit: push } = latestRef.current;
    const { value: parsed } = parseFieldDraft(draftRef.current, activeConfig, fallback);
    const next = clampFieldValue(parsed, activeConfig);
    if (next === committedRef.current) return;
    committedRef.current = next;
    push(next);
  }, [cancelPendingCommit]);

  const invalid = isFieldDraftInvalid(draft, config);
  const { value: displayValue } = parseFieldDraft(draft, config, emptyFallback);

  return (
    <div className={`gym-floor-input-line ui-input-box${invalid ? ' has-error' : ''}`} style={inputLineStyle}>
      <input
        ref={inputRef}
        id={id}
        className="gym-floor-number-input ui-input-field"
        type="text"
        inputMode={inputMode}
        role="spinbutton"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={draft}
        placeholder={placeholder}
        aria-valuenow={Number.isFinite(displayValue) ? displayValue : undefined}
        aria-valuemin={config.min}
        aria-valuemax={config.max}
        aria-invalid={invalid || undefined}
        onFocus={onFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={numberInputStyle}
      />
      {children}
    </div>
  );
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
            The field keeps an intrinsic minimum (4.5rem from
            `.gym-floor-number-input`), so the centre column is
            `minmax(64px, 1fr)` and the input itself is given `minWidth: 0` -
            without both, the input refuses to shrink, its content overflows the
            column, and the +5 button is pushed past the card edge and clipped. */}
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
            <GymFloorNumberInput
              id={weightId}
              value={Number.isFinite(set.weight) ? set.weight : 0}
              config={WEIGHT_FIELD}
              emptyFallback={0}
              step={0.5}
              inputMode="decimal"
              placeholder={previousRecord && previousRecord.weight > 0 ? String(previousRecord.weight) : "0"}
              onCommit={(next) => onUpdateSet('weight', next)}
              onFocus={setFloorInputActive}
              onBlur={setFloorInputActive}
            >
              <button
                type="button"
                className="gym-floor-unit-toggle"
                onClick={() => handleStep(() => onUpdateSet('unit', set.unit === 'kg' ? 'lb' : 'kg'))}
                aria-label={isRTL ? `تبديل الوحدة، الحالية ${set.unit}` : `Switch unit, currently ${set.unit}`}
                style={{ minWidth: '40px', minHeight: '40px', padding: '0.2rem 0.4rem', flexShrink: 0 }}
              >
                {set.unit}
              </button>
            </GymFloorNumberInput>
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
            <GymFloorNumberInput
              id={repsId}
              value={set.repsActual > 0 ? set.repsActual : set.repsTarget > 0 ? set.repsTarget : DEFAULT_REPS}
              config={REPS_FIELD}
              emptyFallback={set.repsTarget > 0 ? set.repsTarget : DEFAULT_REPS}
              step={1}
              inputMode="numeric"
              placeholder={previousRecord && previousRecord.reps > 0 ? String(previousRecord.reps) : "10"}
              onCommit={(next) => onUpdateSet('repsActual', next)}
              onFocus={setFloorInputActive}
              onBlur={setFloorInputActive}
            >
              <span className="gym-floor-input-suffix" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                {isRTL ? 'عدة' : 'reps'}
              </span>
            </GymFloorNumberInput>
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
