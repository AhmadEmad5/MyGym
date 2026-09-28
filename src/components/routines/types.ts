import type { SessionExercise, SetRecord } from '../../lib/api';
import type { PredefinedRoutine } from '../ProgramDeck3DCard';

export type ProgramSessionDraft = {
  title: string;
  type: string;
  exercises: SessionExercise[];
};

export type ProgramDraft = {
  id: string;
  name: string;
  description: string;
  category: string;
  daysRequired: number;
  difficulty?: PredefinedRoutine['difficulty'];
  difficultyScore?: number;
  estTime?: string;
  primaryMuscles?: string[];
  accentColor?: string;
  badge?: string;
  sessions: ProgramSessionDraft[];
  isCustom?: boolean;
};

let idCounter = 0;

export function createEntityId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function toProgramDraft(routine: PredefinedRoutine, isCustom = false): ProgramDraft {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    category: routine.category,
    daysRequired: routine.daysRequired,
    difficulty: routine.difficulty,
    difficultyScore: routine.difficultyScore,
    estTime: routine.estTime,
    primaryMuscles: routine.primaryMuscles ? [...routine.primaryMuscles] : [],
    accentColor: routine.accentColor,
    badge: routine.badge,
    sessions: routine.sessions.map(session => ({
      title: session.title,
      type: session.type,
      exercises: session.exercises.map(exercise => ({
        ...exercise,
        sets: (exercise.sets || []).map(set => ({ ...set }))
      }))
    })),
    isCustom
  };
}

export function cloneProgramDraft(draft: ProgramDraft): ProgramDraft {
  return {
    ...draft,
    primaryMuscles: draft.primaryMuscles ? [...draft.primaryMuscles] : [],
    sessions: draft.sessions.map(session => ({
      ...session,
      exercises: session.exercises.map(exercise => ({
        ...exercise,
        sets: (exercise.sets || []).map(set => ({ ...set }))
      }))
    }))
  };
}

export function draftToPredefinedRoutine(draft: ProgramDraft): PredefinedRoutine {
  return {
    id: draft.id,
    name: draft.name,
    category: draft.category,
    description: draft.description,
    daysRequired: draft.daysRequired,
    difficulty: draft.difficulty,
    difficultyScore: draft.difficultyScore,
    estTime: draft.estTime,
    primaryMuscles: draft.primaryMuscles,
    accentColor: draft.accentColor,
    badge: draft.badge,
    sessions: draft.sessions.map(session => ({
      title: session.title,
      type: session.type,
      exercises: session.exercises
    }))
  };
}

export function createBlankSet(unit: 'kg' | 'lb' = 'kg'): SetRecord {
  return {
    id: createEntityId('set'),
    weight: 0,
    repsTarget: 8,
    repsActual: 0,
    unit,
    isCompleted: false,
    type: 'normal'
  };
}

export function createBlankExercise(unit: 'kg' | 'lb' = 'kg'): SessionExercise {
  return {
    id: createEntityId('ex'),
    name: '',
    targetMuscle: 'Chest',
    restTime: 90,
    notes: '',
    sets: [createBlankSet(unit)]
  };
}

export function cloneSet(set: SetRecord): SetRecord {
  return { ...set, id: createEntityId('set') };
}

export function programStats(draft: ProgramDraft) {
  const sessions = draft.sessions.length;
  let exercises = 0;
  let sets = 0;
  let workingSets = 0;
  for (const session of draft.sessions) {
    exercises += session.exercises.length;
    for (const exercise of session.exercises) {
      const list = exercise.sets || [];
      sets += list.length;
      workingSets += list.filter(item => item.type !== 'warmup').length;
    }
  }
  return { sessions, exercises, sets, workingSets };
}

export function findExerciseIndex(items: SessionExercise[], id: string) {
  return items.findIndex(item => item.id === id);
}

export function replaceExercise(
  exercises: SessionExercise[],
  id: string,
  updater: (exercise: SessionExercise) => SessionExercise
): SessionExercise[] {
  return exercises.map(exercise => (exercise.id === id ? updater(exercise) : exercise));
}

export function replaceSet(
  sets: SetRecord[],
  id: string,
  updater: (set: SetRecord) => SetRecord
): SetRecord[] {
  return sets.map(set => (set.id === id ? updater(set) : set));
}
