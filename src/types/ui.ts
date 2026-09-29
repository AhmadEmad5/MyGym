import type {
  HistoryRecord,
  MealRecord,
  NutritionGoals,
  WorkoutSession,
} from '../lib/api';

export type RouteId =
  | 'today'
  | 'plan'
  | 'routines'
  | 'nutrition'
  | 'performance'
  | 'settings'
  | 'session';

export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'rest';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface NorthlineItem {
  id: string;
  label: string;
  status: 'current' | 'complete' | 'future' | 'attention';
  meta?: string;
}

export interface DailySummary {
  dateKey: string;
  sessions: WorkoutSession[];
  history: HistoryRecord[];
  meals: MealRecord[];
  waterMl: number;
  waterTargetMl: number;
  nutritionGoals: NutritionGoals;
}

export interface PreviousSetReference {
  weight: number;
  reps: number;
  unit: 'kg' | 'lb';
  date?: string;
}

export interface PerformanceDataset {
  label: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
  isEmpty: boolean;
}
