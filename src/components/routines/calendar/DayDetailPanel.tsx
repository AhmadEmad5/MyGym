import type { HistoryRecord, MealRecord, WorkoutSession } from '../../../lib/api';
import type { RestDaySource } from '../../../lib/restDay';
import type { DayNutritionSummary } from './DayNutritionSection';
import { UnifiedDayBentoHub } from './UnifiedDayBentoHub';

export type DayTab = 'all' | 'planned' | 'workouts' | 'nutrition';

export type DayDetailPanelProps = {
  day: Date;
  today: Date;
  tab: DayTab;
  sessions: WorkoutSession[];
  history: HistoryRecord[];
  meals: MealRecord[];
  nutrition: DayNutritionSummary;
  targets: { calories: number; protein: number; carbs: number; fats: number; water: number };
  isRTL: boolean;
  isClearing: boolean;
  restDaySettings?: RestDaySource;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onTabChange: (tab: DayTab) => void;
  onOpenSession: (id: string) => void;
  onEditSession: (session: WorkoutSession) => void;
  onComplete: (session: WorkoutSession) => void;
  onDelete: (id: string) => void;
  onAddSession: (day: Date) => void;
  onOpenAI: () => void;
  onGeneratePPL: () => void;
  onMoveToSaturday: () => void;
  onClearDay: () => void;
  onRepeatWorkout: (snapshot: WorkoutSession) => void;
  onLogMeal: () => void;
};

export function DayDetailPanel(props: DayDetailPanelProps) {
  return <UnifiedDayBentoHub {...props} />;
}
