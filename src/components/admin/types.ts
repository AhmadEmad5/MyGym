export type AdminCategory = 'overview' | 'athletes' | 'workouts' | 'nutrition' | 'records' | 'governance';

export type AthleteFilter = 'all' | 'active' | 'elite' | 'rookie';

export type AthleteSort = 'name' | 'workouts' | 'tonnage' | 'calories' | 'recent';

export type LoadStatus = 'loading' | 'refreshing' | 'ready' | 'error';

export type PanelProps = {
  isRTL: boolean;
  locale: 'ar' | 'en';
};
