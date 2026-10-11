import { useMemo } from 'react';
import { isSameDay, format } from 'date-fns';
import { useData } from './useData';
import { resolveDailyTargets } from '../lib/selectors';
import { computeAllPersonalRecords, WorkoutSession, Routine, HistoryRecord, MealRecord, DEFAULT_NUTRITION_GOALS } from '../lib/api';

/**
 * Isolated Atomic Selectors:
 * Decomposes the monolithic DataContext to prevent unnecessary full-tree re-renders
 * when unrelated slices of real-time data update (e.g. water log changes won't re-render workout feeds).
 */

export function useSessions(): WorkoutSession[] {
  const { data } = useData();
  return useMemo(() => data?.sessions || [], [data?.sessions]);
}

export function useTodaySessions(): WorkoutSession[] {
  const sessions = useSessions();
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  return useMemo(() => {
    const today = new Date();
    return sessions.filter(s => isSameDay(new Date(s.date), today));
  }, [sessions, todayKey]);
}

export function useRoutines(): Routine[] {
  const { data } = useData();
  return useMemo(() => data?.routines || [], [data?.routines]);
}

export function useHistoryList(): HistoryRecord[] {
  const { data } = useData();
  return useMemo(() => {
    if (!data?.history) return [];
    return [...data.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data?.history]);
}

export function useMeals(): MealRecord[] {
  const { data } = useData();
  return useMemo(() => data?.meals || [], [data?.meals]);
}

export function useTodayMeals(): MealRecord[] {
  const meals = useMeals();
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  return useMemo(() => {
    const today = new Date();
    return meals
      .filter(m => isSameDay(new Date(m.date), today))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meals, todayKey]);
}

export function useNutritionTargets() {
  const { data } = useData();
  const nutritionGoals = useMemo(() => data?.nutritionGoals || DEFAULT_NUTRITION_GOALS, [data?.nutritionGoals]);
  return useMemo(() => resolveDailyTargets(nutritionGoals), [nutritionGoals]);
}

export function useWaterLog(dateStr?: string): { amount: number; goal: number } {
  const { data } = useData();
  const targetDateKey = useMemo(() => dateStr || format(new Date(), 'yyyy-MM-dd'), [dateStr]);
  const amount = data?.waterLogs?.[targetDateKey] || 0;
  const goal = data?.nutritionGoals?.dailyWaterMl || DEFAULT_NUTRITION_GOALS.dailyWaterMl;
  return useMemo(() => ({ amount, goal }), [amount, goal]);
}

export function usePersonalRecords() {
  const { data } = useData();
  return useMemo(() => {
    return computeAllPersonalRecords(data?.history || [], data?.sessions || []);
  }, [data?.history, data?.sessions]);
}

export function useAthleteSettings() {
  const { data } = useData();
  return useMemo(() => data?.settings, [data?.settings]);
}
