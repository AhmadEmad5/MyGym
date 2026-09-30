import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHTS_LIMITS,
  WEIGHT_UNITS,
  clampWeight,
  convertWeight,
  normalizeDefaultWeight,
  normalizeDefaultWeights,
  resolveDefaultWeight,
  roundWeight,
  type DefaultWeights,
} from '../weights';

describe('normalizeDefaultWeights (W-01..W-08)', () => {
  it('W-01 returns null for null', () => {
    expect(normalizeDefaultWeights(null)).toBeNull();
  });

  it('W-02 returns null for undefined', () => {
    expect(normalizeDefaultWeights(undefined)).toBeNull();
  });

  it('W-03 returns null for a string', () => {
    expect(normalizeDefaultWeights('x')).toBeNull();
  });

  it('W-04 returns null for a number', () => {
    expect(normalizeDefaultWeights(42)).toBeNull();
  });

  it('W-05 returns null for an array', () => {
    expect(normalizeDefaultWeights([])).toBeNull();
  });

  it('W-06 returns null when the unit is not lb or kg', () => {
    expect(normalizeDefaultWeights({ unit: 'stone', byExercise: { squat: 100 } })).toBeNull();
    expect(normalizeDefaultWeights({ byExercise: { squat: 100 } })).toBeNull();
    expect(normalizeDefaultWeights({ unit: 'KG', byExercise: {} })).toBeNull();
    expect(normalizeDefaultWeights({ unit: '', byExercise: {} })).toBeNull();
  });

  it('W-07 accepts both lb and kg', () => {
    expect(WEIGHT_UNITS).toEqual(['kg', 'lb']);
    expect(normalizeDefaultWeights({ unit: 'kg', byExercise: { 'barbell-squat': 60 } })).toEqual({
      unit: 'kg',
      byExercise: { 'barbell-squat': 60 },
    });
    expect(normalizeDefaultWeights({ unit: 'lb', byExercise: { 'barbell-squat': 135 } })).toEqual({
      unit: 'lb',
      byExercise: { 'barbell-squat': 135 },
    });
  });

  it('W-08 drops only the offending key from byExercise', () => {
    const result = normalizeDefaultWeights({
      unit: 'kg',
      byExercise: {
        'barbell-squat': 80,
        'incline-dumbbell-press': 'x',
        bicep: 22,
        deadlift: NaN,
        row: 40,
        press: null,
        curl: Infinity,
      },
    });

    expect(result).toEqual({
      unit: 'kg',
      byExercise: { 'barbell-squat': 80, bicep: 22, row: 40 },
    });
  });
});

describe('clamping and rounding (W-09..W-12)', () => {
  it('W-09 clamps above the declared maximum to 700', () => {
    expect(DEFAULT_WEIGHTS_LIMITS.max).toBe(700);
    expect(normalizeDefaultWeight(800, 'kg')).toBe(700);
    expect(normalizeDefaultWeight(800, 'lb')).toBe(700);
    expect(normalizeDefaultWeight(700, 'kg')).toBe(700);
    expect(clampWeight(100000)).toBe(700);
  });

  it('W-10 clamps a negative weight to 0, and 0 is a value not an absence', () => {
    expect(DEFAULT_WEIGHTS_LIMITS.min).toBe(0);
    expect(normalizeDefaultWeight(-5, 'kg')).toBe(0);
    expect(normalizeDefaultWeight(-0.4, 'kg')).toBe(0);
    expect(normalizeDefaultWeight(-5, 'kg')).not.toBeNull();
    expect(normalizeDefaultWeight(0, 'kg')).toBe(0);
    expect(normalizeDefaultWeight(0, 'kg')).not.toBeNull();
  });

  it('W-11 rounds to the declared step', () => {
    expect(DEFAULT_WEIGHTS_LIMITS.step).toBe(0.5);
    expect(roundWeight(2.24)).toBe(2);
    expect(roundWeight(2.25)).toBe(2.5);
    expect(roundWeight(2.75)).toBe(3);
    expect(roundWeight(62.3)).toBe(62.5);
    expect(roundWeight(62.2)).toBe(62);
    expect(normalizeDefaultWeight(62.3, 'kg')).toBe(62.5);
    expect(roundWeight(2.55)).toBe(2.5);
    expect(roundWeight(137.4, 1)).toBe(137);
    expect(roundWeight(137.6, 1)).toBe(138);
  });

  it('W-12 rejects values that are not usable numbers at all', () => {
    expect(normalizeDefaultWeight('x', 'kg')).toBeNull();
    expect(normalizeDefaultWeight(null, 'kg')).toBeNull();
    expect(normalizeDefaultWeight(undefined, 'kg')).toBeNull();
    expect(normalizeDefaultWeight({}, 'kg')).toBeNull();
    expect(normalizeDefaultWeight([], 'kg')).toBeNull();
    expect(normalizeDefaultWeight(NaN, 'kg')).toBeNull();
    expect(normalizeDefaultWeight(Infinity, 'kg')).toBeNull();
    expect(normalizeDefaultWeight(-Infinity, 'kg')).toBeNull();
    expect(normalizeDefaultWeight(20, 'stone' as 'kg')).toBeNull();
  });
});

