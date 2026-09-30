/**
 * Pure, Firebase-free default-weight domain logic.
 *
 * Nothing in this module touches React, the DOM or `src/lib/api.ts` (which
 * imports `firebase/firestore` at :517-518). That is deliberate: a Firebase
 * import would drag the SDK into the unit test graph for no reason.
 *
 * The central contract is that a legal `0` and an ABSENCE are different facts.
 * A user who typed `0` has said something ("this movement is unloaded"); a
 * record with no entry for an exercise has said nothing. `ResolvedWeight` is a
 * discriminated union for exactly that distinction, and its `absent` arm
 * carries no value at all.
 */

export type WeightUnit = 'kg' | 'lb';

export const WEIGHT_UNITS: readonly WeightUnit[] = Object.freeze(['kg', 'lb'] as const);

export interface DefaultWeights {
  unit: WeightUnit;
  byExercise: Record<string, number>;
}

/**
 * Declared bounds for any stored default weight. One set for both units on
 * purpose: a per-unit ceiling would make `800` clamp in `kg` and pass through
 * in `lb`, so the same corrupt record would normalise differently depending on
 * a setting the user can flip at any time. `min` is `0`, not a positive floor,
 * because `0` is a legal default.
 */
export const DEFAULT_WEIGHTS_LIMITS = {
  min: 0,
  max: 700,
  step: 0.5,
} as const;

const KG_PER_LB = 0.453592;
const LB_PER_KG = 2.20462;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === 'kg' || value === 'lb';
}

/**
 * Rounds to the nearest multiple of `step`. A tiny epsilon nudge is added
 * before the division so binary drift (`2.55 / 0.5 === 5.099999999999999`)
 * cannot push a value that is already on the step down to the step below it.
 */
export function roundWeight(value: number, step: number = DEFAULT_WEIGHTS_LIMITS.step): number {
  if (!Number.isFinite(value)) return DEFAULT_WEIGHTS_LIMITS.min;
  if (!Number.isFinite(step) || step <= 0) return value;
  const scaled = value / step;
  const nudge = scaled >= 0 ? 1e-9 : -1e-9;
  return Number((Math.round(scaled + nudge) * step).toFixed(10));
}

export function clampWeight(value: number): number {
  return Math.min(Math.max(value, DEFAULT_WEIGHTS_LIMITS.min), DEFAULT_WEIGHTS_LIMITS.max);
}

/**
 * Normalises one stored weight. Returns `null` only when the value is not a
 * usable number at all (wrong type, `NaN`, `±Infinity`) — a finite but
 * out-of-range number is clamped, not discarded.
 */
export function normalizeDefaultWeight(value: unknown, unit: WeightUnit): number | null {
  if (!isWeightUnit(unit)) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return roundWeight(clampWeight(value));
}

/**
 * Normalises a whole stored record. Returns `null` when the record is not
 * addressable at all (not an object, or a `unit` that is neither `lb` nor
 * `kg`). A `byExercise` map with a bad value drops THAT KEY and keeps the rest,
 * so one corrupt entry cannot discard a user's other defaults.
 */
export function normalizeDefaultWeights(raw: unknown): DefaultWeights | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const candidate = raw as { unit?: unknown; byExercise?: unknown };
  if (!isWeightUnit(candidate.unit)) return null;

  const unit = candidate.unit;
  const byExercise: Record<string, number> = {};
  const source = candidate.byExercise;

  if (source !== null && typeof source === 'object' && !Array.isArray(source)) {
    for (const [rawKey, rawValue] of Object.entries(source as Record<string, unknown>)) {
      const key = rawKey.trim();
      if (!key) continue;
      const value = normalizeDefaultWeight(rawValue, unit);
      if (value !== null) byExercise[key] = value;
    }
  }

  return { unit, byExercise };
}

/** Uses the same factors as the unit-switch migration in SettingsView.tsx:159. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (!Number.isFinite(value)) return 0;
  if (from === to) return value;
  return roundWeight(from === 'kg' ? value * LB_PER_KG : value * KG_PER_LB);
}

export type WeightSource = 'exercise' | 'class';

export type ResolvedWeight =
  | { kind: 'resolved'; value: number; unit: WeightUnit; source: WeightSource }
  | { kind: 'absent' };

/**
 * Resolves the weight a new set should start from: the per-exercise entry wins,
 * then the exercise's load-class default. `classDefault` is assumed to already
 * be expressed in `unit`. Returns `kind: 'absent'` when neither tier applies,
 * so a caller can tell "use zero" apart from "I know nothing".
 */
export function resolveDefaultWeight(
  exerciseKey: string,
  weights: DefaultWeights | null,
  unit: WeightUnit,
  classDefault?: number | null,
): ResolvedWeight {
  if (!isWeightUnit(unit)) return { kind: 'absent' };

  const key = exerciseKey.trim();
  if (key && weights) {
    const stored = weights.byExercise[key];
    if (typeof stored === 'number' && Number.isFinite(stored)) {
      const value = weights.unit === unit ? stored : convertWeight(stored, weights.unit, unit);
      return { kind: 'resolved', value, unit, source: 'exercise' };
    }
  }

  if (classDefault !== undefined && classDefault !== null) {
    const value = normalizeDefaultWeight(classDefault, unit);
    if (value !== null) return { kind: 'resolved', value, unit, source: 'class' };
  }

  return { kind: 'absent' };
}