import { api, CardioLog, WorkoutSession } from './api';
import { gymAudio } from './audio';

export interface ActiveCardioTimer {
  sessionId: string;
  exerciseId: string;
  exerciseIndex: number;
  exerciseName: string;
  sessionTitle: string;
  totalDurationSeconds: number;
  targetEndTime: number; // Date.now() + remainingSeconds * 1000
  isRunning: boolean;
  pausedRemainingSeconds?: number;
  startedAt: number;
}

export const CARDIO_STORAGE_KEY = 'mygym_active_cardio_timer';
export const CARDIO_TIMER_EVENT = 'mygym_cardio_timer_change';
export const CARDIO_COMPLETED_EVENT = 'mygym_cardio_completed';

export function getActiveCardio(): ActiveCardioTimer | null {
  try {
    const raw = localStorage.getItem(CARDIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed: ActiveCardioTimer = JSON.parse(raw);
    if (!parsed || !parsed.sessionId) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function getCardioRemainingSeconds(timer: ActiveCardioTimer | null): number {
  if (!timer) return 0;
  if (!timer.isRunning) {
    return Math.max(0, timer.pausedRemainingSeconds ?? 0);
  }
  const remainingMs = timer.targetEndTime - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function formatCardioTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function startCardioTimer(params: {
  sessionId: string;
  exerciseId: string;
  exerciseIndex: number;
  exerciseName: string;
  sessionTitle: string;
  durationMinutes: number;
}): ActiveCardioTimer {
  const totalDurationSeconds = Math.max(10, Math.round(params.durationMinutes * 60));
  const timer: ActiveCardioTimer = {
    sessionId: params.sessionId,
    exerciseId: params.exerciseId,
    exerciseIndex: params.exerciseIndex,
    exerciseName: params.exerciseName,
    sessionTitle: params.sessionTitle || 'Workout',
    totalDurationSeconds,
    targetEndTime: Date.now() + totalDurationSeconds * 1000,
    isRunning: true,
    startedAt: Date.now()
  };

  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(timer));
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: timer }));
  gymAudio.triggerVibration([30]);
  return timer;
}

export function pauseCardioTimer(): ActiveCardioTimer | null {
  const current = getActiveCardio();
  if (!current || !current.isRunning) return current;

  const remaining = getCardioRemainingSeconds(current);
  const updated: ActiveCardioTimer = {
    ...current,
    isRunning: false,
    pausedRemainingSeconds: remaining
  };

  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: updated }));
  gymAudio.triggerVibration([20]);
  return updated;
}

export function resumeCardioTimer(): ActiveCardioTimer | null {
  const current = getActiveCardio();
  if (!current || current.isRunning) return current;

  const remaining = current.pausedRemainingSeconds ?? 0;
  const updated: ActiveCardioTimer = {
    ...current,
    isRunning: true,
    targetEndTime: Date.now() + remaining * 1000,
    pausedRemainingSeconds: undefined
  };

  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: updated }));
  gymAudio.triggerVibration([20]);
  return updated;
}

export function addCardioSeconds(seconds: number): ActiveCardioTimer | null {
  const current = getActiveCardio();
  if (!current) return null;

  let updated: ActiveCardioTimer;
  if (current.isRunning) {
    updated = {
      ...current,
      totalDurationSeconds: current.totalDurationSeconds + seconds,
      targetEndTime: current.targetEndTime + seconds * 1000
    };
  } else {
    updated = {
      ...current,
      totalDurationSeconds: current.totalDurationSeconds + seconds,
      pausedRemainingSeconds: (current.pausedRemainingSeconds || 0) + seconds
    };
  }

  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: updated }));
  gymAudio.triggerSubtleHaptic([15]);
  return updated;
}

export function stopCardioTimer(): void {
  localStorage.removeItem(CARDIO_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: null }));
  gymAudio.triggerVibration([15]);
}

/**
 * Automatically marks the cardio exercise as completed in the session, saves to API/localStorage,
 * adds cardio log to Performance Hub, plays celebration sound, and clears active timer.
 */
export async function completeCardioTimer(timer?: ActiveCardioTimer | null): Promise<void> {
  const active = timer || getActiveCardio();
  if (!active) return;

  // Clear timer from localStorage so UI stops immediately
  localStorage.removeItem(CARDIO_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CARDIO_TIMER_EVENT, { detail: null }));

  gymAudio.playCelebrationFanfare();
  gymAudio.triggerVibration([80, 50, 80, 50, 160]);

  try {
    const data = await api.getData();
    const session = data.sessions?.find(s => s.id === active.sessionId);
    const durationMinutes = Math.round(active.totalDurationSeconds / 60) || 15;
    const burnedCalories = Math.round(durationMinutes * 8.5);

    if (session) {
      const updatedExercises = (session.exercises || []).map((ex, idx) => {
        const isTarget = ex.id === active.exerciseId || idx === active.exerciseIndex || ex.name === active.exerciseName;
        if (isTarget) {
          const completedSets = (ex.sets && ex.sets.length > 0)
            ? ex.sets.map(s => ({ ...s, isCompleted: true }))
            : [{
                id: `set-cardio-${Date.now()}`,
                weight: 0,
                repsTarget: 1,
                repsActual: 1,
                unit: 'kg' as const,
                isCompleted: true
              }];

          return {
            ...ex,
            duration: durationMinutes,
            isCompleted: true,
            sets: completedSets,
            notes: ex.notes ? (ex.notes.includes('✓') ? ex.notes : `${ex.notes} [✓ ${durationMinutes} min completed]`) : `[✓ ${durationMinutes} min completed]`
          };
        }
        return ex;
      });

      const updatedSession: WorkoutSession = {
        ...session,
        exercises: updatedExercises
      };

      await api.saveSession(updatedSession);

      // Auto-log to cardio logs in Performance Insights
      const newCardioLog: CardioLog = {
        id: `cardio-finish-${Date.now()}`,
        date: new Date().toISOString(),
        activity: active.exerciseName,
        durationMinutes,
        calories: burnedCalories,
        source: 'manual',
        aiSummary: `${active.sessionTitle} · ${active.exerciseName}`
      };

      const currentInsights = data.insights || { cardioLogs: [], connectedDevices: [] };
      await api.saveInsights({
        ...currentInsights,
        cardioLogs: [newCardioLog, ...(currentInsights.cardioLogs || [])].slice(0, 60)
      });

      // Dispatch global completed event so all views can celebrate
      window.dispatchEvent(new CustomEvent(CARDIO_COMPLETED_EVENT, {
        detail: {
          sessionId: active.sessionId,
          exerciseName: active.exerciseName,
          sessionTitle: active.sessionTitle,
          durationMinutes,
          burnedCalories
        }
      }));
    }
  } catch (err) {
    console.error('Failed to auto-complete cardio exercise:', err);
  }
}
