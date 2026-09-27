import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import type {
  AppData,
  HistoryRecord,
  SessionExercise,
  WorkoutSession,
} from './api';
import { findPreviousPerformanceWithDetails } from './api';
import type {
  DailySummary,
  PerformanceDataset,
  PreviousSetReference,
  SessionStationModel,
  SessionStatus,
} from '../types/ui';

function dateKey(value: Date | string | number) {
  return format(new Date(value), 'yyyy-MM-dd');
}

function getHistoryForSession(data: AppData, sessionId: string) {
  return (data.history || []).find((record) => record.sessionId === sessionId);
}

export function selectDailySummary(data: AppData, date: Date): DailySummary {
  const key = dateKey(date);
  return {
    dateKey: key,
    sessions: data.sessions.filter((session) => isSameDay(new Date(session.date), date)),
    history: (data.history || []).filter((record) => isSameDay(new Date(record.date), date)),
    meals: (data.meals || []).filter((meal) => isSameDay(new Date(meal.date), date)),
    waterMl: data.waterLogs?.[key] || 0,
    waterTargetMl: data.nutritionGoals?.dailyWaterMl || 2500,
    nutritionGoals: data.nutritionGoals || {
      dailyCalories: 2200,
      dailyProtein: 150,
      dailyCarbs: 220,
      dailyFats: 65,
      dailyWaterMl: 2500,
    },
  };
}

export function selectTodaySession(data: AppData): WorkoutSession | null {
  const today = new Date();
  return data.sessions.find(
    (session) => isSameDay(new Date(session.date), today) && !session.isCompleted,
  ) || null;
}

export function deriveSessionStatus(
  session: WorkoutSession,
  data: AppData,
  activeSessionId?: string,
): SessionStatus {
  if (activeSessionId === session.id) return 'in-progress';
  if (session.isCompleted || getHistoryForSession(data, session.id)) return 'completed';
  return 'planned';
}

export function deriveSessionStations(data: AppData, weekStart: Date): SessionStationModel[] {
  const start = startOfWeek(weekStart, {
    weekStartsOn: data.settings?.weekStartsOn === 'monday' ? 1 : data.settings?.weekStartsOn === 'sunday' ? 0 : 6,
  });
  const stations: SessionStationModel[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(start, offset);
    const sessions = data.sessions.filter((session) => isSameDay(new Date(session.date), day));
    sessions.forEach((session) => {
      stations.push({
        session,
        status: deriveSessionStatus(session, data),
        exerciseCount: session.exercises?.length || 0,
        targetMuscles: [...new Set((session.exercises || []).map((exercise) => exercise.targetMuscle).filter(Boolean))],
      });
    });
  }

  return stations;
}

export function selectPreviousPerformance(
  exerciseName: string,
  data: AppData,
  excludeSessionId?: string,
): PreviousSetReference | null {
  const details = findPreviousPerformanceWithDetails(
    exerciseName,
    data.history || [],
    data.sessions || [],
    excludeSessionId,
  );
  if (!details) return null;

  const completedSets = details.exercise.sets.filter(
    (set) => set.isCompleted || set.weight > 0 || set.repsActual > 0,
  );
  const previous = completedSets[completedSets.length - 1];
  if (!previous) return null;

  return {
    weight: previous.weight,
    reps: previous.repsActual || previous.repsTarget,
    unit: previous.unit,
    date: details.date,
  };
}

export function selectNutritionSummary(data: AppData, date: Date) {
  const daily = selectDailySummary(data, date);
  return daily.meals.reduce(
    (summary, meal) => ({
      calories: summary.calories + (meal.calories || 0),
      protein: summary.protein + (meal.protein || 0),
      carbs: summary.carbs + (meal.carbs || 0),
      fats: summary.fats + (meal.fats || 0),
      waterMl: daily.waterMl,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, waterMl: daily.waterMl },
  );
}

function convertWeight(value: number, sourceUnit: 'kg' | 'lb' | undefined, targetUnit: 'kg' | 'lb') {
  if (!sourceUnit || sourceUnit === targetUnit) return value;
  return targetUnit === 'kg' ? value * 0.453592 : value * 2.20462;
}

function sessionVolume(session: WorkoutSession, targetUnit: 'kg' | 'lb') {
  return (session.exercises || []).reduce(
    (total, exercise) => total + (exercise.sets || []).reduce((exerciseTotal, set) => {
      if (!set.isCompleted && !(set.repsActual > 0)) return exerciseTotal;
      return exerciseTotal + convertWeight(set.weight || 0, set.unit, targetUnit) * (set.repsActual || 0);
    }, 0),
    0,
  );
}

function historySnapshot(record: HistoryRecord) {
  return record.snapshot || null;
}

export function selectPerformanceDatasets(data: AppData, range = 'all'): PerformanceDataset[] {
  const targetUnit = data.settings?.weightUnit || 'kg';
  const records = (data.history || [])
    .map((record) => ({ date: record.date, value: sessionVolume(historySnapshot(record) as WorkoutSession, targetUnit) }))
    .filter((point) => point.value > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bodyMetrics = (data.bodyMetrics || [])
    .filter((metric) => metric.weight > 0)
    .map((metric) => ({ date: metric.date, value: convertWeight(metric.weight, metric.unit, targetUnit) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filterByRange = <T extends { date: string }>(items: T[]) => {
    if (range === 'all') return items;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      const timestamp = new Date(item.date).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
  };

  const rangedRecords = filterByRange(records);
  const rangedBodyMetrics = filterByRange(bodyMetrics);

  return [
    { label: 'Training volume', unit: targetUnit, points: rangedRecords, isEmpty: rangedRecords.length === 0 },
    { label: 'Body weight', unit: targetUnit, points: rangedBodyMetrics, isEmpty: rangedBodyMetrics.length === 0 },
  ];
}

export function findExerciseById(session: WorkoutSession, exerciseId: string): SessionExercise | null {
  return session.exercises?.find((exercise) => exercise.id === exerciseId) || null;
}

export function selectWorkoutStreak(data: AppData): number {
  if (!data?.history || data.history.length === 0) return 0;
  
  const uniqueDates = Array.from(
    new Set(
      data.history
        .map((h) => {
          try {
            return format(new Date(h.date), 'yyyy-MM-dd');
          } catch {
            return '';
          }
        })
        .filter(Boolean)
    )
  ).sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');

  // If the latest workout was not today or yesterday, streak has lapsed
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

