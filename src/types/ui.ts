import type {
  AppData,
  HistoryRecord,
  MealRecord,
  NutritionGoals,
  SetRecord,
  UserSettings,
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
export type PerformanceView = 'records' | 'volume' | 'body-metrics' | 'cardio';

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

export interface SessionStationModel {
  session: WorkoutSession;
  status: SessionStatus;
  exerciseCount: number;
  targetMuscles: string[];
}

export interface PreviousSetReference {
  weight: number;
  reps: number;
  unit: 'kg' | 'lb';
  date?: string;
}

export interface SetDraft {
  sessionId: string;
  exerciseId: string;
  setId: string;
  value: SetRecord;
  previous?: PreviousSetReference;
  saveState: SaveState;
}

export interface PerformanceDataset {
  label: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
  isEmpty: boolean;
}

export interface FormaViewModel {
  data: AppData;
  settings: UserSettings;
  daily: DailySummary;
}
