import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SessionExercise, SetRecord } from '../../lib/api';
import {
  cloneProgramDraft,
  cloneSet,
  createBlankExercise,
  createBlankSet,
  programStats
} from './types';
import { moveItemById, moveItemToEdge, moveItemToIndex } from './sortable';
import type { ProgramDraft, ProgramSessionDraft } from './types';

const serialize = (draft: ProgramDraft) => JSON.stringify(draft);

export function useProgramDraft(source: ProgramDraft | null, weightUnit: 'kg' | 'lb') {
  const [draft, setDraft] = useState<ProgramDraft | null>(source);
  const baselineRef = useRef<string>(source ? serialize(source) : '');

  useEffect(() => {
    if (!source) {
      setDraft(null);
      baselineRef.current = '';
      return;
    }
    const next = cloneProgramDraft(source);
    setDraft(next);
    baselineRef.current = serialize(next);
  }, [source]);

  const isDirty = useMemo(
    () => (draft ? serialize(draft) !== baselineRef.current : false),
    [draft]
  );

  const reset = useCallback(() => {
    if (!source) return;
    const next = cloneProgramDraft(source);
    setDraft(next);
    baselineRef.current = serialize(next);
  }, [source]);

  const patchSession = useCallback(
    (sessionIndex: number, updater: (session: ProgramSessionDraft) => ProgramSessionDraft) => {
      setDraft(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sessions: prev.sessions.map((session, index) => (index === sessionIndex ? updater(session) : session))
        };
      });
    },
    []
  );

  const patchMeta = useCallback((patch: Partial<ProgramDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const patchExercise = useCallback(
    (sessionIndex: number, exerciseId: string, updater: (exercise: SessionExercise) => SessionExercise) => {
      patchSession(sessionIndex, session => ({
        ...session,
        exercises: session.exercises.map(exercise =>
          exercise.id === exerciseId ? updater(exercise) : exercise
        )
      }));
    },
    [patchSession]
  );

  const patchSet = useCallback(
    (sessionIndex: number, exerciseId: string, setId: string, updater: (set: SetRecord) => SetRecord) => {
      patchExercise(sessionIndex, exerciseId, exercise => ({
        ...exercise,
        sets: (exercise.sets || []).map(set => (set.id === setId ? updater(set) : set))
      }));
    },
    [patchExercise]
  );

  const addExercise = useCallback(
    (sessionIndex: number) => {
      patchSession(sessionIndex, session => ({
        ...session,
        exercises: [...session.exercises, createBlankExercise(weightUnit)]
      }));
    },
    [patchSession, weightUnit]
  );

  const duplicateExercise = useCallback(
    (sessionIndex: number, exerciseId: string) => {
      patchSession(sessionIndex, session => {
        const index = session.exercises.findIndex(exercise => exercise.id === exerciseId);
        if (index < 0) return session;
        const source = session.exercises[index];
        const copy: SessionExercise = {
          ...source,
          id: `${source.id}-copy-${Date.now().toString(36)}`,
          sets: (source.sets || []).map(set => cloneSet(set))
        };
        const exercises = [...session.exercises];
        exercises.splice(index + 1, 0, copy);
        return { ...session, exercises };
      });
    },
    [patchSession]
  );

  const removeExercise = useCallback(
    (sessionIndex: number, exerciseId: string) => {
      patchSession(sessionIndex, session => ({
        ...session,
        exercises: session.exercises.filter(exercise => exercise.id !== exerciseId)
      }));
    },
    [patchSession]
  );

  const moveExercise = useCallback(
    (sessionIndex: number, fromId: string, toId: string) => {
      patchSession(sessionIndex, session => {
        const from = session.exercises.findIndex(exercise => exercise.id === fromId);
        const to = session.exercises.findIndex(exercise => exercise.id === toId);
        if (from < 0 || to < 0 || from === to) return session;
        return { ...session, exercises: moveItemToIndex(session.exercises, from, to) };
      });
    },
    [patchSession]
  );

  const moveExerciseBy = useCallback(
    (sessionIndex: number, exerciseId: string, delta: number) => {
      patchSession(sessionIndex, session => ({
        ...session,
        exercises: moveItemById(session.exercises, exerciseId, delta)
      }));
    },
    [patchSession]
  );

  const moveExerciseToEdge = useCallback(
    (sessionIndex: number, exerciseId: string, edge: 'start' | 'end') => {
      patchSession(sessionIndex, session => ({
        ...session,
        exercises: moveItemToEdge(session.exercises, exerciseId, edge)
      }));
    },
    [patchSession]
  );

  const addSet = useCallback(
    (sessionIndex: number, exerciseId: string) => {
      patchExercise(sessionIndex, exerciseId, exercise => {
        const list = exercise.sets || [];
        const last = list[list.length - 1];
        const next: SetRecord = last
          ? { ...cloneSet(last), repsActual: 0, isCompleted: false }
          : createBlankSet(weightUnit);
        return { ...exercise, sets: [...list, next] };
      });
    },
    [patchExercise, weightUnit]
  );

  const duplicateSet = useCallback(
    (sessionIndex: number, exerciseId: string, setId: string) => {
      patchExercise(sessionIndex, exerciseId, exercise => {
        const list = exercise.sets || [];
        const index = list.findIndex(set => set.id === setId);
        if (index < 0) return exercise;
        const sets = [...list];
        sets.splice(index + 1, 0, cloneSet(list[index]));
        return { ...exercise, sets };
      });
    },
    [patchExercise]
  );

  const removeSet = useCallback(
    (sessionIndex: number, exerciseId: string, setId: string) => {
      patchExercise(sessionIndex, exerciseId, exercise => ({
        ...exercise,
        sets: (exercise.sets || []).filter(set => set.id !== setId)
      }));
    },
    [patchExercise]
  );

  const moveSet = useCallback(
    (sessionIndex: number, exerciseId: string, fromId: string, toId: string) => {
      patchExercise(sessionIndex, exerciseId, exercise => {
        const list = exercise.sets || [];
        const from = list.findIndex(set => set.id === fromId);
        const to = list.findIndex(set => set.id === toId);
        if (from < 0 || to < 0 || from === to) return exercise;
        return { ...exercise, sets: moveItemToIndex(list, from, to) };
      });
    },
    [patchExercise]
  );

  const moveSetBy = useCallback(
    (sessionIndex: number, exerciseId: string, setId: string, delta: number) => {
      patchExercise(sessionIndex, exerciseId, exercise => ({
        ...exercise,
        sets: moveItemById(exercise.sets || [], setId, delta)
      }));
    },
    [patchExercise]
  );

  const moveSetToEdge = useCallback(
    (sessionIndex: number, exerciseId: string, setId: string, edge: 'start' | 'end') => {
      patchExercise(sessionIndex, exerciseId, exercise => ({
        ...exercise,
        sets: moveItemToEdge(exercise.sets || [], setId, edge)
      }));
    },
    [patchExercise]
  );

  const stats = useMemo(() => (draft ? programStats(draft) : null), [draft]);

  const markSaved = useCallback(() => {
    if (draft) baselineRef.current = serialize(draft);
  }, [draft]);

  return {
    draft,
    setDraft,
    isDirty,
    stats,
    reset,
    markSaved,
    patchMeta,
    patchSession,
    patchExercise,
    patchSet,
    addExercise,
    duplicateExercise,
    removeExercise,
    moveExercise,
    moveExerciseBy,
    moveExerciseToEdge,
    addSet,
    duplicateSet,
    removeSet,
    moveSet,
  moveSetBy,
  moveSetToEdge
  };
}
