import { describe, expect, it } from 'vitest';
import { convertRoutineUnits, convertSessionUnits, convertWeight } from '../weights';
import type { Routine, SessionExercise, WorkoutSession } from '../api';

const exercise = (id: string, weight: number, unit: 'kg' | 'lb' | undefined): SessionExercise => ({
  id,
  name: id,
  targetMuscle: 'Chest',
  restTime: 90,
  notes: '',
  sets: [{ id: `${id}-1`, weight, repsTarget: 10, repsActual: 10, unit: unit as 'kg' | 'lb', isCompleted: false }]
});

const session = (id: string): WorkoutSession => ({
  id,
  title: 'Push',
  date: '2026-01-05',
  duration: 60,
  type: 'Strength',
  notes: '',
  isCompleted: true,
  exercises: [exercise('bench', 100, 'kg')]
});

describe('convertSessionUnits', () => {
  it('converts logged sets into the target unit', () => {
    const [converted] = convertSessionUnits(session('s1'), 'kg', 'lb').exercises;
    expect(converted.sets[0]).toMatchObject({ weight: 220.5, unit: 'lb' });
  });

  it('round-trips back to the original value', () => {
    const toLb = convertSessionUnits(session('s1'), 'kg', 'lb');
    const backToKg = convertSessionUnits(toLb, 'lb', 'kg');
    expect(backToKg.exercises[0].sets[0].weight).toBe(100);
  });

  it('falls back to the athlete setting when a legacy set has no unit', () => {
    const legacy = session('s1');
    legacy.exercises = [exercise('bench', 60, undefined)];
    delete (legacy.exercises[0].sets[0] as { unit?: string }).unit;
    const [converted] = convertSessionUnits(legacy, 'kg', 'lb').exercises;
    expect(converted.sets[0]).toMatchObject({ weight: 132.5, unit: 'lb' });
  });

  it('leaves the original session untouched', () => {
    const original = session('s1');
    convertSessionUnits(original, 'kg', 'lb');
    expect(original.exercises[0].sets[0]).toMatchObject({ weight: 100, unit: 'kg' });
  });
});

describe('convertRoutineUnits', () => {
  const multiDay = (): Routine => ({
    id: 'ppl',
    name: 'PPL',
    description: '',
    exercises: [exercise('bench', 100, 'kg')],
    sessions: [
      { title: 'Push', type: 'Strength', exercises: [exercise('bench', 100, 'kg'), exercise('ohp', 60, 'kg')] },
      { title: 'Pull', type: 'Strength', exercises: [exercise('row', 80, 'kg')] },
      { title: 'Legs', type: 'Strength', exercises: [exercise('squat', 140, 'kg')] }
    ]
  });

  it('converts routine.sessions as well as routine.exercises', () => {
    const routine = multiDay();
    const converted = convertRoutineUnits(routine, 'kg', 'lb');

    expect(converted.exercises[0].sets[0]).toMatchObject({ weight: 220.5, unit: 'lb' });
    expect(converted.sessions?.map((day) => day.exercises.map((ex) => ex.sets[0].weight))).toEqual([
      [220.5, 132.5],
      [176.5],
      [308.5]
    ]);
    expect(converted.sessions?.every((day) => day.exercises.every((ex) => ex.sets[0].unit === 'lb'))).toBe(true);
  });

  it('leaves no session disagreeing with routine.exercises', () => {
    const routine = multiDay();
    const converted = convertRoutineUnits(routine, 'kg', 'lb');
    // sessions[0] mirrors routine.exercises; if only one of the two is converted the
    // same lift reads 220.5 lb in one place and 100 kg in the other.
    expect(converted.sessions![0].exercises[0].sets[0]).toEqual(converted.exercises[0].sets[0]);
  });

  it('preserves the session titles and other routine fields', () => {
    const converted = convertRoutineUnits(multiDay(), 'kg', 'lb');
    expect(converted.sessions?.map((day) => day.title)).toEqual(['Push', 'Pull', 'Legs']);
    expect(converted.name).toBe('PPL');
    expect(converted.daysRequired).toBeUndefined();
  });

  it('does not add a sessions key to legacy single-session routines', () => {
    const legacy: Routine = { id: 'r1', name: 'Legacy', description: '', exercises: [exercise('bench', 100, 'kg')] };
    const converted = convertRoutineUnits(legacy, 'kg', 'lb');
    expect('sessions' in converted).toBe(false);
  });

  it('does not mutate the routine it was given', () => {
    const routine = multiDay();
    convertRoutineUnits(routine, 'kg', 'lb');
    expect(routine.sessions![1].exercises[0].sets[0]).toMatchObject({ weight: 80, unit: 'kg' });
  });
});

describe('convertWeight', () => {
  it('agrees with the displayed unit in both directions', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.5, 1);
    expect(convertWeight(220.5, 'lb', 'kg')).toBeCloseTo(100, 1);
  });

  it('keeps an unloaded set at zero', () => {
    expect(convertWeight(0, 'kg', 'lb')).toBe(0);
  });

  it('is a no-op when the unit already matches', () => {
    expect(convertWeight(72.5, 'kg', 'kg')).toBe(72.5);
  });
});
