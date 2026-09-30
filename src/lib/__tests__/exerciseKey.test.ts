import { describe, expect, it } from 'vitest';
import { EXERCISE_DATABASE, getExerciseTutorial } from '../exerciseDatabase';
import {
  CANONICAL_EXERCISE_KEYS,
  canonicalizeExerciseKey,
  classifyLoad,
  isCanonicalExerciseKey,
  resolveExerciseKey,
  type LoadClass,
} from '../exerciseKey';

describe('CANONICAL_EXERCISE_KEYS (E-01)', () => {
  it('E-01 exposes the 28 curated database slugs', () => {
    expect(CANONICAL_EXERCISE_KEYS).toHaveLength(28);
    expect(CANONICAL_EXERCISE_KEYS).toEqual(Object.keys(EXERCISE_DATABASE));
    expect(CANONICAL_EXERCISE_KEYS).toContain('barbell-back-squat');
    expect(CANONICAL_EXERCISE_KEYS).toContain('treadmill');
  });

  it('E-01 isCanonicalExerciseKey only accepts a real database key', () => {
    expect(isCanonicalExerciseKey('barbell-back-squat')).toBe(true);
    expect(isCanonicalExerciseKey('barbell-back-squat-extra')).toBe(false);
    expect(isCanonicalExerciseKey('toString')).toBe(false);
    expect(isCanonicalExerciseKey('constructor')).toBe(false);
    expect(isCanonicalExerciseKey('')).toBe(false);
    expect(isCanonicalExerciseKey(undefined as unknown as string)).toBe(false);
  });
});

describe('canonicalizeExerciseKey (E-02)', () => {
  it('E-02 reuses the existing resolution ladder instead of duplicating it', () => {
    expect(canonicalizeExerciseKey('Barbell Back Squat')).toBe('barbell-back-squat');
    expect(canonicalizeExerciseKey('Flat Bench Press')).toBe('barbell-bench-press');
    expect(canonicalizeExerciseKey('Incline Bench Press')).toBe('incline-dumbbell-press');
    expect(canonicalizeExerciseKey('Squat')).toBe('barbell-back-squat');
    expect(canonicalizeExerciseKey('RDL')).toBe('romanian-deadlift');
    expect(canonicalizeExerciseKey('Cable Fly')).toBe('chest-cable-fly');
    expect(canonicalizeExerciseKey('Push Ups')).toBe('push-ups');
    expect(canonicalizeExerciseKey('Lat Pulldown')).toBe('lat-pulldown');
    expect(canonicalizeExerciseKey('Seated Cable Row')).toBe('seated-cable-row');
    expect(canonicalizeExerciseKey('Leg Press')).toBe('leg-press');
    expect(canonicalizeExerciseKey('Leg Extension')).toBe('leg-extension');
    expect(canonicalizeExerciseKey('Overhead Press')).toBe('overhead-press');
    expect(canonicalizeExerciseKey('Lateral Raise')).toBe('cable-lateral-raise');
    expect(canonicalizeExerciseKey('Face Pull')).toBe('face-pull');
    expect(canonicalizeExerciseKey('Front Raise')).toBe('front-dumbbell-raise');
    expect(canonicalizeExerciseKey('Reverse Pec Deck')).toBe('reverse-pec-deck');
    expect(canonicalizeExerciseKey('Bicep Curls')).toBe('bicep-curls');
    expect(canonicalizeExerciseKey('Tricep Pushdown')).toBe('tricep-pushdown');
    expect(canonicalizeExerciseKey('Hanging Leg Raise')).toBe('hanging-leg-raise');
    expect(canonicalizeExerciseKey('Woodchopper')).toBe('cable-woodchopper');
    expect(canonicalizeExerciseKey('Ab Wheel Rollout')).toBe('ab-wheel-rollout');
    expect(canonicalizeExerciseKey('Crunches')).toBe('crunches');
    expect(canonicalizeExerciseKey('Treadmill')).toBe('treadmill');
  });

  it('E-02 matches getExerciseTutorial for every probed name', () => {
    for (const name of ['Barbell Back Squat', 'Cable Fly', 'Crunches', 'Treadmill', 'Dips', 'Lat Pulldown']) {
      expect(canonicalizeExerciseKey(name)).toBe(getExerciseTutorial(name).id);
    }
  });

  it('E-02 canonicalises the Arabic name forms too', () => {
    expect(canonicalizeExerciseKey('ضغط صدر')).toBe('barbell-bench-press');
    expect(canonicalizeExerciseKey('كيبل فلاي')).toBe('chest-cable-fly');
    expect(canonicalizeExerciseKey('تمديد')).toBe('leg-extension');
  });

  it('E-02 returns the synthetic slug for an unlisted custom exercise', () => {
    expect(canonicalizeExerciseKey('My Weird Custom Thing')).toBe('my-weird-custom-thing');
    expect(isCanonicalExerciseKey(canonicalizeExerciseKey('My Weird Custom Thing'))).toBe(false);
  });

  it('E-02 returns an empty key for empty or non-string input', () => {
    expect(canonicalizeExerciseKey('')).toBe('');
    expect(canonicalizeExerciseKey('   ')).toBe('');
    expect(canonicalizeExerciseKey(undefined as unknown as string)).toBe('');
    expect(resolveExerciseKey('')).toEqual({ slug: '', canonical: false, load: 'unknown' });
  });
});

