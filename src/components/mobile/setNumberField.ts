/**
 * Number-field primitives for the gym-floor set inputs.
 *
 * Deliberately pure TypeScript - no React, no DOM - for the same reason the
 * rest of `src/lib` is: the unit harness runs on the `node` environment and
 * these rules (sanitising, parsing, clamping, formatting) are the part that
 * actually decides whether a typed value is accepted, so they must be
 * testable on their own.
 *
 * The set card keeps a local string draft while the field has focus and only
 * pushes a parsed number to the store on a debounce / blur, so the rules here
 * are the single place that decides what "12.5" means for a weight and whether
 * a draft is allowed to become a saved value.
 */

export interface NumberFieldConfig {
  /** Smallest value that may be committed. */
  min: number;
  /** Largest value that may be committed. */
  max: number;
  /** Decimal places kept. `0` makes the field integer-only. */
  decimals: number;
}

/** Weight accepts fractional plates, so it keeps two decimals. */
export const WEIGHT_FIELD: NumberFieldConfig = { min: 0, max: 500, decimals: 2 };

/** A set cannot be logged with zero reps, so reps start at 1. */
export const REPS_FIELD: NumberFieldConfig = { min: 1, max: 999, decimals: 0 };

/** Reps fallback when a set carries neither an actual nor a target value. */
export const DEFAULT_REPS = 10;

/**
 * Keystrokes are batched into one store write per pause instead of one write
 * per character. Every write is a full Firestore session save, and a failing
 * one rolls the field back mid-edit.
 */
export const COMMIT_DEBOUNCE_MS = 300;

export type FieldStatus = 'empty' | 'valid' | 'out-of-range' | 'invalid';

export interface FieldParse {
  status: FieldStatus;
  /**
   * Parsed value for a usable draft, the clamped fallback for an unusable one.
   * Callers must not commit anything whose status is not `valid` while the user
   * is still typing - that is what made a half-typed value bounce back.
   */
  value: number;
}

/** Rounds away binary-float dust (`0.30000000000000004`) before display. */
function roundTo(value: number, decimals: number): number {
  if (decimals <= 0) return Math.round(value);
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function clampFieldValue(value: number, config: NumberFieldConfig): number {
  if (!Number.isFinite(value)) return config.min;
  return roundTo(Math.min(config.max, Math.max(config.min, value)), config.decimals);
}

/**
 * Keeps only characters a numeric draft may contain, and caps the length at
 * what the largest legal value needs plus room for the fraction. Everything
 * else - signs, exponent markers, pasted units, stray separators - is dropped
 * rather than rejected, so an odd paste never blocks the keyboard.
 */
export function sanitizeFieldDraft(raw: string, config: NumberFieldConfig): string {
  const digitsAndDots = raw.replace(/[^0-9.]/g, '');
  const firstDot = digitsAndDots.indexOf('.');

  // Integer fields cut at the first separator (`"12.5"` -> `"12"`) instead of
  // deleting it, which would silently read the paste as 125.
  const trimmed = config.decimals > 0
    ? firstDot === -1
      ? digitsAndDots
      : digitsAndDots.slice(0, firstDot + 1) + digitsAndDots.slice(firstDot + 1).replace(/\./g, '')
    : firstDot === -1
      ? digitsAndDots
      : digitsAndDots.slice(0, firstDot);

  const maxLength = String(config.max).length + (config.decimals > 0 ? config.decimals + 1 : 0);
  return trimmed.slice(0, maxLength);
}

/**
 * Caret position after sanitising. Dropping a rejected character must not drag
 * the caret with it, so the position is measured on the sanitised prefix and
 * then clamped to the sanitised string it indexes into.
 */
export function caretAfterSanitize(raw: string, caret: number, config: NumberFieldConfig): number {
  const prefix = raw.slice(0, Math.max(0, Math.min(caret, raw.length)));
  return Math.min(sanitizeFieldDraft(prefix, config).length, sanitizeFieldDraft(raw, config).length);
}

/**
 * Interprets a draft. `empty` is a deliberate state, not an error: a cleared
 * field is a legal way of saying "zero weight" or "back to the target reps",
 * and only the blur resolves it to `emptyFallback`.
 */
export function parseFieldDraft(draft: string, config: NumberFieldConfig, emptyFallback: number): FieldParse {
  const trimmed = draft.trim();
  const fallback = clampFieldValue(emptyFallback, config);

  if (trimmed === '' || trimmed === '.') return { status: 'empty', value: fallback };

  const parsed = config.decimals > 0 ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return { status: 'invalid', value: fallback };

  const inRange = parsed >= config.min && parsed <= config.max;
  return { status: inRange ? 'valid' : 'out-of-range', value: parsed };
}

/** Whether a draft should be flagged to the athlete while they type. */
export function isFieldDraftInvalid(draft: string, config: NumberFieldConfig): boolean {
  const { status } = parseFieldDraft(draft, config, config.min);
  return status === 'out-of-range' || status === 'invalid';
}

/** Committed value -> draft text. `0` renders as `"0"`, never as an empty field. */
export function formatFieldValue(value: number, config: NumberFieldConfig): string {
  if (!Number.isFinite(value)) return '';
  const clamped = clampFieldValue(value, config);
  return config.decimals > 0 ? String(roundTo(clamped, config.decimals)) : String(clamped);
}