describe('normalizeDefaultWeight (W-13)', () => {
  it('W-13 clamps then rounds, in that order', () => {
    expect(normalizeDefaultWeight(800.4, 'kg')).toBe(700);
    expect(normalizeDefaultWeight(-0.6, 'kg')).toBe(0);
    expect(normalizeDefaultWeight(12.26, 'kg')).toBe(12.5);
    expect(normalizeDefaultWeight(12.24, 'kg')).toBe(12);
  });

  it('W-13 ignores surrounding whitespace in a map key', () => {
    expect(
      normalizeDefaultWeights({ unit: 'kg', byExercise: { '  barbell-squat ': 60 } }),
    ).toEqual({ unit: 'kg', byExercise: { 'barbell-squat': 60 } });
  });
});

describe('convertWeight (W-14)', () => {
  it('W-14 is a no-op when the unit does not change', () => {
    expect(convertWeight(100, 'kg', 'kg')).toBe(100);
    expect(convertWeight(100, 'lb', 'lb')).toBe(100);
  });

  it('W-14 uses the same factors as the SettingsView unit migration', () => {
    expect(convertWeight(100, 'lb', 'kg')).toBe(45.5);
    expect(convertWeight(100, 'kg', 'lb')).toBe(220.5);
  });

  it('W-14 round-trips back to the starting value on the step', () => {
    expect(convertWeight(convertWeight(60, 'kg', 'lb'), 'lb', 'kg')).toBe(60);
    expect(convertWeight(convertWeight(225, 'lb', 'kg'), 'kg', 'lb')).toBe(225);
  });

  it('W-14 maps a non-finite value to zero rather than propagating NaN', () => {
    expect(convertWeight(NaN, 'kg', 'lb')).toBe(0);
    expect(convertWeight(Infinity, 'kg', 'lb')).toBe(0);
  });
});

describe('resolveDefaultWeight (W-15..W-18)', () => {
  const weights: DefaultWeights = {
    unit: 'kg',
    byExercise: { 'barbell-squat': 80, 'flat-bench-press': 0 },
  };

  it('W-15 prefers the per-exercise entry over the class default', () => {
    expect(resolveDefaultWeight('barbell-squat', weights, 'kg', 20)).toEqual({
      kind: 'resolved',
      value: 80,
      unit: 'kg',
      source: 'exercise',
    });
  });

  it('W-15 falls back to the class default when there is no entry', () => {
    expect(resolveDefaultWeight('romanian-deadlift', weights, 'kg', 20)).toEqual({
      kind: 'resolved',
      value: 20,
      unit: 'kg',
      source: 'class',
    });
  });

  it('W-16 distinguishes a stored 0 from an absence', () => {
    expect(resolveDefaultWeight('flat-bench-press', weights, 'kg', 20)).toEqual({
      kind: 'resolved',
      value: 0,
      unit: 'kg',
      source: 'exercise',
    });
    expect(resolveDefaultWeight('romanian-deadlift', weights, 'kg')).toEqual({ kind: 'absent' });
    expect(resolveDefaultWeight('romanian-deadlift', null, 'kg')).toEqual({ kind: 'absent' });
    expect(resolveDefaultWeight('', weights, 'kg')).toEqual({ kind: 'absent' });
    expect(resolveDefaultWeight('   ', weights, 'kg')).toEqual({ kind: 'absent' });
  });

  it('W-17 the absent arm carries no value, unit or source', () => {
    const result = resolveDefaultWeight('romanian-deadlift', weights, 'kg');
    expect(result.kind).toBe('absent');
    expect(Object.keys(result)).toEqual(['kind']);
    expect('value' in result).toBe(false);
    expect('unit' in result).toBe(false);
    expect('source' in result).toBe(false);
  });

  it('W-18 converts a stored value into the requested unit', () => {
    expect(resolveDefaultWeight('barbell-squat', weights, 'lb', null)).toEqual({
      kind: 'resolved',
      value: 176.5,
      unit: 'lb',
      source: 'exercise',
    });
  });

  it('W-18 returns absent for an unknown target unit', () => {
    expect(resolveDefaultWeight('barbell-squat', weights, 'stone' as 'kg')).toEqual({ kind: 'absent' });
  });
});

describe('roundWeight (W-21)', () => {
  it('W-21 survives binary floating point drift', () => {
    expect(roundWeight(0.1 + 0.2)).toBe(0.5);
    expect(roundWeight(2.55)).toBe(2.5);
    expect(roundWeight(1.005, 0.01)).toBe(1.01);
    expect(roundWeight(4.4999999999999, 0.5)).toBe(4.5);
  });

  it('W-21 returns the floor for a non-finite value', () => {
    expect(roundWeight(NaN)).toBe(0);
    expect(roundWeight(Infinity)).toBe(0);
  });

  it('W-21 leaves the value alone when the step is unusable', () => {
    expect(roundWeight(12.3, 0)).toBe(12.3);
    expect(roundWeight(12.3, -1)).toBe(12.3);
  });
});