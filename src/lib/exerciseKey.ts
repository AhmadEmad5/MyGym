/**
 * Pure, Firebase-free exercise identity and load classification.
 *
 * `canonicalizeExerciseKey` does NOT re-implement alias resolution. It calls the
 * existing, proven ladder in `exerciseDatabase.ts` (`getExerciseTutorial`),
 * which already owns direct-slug lookup, exact English/Arabic name matching and
 * the whole alias table. Duplicating any of that would be a second source of
 * truth that drifts.
 *
 * `exerciseDatabase.ts` imports nothing at all, so this module stays free of
 * Firebase, React and the DOM and is safe to load in a node test.
 */

import {
  EXERCISE_DATABASE,
  getExerciseTutorial,
  type ExerciseTutorial,
} from './exerciseDatabase';

export type LoadClass =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'timed'
  | 'unknown';

export interface ExerciseKey {
  readonly slug: string;
  readonly canonical: boolean;
  readonly load: LoadClass;
}

export const CANONICAL_EXERCISE_KEYS: readonly string[] = Object.freeze(Object.keys(EXERCISE_DATABASE));

export function isCanonicalExerciseKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(EXERCISE_DATABASE, key);
}

/** Returns the canonical slug an exercise name resolves to, synthetic or not. */
export function canonicalizeExerciseKey(exerciseName: string, fallbackMuscle?: string): string {
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return '';
  return getExerciseTutorial(exerciseName.trim(), fallbackMuscle).id;
}

export function resolveExerciseKey(exerciseName: string, fallbackMuscle?: string): ExerciseKey {
  const slug = canonicalizeExerciseKey(exerciseName, fallbackMuscle);
  if (!slug) return { slug: '', canonical: false, load: 'unknown' };
  const tutorial = EXERCISE_DATABASE[slug];
  return {
    slug,
    canonical: tutorial !== undefined,
    load: tutorial ? classifyLoad(tutorial) : 'unknown',
  };
}

const TIMED = /treadmill|stationary bike|elliptical|rower|rowing|stairs|stairmaster|cardio|walk|\brun\b/;
const CABLE = /cable|pulley|\brope\b|\bcbt\b/;
const MACHINE = /machine|pec deck|leg press|leg extension|chest press|smith|\bhack\b/;
const BARBELL = /barbell|ez-bar|\brack\b|plates/;
const DUMBBELL = /dumbbell|\bdb\b/;
const BODYWEIGHT = /bodyweight|pull-up|push-up|pushup|ab roller|\bmat\b|parallel bar|dip station|\bband\b/;

/**
 * Classifies how an exercise is loaded, so a later phase can pick a sensible
 * starting weight for a brand new set.
 *
 * Returns `'unknown'` for anything unrecognised — most importantly for the
 * tutorials `generateDynamicTutorial` synthesises for unlisted custom
 * exercises, which carry no `motionPattern` and a generic `'Gym Equipment'`
 * string. There is no biomechanics data to classify from there, and guessing
 * would put a fabricated number in front of a user mid-set.
 */
export function classifyLoad(tutorial: ExerciseTutorial): LoadClass {
  if (!tutorial) return 'unknown';

  const canonical = isCanonicalExerciseKey(tutorial.id);
  if (!canonical && !tutorial.motionPattern) return 'unknown';
  if (tutorial.motionPattern === 'cardio') return 'timed';

  const haystack = `${tutorial.equipment} ${tutorial.name} ${tutorial.id}`.toLowerCase();

  if (TIMED.test(haystack)) return 'timed';
  if (CABLE.test(haystack)) return 'cable';
  if (MACHINE.test(haystack)) return 'machine';
  if (BARBELL.test(haystack)) return 'barbell';
  if (DUMBBELL.test(haystack)) return 'dumbbell';
  if (BODYWEIGHT.test(haystack)) return 'bodyweight';

  return 'unknown';
}