describe('classifyLoad (E-03)', () => {
  it('E-03 classifies every curated tutorial into a real load class', () => {
    const seen = new Set<LoadClass>();
    for (const [key, tutorial] of Object.entries(EXERCISE_DATABASE)) {
      const load = classifyLoad(tutorial);
      expect(load, key).not.toBe('unknown');
      seen.add(load);
    }
    expect([...seen].sort()).toEqual(['barbell', 'bodyweight', 'cable', 'dumbbell', 'machine', 'timed']);
  });

  it('E-03 reads equipment, so the obvious cases land in the obvious bucket', () => {
    const load = (name: string) => classifyLoad(getExerciseTutorial(name));
    expect(load('Barbell Back Squat')).toBe('barbell');
    expect(load('Barbell Row')).toBe('barbell');
    expect(load('Overhead Press')).toBe('barbell');
    expect(load('Incline Bench Press')).toBe('dumbbell');
    expect(load('Front Raise')).toBe('dumbbell');
    expect(load('Seated Cable Row')).toBe('cable');
    expect(load('Tricep Pushdown')).toBe('cable');
    expect(load('Cable Fly')).toBe('cable');
    expect(load('Leg Press')).toBe('machine');
    expect(load('Leg Extension')).toBe('machine');
    expect(load('Reverse Pec Deck')).toBe('machine');
    expect(load('Seated Machine Chest Press')).toBe('machine');
    expect(load('Push-ups')).toBe('bodyweight');
    expect(load('Crunches')).toBe('bodyweight');
    expect(load('Ab Wheel Rollout')).toBe('bodyweight');
    expect(load('Treadmill')).toBe('timed');
  });

  it('E-03 returns unknown for a synthesised tutorial with no biomechanics', () => {
    for (const name of ['My Weird Custom Thing', 'Landmine Press', 'Sled Push', 'Lacrosse Ball Toss', 'Suitcase Carry']) {
      const tutorial = getExerciseTutorial(name, 'Chest');
      expect(tutorial.motionPattern, name).toBeUndefined();
      expect(tutorial.equipment, name).toBe('Gym Equipment');
      expect(classifyLoad(tutorial), name).toBe('unknown');
      expect(resolveExerciseKey(name).load, name).toBe('unknown');
      expect(resolveExerciseKey(name).canonical, name).toBe(false);
    }
  });

  it('E-03 an unrecognised name never resolves to a fabricated class', () => {
    const resolved = resolveExerciseKey('chest press machine');
    expect(resolved.canonical).toBe(false);
    expect(resolved.load).toBe('unknown');
  });

  it('E-03 guards against a missing tutorial', () => {
    expect(classifyLoad(null as never)).toBe('unknown');
    expect(classifyLoad(undefined as never)).toBe('unknown');
  });

  it('E-03 resolves mixed barbell-or-dumbbell equipment deterministically to barbell', () => {
    expect(classifyLoad(EXERCISE_DATABASE['romanian-deadlift'])).toBe('barbell');
    expect(classifyLoad(EXERCISE_DATABASE['bicep-curls'])).toBe('barbell');
    expect(EXERCISE_DATABASE['romanian-deadlift'].equipment).toContain('Dumbbells');
  });
});

describe('resolveExerciseKey (E-04)', () => {
  it('E-04 bundles slug, canonicality and load class', () => {
    expect(resolveExerciseKey('Barbell Back Squat')).toEqual({
      slug: 'barbell-back-squat',
      canonical: true,
      load: 'barbell',
    });
  });

  it('E-04 every canonical slug classifies as itself', () => {
    for (const slug of CANONICAL_EXERCISE_KEYS) {
      const resolved = resolveExerciseKey(slug);
      expect(resolved.slug).toBe(slug);
      expect(resolved.canonical).toBe(true);
      expect(resolved.load).not.toBe('unknown');
    }
  });
});