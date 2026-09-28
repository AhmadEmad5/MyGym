import { addDays } from 'date-fns';
import type { Day } from 'date-fns';
import type { SessionExercise, WorkoutSession } from '../../../lib/api';
import { ensureCardioWarmup } from './templates';

type PplBlock = { name: string; targetMuscle: string; restTime: number; videoUrl?: string; reps: number };

const PUSH: PplBlock[] = [
  { name: 'Bench Press', targetMuscle: 'Chest', restTime: 90, videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE', reps: 10 },
  { name: 'Overhead Press', targetMuscle: 'Shoulders', restTime: 90, videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34', reps: 10 },
  { name: 'Tricep Pushdown', targetMuscle: 'Triceps', restTime: 60, videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U', reps: 12 }
];

const PULL: PplBlock[] = [
  { name: 'Pull-Ups', targetMuscle: 'Back', restTime: 90, reps: 8 },
  { name: 'Barbell Row', targetMuscle: 'Back', restTime: 90, videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk', reps: 10 },
  { name: 'Bicep Curls', targetMuscle: 'Biceps', restTime: 60, videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0', reps: 12 }
];

const LEGS: PplBlock[] = [
  { name: 'Squats', targetMuscle: 'Legs', restTime: 120, videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE', reps: 8 },
  { name: 'Leg Press', targetMuscle: 'Legs', restTime: 90, videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w', reps: 10 },
  { name: 'Calf Raises', targetMuscle: 'Calves', restTime: 60, videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc', reps: 15 }
];

const PPL_BLOCKS: { days: number[]; title: string; blueprint: PplBlock[] }[] = [
  { days: [6, 2], title: 'Push (Chest, Shoulders, Triceps)', blueprint: PUSH },
  { days: [0, 3], title: 'Pull (Back, Biceps)', blueprint: PULL },
  { days: [1, 4], title: 'Legs (Quads, Hamstrings)', blueprint: LEGS }
];

export const REST_DAY = 5;

export function toExercises(blueprint: PplBlock[], seed: string): SessionExercise[] {
  return blueprint.map((entry, index) => ({
    id: `${seed}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: entry.name,
    targetMuscle: entry.targetMuscle,
    restTime: entry.restTime,
    notes: '',
    videoUrl: entry.videoUrl,
    sets: [{ id: `${seed}-${index}-s1`, weight: 0, repsTarget: entry.reps, repsActual: 0, unit: 'lb', isCompleted: false }]
  }));
}

export function buildPPLPlan(days = 28, now = new Date()): WorkoutSession[] {
  const baseDate = new Date(now);
  baseDate.setHours(18, 0, 0, 0);
  const stamp = Date.now();
  const sessions: WorkoutSession[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(baseDate, i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === REST_DAY) continue;
    const block = PPL_BLOCKS.find(item => item.days.includes(dayOfWeek));
    if (!block) continue;
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    sessions.push({
      id: `ppl-${stamp}-${i}`,
      title: block.title,
      date: dateStr,
      duration: 60,
      type: 'Strength',
      notes: 'Auto-generated PPL routine.',
      isCompleted: false,
      exercises: ensureCardioWarmup(toExercises(block.blueprint, `ppl-${stamp}-${i}`))
    });
  }

  return sessions;
}

export function resolveWeekStartsOn(setting?: 'saturday' | 'sunday' | 'monday'): Day {
  if (setting === 'monday') return 1;
  if (setting === 'sunday') return 0;
  return 6;
}

export function sessionAccent(type?: string, title?: string) {
  const value = (title || '').toLowerCase();
  if (value.includes('push')) return 'var(--accent-cyan)';
  if (value.includes('cardio') || type === 'Cardio') return 'var(--accent-green)';
  if (value.includes('pull')) return 'var(--accent-purple)';
  if (value.includes('leg')) return 'var(--accent-yellow)';
  return 'var(--accent-primary)';
}

export function targetMusclesText(exercises?: SessionExercise[]) {
  if (!exercises || exercises.length === 0) return '';
  return Array.from(new Set(exercises.map(exercise => exercise.targetMuscle).filter(Boolean))).join(' • ');
}

export function totalTonnage(sets: { weight?: number; repsActual?: number; repsTarget?: number }[] = []) {
  return sets.reduce((total, set) => total + (set.weight || 0) * (set.repsActual ?? set.repsTarget ?? 0), 0);
}

export function formatTonnage(tonnage: number, unit: 'kg' | 'lb' = 'kg') {
  if (tonnage <= 0) return '';
  if (unit === 'lb' && tonnage < 1000) return `${Math.round(tonnage)} lb`;
  if (tonnage >= 1000) return `${(tonnage / 1000).toFixed(1)} t`;
  return `${Math.round(tonnage)} kg`;
}

export function nextTrainingDay(date: Date) {
  let candidate = new Date(date);
  if (candidate.getDay() === REST_DAY) candidate = addDays(candidate, 1);
  return candidate;
}

export function toLocalDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
