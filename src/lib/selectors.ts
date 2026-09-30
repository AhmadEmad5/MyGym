import { addDays, format, isSameDay } from 'date-fns';
import type {
  AppData,
  HistoryRecord,
  WorkoutSession,
} from './api';
import { findPreviousPerformanceWithDetails } from './api';
import type {
  DailySummary,
  PerformanceDataset,
  PreviousSetReference,
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

export function deriveSessionStatus(
  session: WorkoutSession,
  data: AppData,
  activeSessionId?: string,
): SessionStatus {
  if (activeSessionId === session.id) return 'in-progress';
  if (session.isCompleted || getHistoryForSession(data, session.id)) return 'completed';
  return 'planned';
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

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * The fallback applied when a stored target is missing or zero.
 *
 * These are NOT the same numbers as the default block inside
 * `selectDailySummary` (2200/150/220/65), and `NutritionView` carries a third
 * set (2200/160/250/70). Three sets of nutrition defaults in one app is a
 * real inconsistency, but reconciling them changes what an athlete sees on
 * screen, so this preserves the values the Today screen has always rendered
 * and names the problem rather than silently picking a winner.
 */
const TODAY_TARGET_FALLBACKS: DailyTargets = {
  calories: 2154,
  protein: 162,
  carbs: 242,
  fats: 60,
};

/**
 * Resolves the four macro targets a dashboard card needs.
 *
 * The Today screen passed these to both the bento grid and the nutrition card,
 * duplicating the same four `|| <number>` expressions at each call site. The
 * `||` is load-bearing for the zero case: a goal explicitly stored as `0`
 * should fall back rather than render "0 kcal" as a target.
 */
export function resolveDailyTargets(
  goals: Partial<DailyTargets & { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFats: number }> | null | undefined
): DailyTargets {
  const source = goals || {};
  return {
    calories: source.dailyCalories || TODAY_TARGET_FALLBACKS.calories,
    protein: source.dailyProtein || TODAY_TARGET_FALLBACKS.protein,
    carbs: source.dailyCarbs || TODAY_TARGET_FALLBACKS.carbs,
    fats: source.dailyFats || TODAY_TARGET_FALLBACKS.fats,
  };
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

