import { addDays, format, startOfWeek } from 'date-fns';
import type { SessionExercise, WorkoutSession } from '../../lib/api';
import { getExerciseTutorial } from '../../lib/exerciseDatabase';
import type { ProgramDraft } from './types';

export const CARDIO_WARMUP_VIDEO = 'https://www.youtube-nocookie.com/embed/9L2b2khySLE';

export function isCardioExercise(exercise: SessionExercise) {
  const muscle = (exercise.targetMuscle || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  return (
    muscle === 'cardio' ||
    name.includes('cardio') ||
    name.includes('treadmill') ||
    name.includes('bike') ||
    name.includes('rowing')
  );
}

function toLocalDateString(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function startOfTrainingDay() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

export function resolveBaseStart(scheduleStart: 'thisWeek' | 'nextWeek', days: number[], today = startOfTrainingDay()) {
  const currentWeekSaturday = startOfWeek(today, { weekStartsOn: 6 });
  let baseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSaturday, 7) : currentWeekSaturday;
  let startsNextWeekAutomatically = false;
  if (scheduleStart === 'thisWeek') {
    const remaining = days.filter(offset => addDays(currentWeekSaturday, offset) >= today);
    if (remaining.length === 0) {
      baseStart = addDays(currentWeekSaturday, 7);
      startsNextWeekAutomatically = true;
    }
  }
  return { baseStart, startsNextWeekAutomatically };
}

export type BuildSessionsInput = {
  program: ProgramDraft;
  days: number[];
  repeatWeeks: number;
  scheduleStart: 'thisWeek' | 'nextWeek';
  now?: Date;
};

export function buildProgramSessions({
  program,
  days,
  repeatWeeks,
  scheduleStart,
  now
}: BuildSessionsInput): WorkoutSession[] {
  const today = now ? new Date(now) : startOfTrainingDay();
  today.setHours(0, 0, 0, 0);
  const { baseStart } = resolveBaseStart(scheduleStart, days, today);
  const sortedDays = [...days].sort((a, b) => a - b);
  const timestamp = Date.now();
  const sessions: WorkoutSession[] = [];

  for (let w = 0; w < repeatWeeks; w++) {
    for (let i = 0; i < sortedDays.length; i++) {
      if (i >= program.sessions.length) break;
      const dayOffset = sortedDays[i];
      const targetDate = addDays(baseStart, w * 7 + dayOffset);
      targetDate.setHours(18, 0, 0, 0);
      if (targetDate < today) continue;

      const template = program.sessions[i];
      let exercises: SessionExercise[] = template.exercises.map((exercise, exIdx) => {
        const tutorial = getExerciseTutorial(exercise.name, exercise.targetMuscle);
        return {
          ...exercise,
          videoUrl: exercise.videoUrl || tutorial.videoUrl,
          id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}`,
          sets: (exercise.sets || []).map((set, setIdx) => ({
            ...set,
            id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}-s${setIdx}`,
            repsActual: 0,
            isCompleted: false
          }))
        };
      });

      if (exercises.length === 0 || !isCardioExercise(exercises[0])) {
        exercises = [
          {
            id: `${timestamp}-w${w}-d${dayOffset}-cardio`,
            name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
            targetMuscle: 'Cardio',
            restTime: 60,
            notes: '5-10 minutes of light aerobic warm-up to prepare joints and elevate core temperature.',
            duration: 10,
            videoUrl: CARDIO_WARMUP_VIDEO,
            sets: [
              {
                id: `${timestamp}-w${w}-d${dayOffset}-cardio-s1`,
                weight: 0,
                repsTarget: 10,
                repsActual: 10,
                unit: 'kg',
                isCompleted: false
              }
            ]
          },
          ...exercises
        ];
      }

      sessions.push({
        id: `${timestamp}-w${w}-d${dayOffset}`,
        title: template.title,
        date: toLocalDateString(targetDate),
        duration: 60,
        type: template.type,
        notes: `Routine: ${program.name}${repeatWeeks > 1 ? ` (Week ${w + 1})` : ''}`,
        isCompleted: false,
        exercises
      });
    }
  }

  return sessions;
}

export function findReplaceableSessionIds(
  existing: WorkoutSession[],
  incoming: WorkoutSession[],
  now?: Date
): string[] {
  if (existing.length === 0 || incoming.length === 0) return [];
  const today = now ? new Date(now) : startOfTrainingDay();
  today.setHours(0, 0, 0, 0);
  const targetDates = new Set(incoming.map(session => format(new Date(session.date), 'yyyy-MM-dd')));
  return existing
    .filter(session => {
      if (session.isCompleted) return false;
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today && targetDates.has(format(new Date(session.date), 'yyyy-MM-dd'));
    })
    .map(session => session.id);
}
