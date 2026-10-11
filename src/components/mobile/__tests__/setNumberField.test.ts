import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPS,
  REPS_FIELD,
  WEIGHT_FIELD,
  caretAfterSanitize,
  clampFieldValue,
  formatFieldValue,
  isFieldDraftInvalid,
  parseFieldDraft,
  sanitizeFieldDraft
} from '../setNumberField';

/**
 * The gym-floor set fields used to render `''` whenever the saved number was 0
 * and to commit on every keystroke, so typing a value into the weight or reps
 * box blanked itself and lost the caret. These cases pin the rules the field
 * now runs on: what a draft is allowed to contain, when it may become a saved
 * value, and what a settled field shows.
 */
describe('sanitizeFieldDraft', () => {
  it('keeps digits and a single decimal separator in a weight draft', () => {
    expect(sanitizeFieldDraft('62.5', WEIGHT_FIELD)).toBe('62.5');
    expect(sanitizeFieldDraft('6.2.5', WEIGHT_FIELD)).toBe('6.25');
    expect(sanitizeFieldDraft('.5', WEIGHT_FIELD)).toBe('.5');
  });

  it('drops characters a numeric field cannot hold instead of rejecting the input', () => {
    // Signs, exponent markers and pasted units are stripped, so an odd paste
    // still leaves a usable draft rather than freezing the keyboard.
    expect(sanitizeFieldDraft('-60kg', WEIGHT_FIELD)).toBe('60');
    expect(sanitizeFieldDraft('1e3', WEIGHT_FIELD)).toBe('13');
    expect(sanitizeFieldDraft(' 60 ', WEIGHT_FIELD)).toBe('60');
    expect(sanitizeFieldDraft('abc', WEIGHT_FIELD)).toBe('');
  });

  it('cuts an integer draft at the first separator rather than deleting it', () => {
    // Deleting the dot would silently read a pasted "12.5" as 125 reps.
    expect(sanitizeFieldDraft('12.5', REPS_FIELD)).toBe('12');
    expect(sanitizeFieldDraft('12', REPS_FIELD)).toBe('12');
  });

  it('caps a draft at the length the largest legal value needs', () => {
    // Truncated, not rounded: typing past the cap must not rewrite what the
    // athlete already entered.
    expect(sanitizeFieldDraft('123456789', REPS_FIELD)).toBe('123');
    expect(sanitizeFieldDraft('123456789', WEIGHT_FIELD)).toBe('123456');
  });
});

describe('caretAfterSanitize', () => {
  it('holds the caret still when a rejected character is dropped after it', () => {
    // "60k" with the caret at the end: the "k" goes, the caret must stay at 2
    // instead of collapsing to the end of the shorter string or jumping back.
    expect(caretAfterSanitize('60k', 3, WEIGHT_FIELD)).toBe(2);
  });

  it('holds the caret still when a rejected character is dropped before it', () => {
    expect(caretAfterSanitize('-60', 3, WEIGHT_FIELD)).toBe(2);
  });

  it('never points past the sanitised string', () => {
    expect(caretAfterSanitize('123456789', 9, REPS_FIELD)).toBe(3);
    expect(caretAfterSanitize('60', 0, WEIGHT_FIELD)).toBe(0);
  });
});

describe('parseFieldDraft', () => {
  it('reports an empty draft as empty with the fallback, never as a zero value', () => {
    // Clearing the box is a legal waypoint. Resolving it to 0 while the athlete
    // is still typing is what wiped the field under their finger.
    expect(parseFieldDraft('', WEIGHT_FIELD, 0)).toEqual({ status: 'empty', value: 0 });
    expect(parseFieldDraft('', REPS_FIELD, 10)).toEqual({ status: 'empty', value: 10 });
    expect(parseFieldDraft('.', WEIGHT_FIELD, 0).status).toBe('empty');
  });

  it('accepts an in-range draft', () => {
    expect(parseFieldDraft('62.5', WEIGHT_FIELD, 0)).toEqual({ status: 'valid', value: 62.5 });
    expect(parseFieldDraft('12', REPS_FIELD, 10)).toEqual({ status: 'valid', value: 12 });
  });

  it('flags out-of-range drafts instead of silently clamping them mid-edit', () => {
    expect(parseFieldDraft('600', WEIGHT_FIELD, 0).status).toBe('out-of-range');
    expect(parseFieldDraft('0', REPS_FIELD, 10).status).toBe('out-of-range');
    expect(parseFieldDraft('0', REPS_FIELD, 10).value).toBe(0);
  });

  it('clamps an out-of-range fallback into the field range', () => {
    expect(parseFieldDraft('', REPS_FIELD, 0)).toEqual({ status: 'empty', value: 1 });
    expect(parseFieldDraft('', REPS_FIELD, 5000)).toEqual({ status: 'empty', value: 999 });
  });
});

describe('isFieldDraftInvalid', () => {
  it('does not flag an empty or valid draft', () => {
    expect(isFieldDraftInvalid('', REPS_FIELD)).toBe(false);
    expect(isFieldDraftInvalid('10', REPS_FIELD)).toBe(false);
    expect(isFieldDraftInvalid('60', WEIGHT_FIELD)).toBe(false);
  });

  it('flags a draft outside the field range', () => {
    expect(isFieldDraftInvalid('0', REPS_FIELD)).toBe(true);
    expect(isFieldDraftInvalid('600', WEIGHT_FIELD)).toBe(true);
  });
});

describe('clampFieldValue', () => {
  it('pins a value to the field range', () => {
    expect(clampFieldValue(-5, WEIGHT_FIELD)).toBe(0);
    expect(clampFieldValue(900, WEIGHT_FIELD)).toBe(500);
    expect(clampFieldValue(0, REPS_FIELD)).toBe(1);
    expect(clampFieldValue(4000, REPS_FIELD)).toBe(999);
  });

  it('rounds float dust away', () => {
    expect(clampFieldValue(0.1 + 0.2, WEIGHT_FIELD)).toBe(0.3);
    expect(clampFieldValue(62.4999, WEIGHT_FIELD)).toBe(62.5);
  });
});

describe('formatFieldValue', () => {
  it('shows zero as "0" instead of an empty field', () => {
    // The reported bug: a 0 rendered as '' made the field look blank and
    // untouchable the moment a weight was cleared.
    expect(formatFieldValue(0, WEIGHT_FIELD)).toBe('0');
    expect(formatFieldValue(0, REPS_FIELD)).toBe('1');
  });

  it('never leaks a raw float into the draft text', () => {
    expect(formatFieldValue(0.1 + 0.2, WEIGHT_FIELD)).toBe('0.3');
  });

  it('clamps an out-of-range committed value into view', () => {
    expect(formatFieldValue(900, WEIGHT_FIELD)).toBe('500');
    expect(formatFieldValue(4000, REPS_FIELD)).toBe('999');
  });

  it('renders nothing for a value that is not a number', () => {
    expect(formatFieldValue(NaN, WEIGHT_FIELD)).toBe('');
  });
});

describe('field configuration', () => {
  it('allows zero weight but never zero reps', () => {
    expect(WEIGHT_FIELD.min).toBe(0);
    expect(REPS_FIELD.min).toBe(1);
  });

  it('uses the shared reps default when a set carries no target', () => {
    expect(clampFieldValue(DEFAULT_REPS, REPS_FIELD)).toBe(10);
  });
});