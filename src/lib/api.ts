export type WorkoutSession = {
  id: string;
  title: string;
  date: string; // ISO string
  duration: number; // minutes
  type: string; // strength, cardio, yoga, etc.
  notes: string;
  isCompleted: boolean;
  exercises: SessionExercise[];
};

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export type SetRecord = {
  id: string;
  weight: number;
  repsTarget: number;
  repsActual: number;
  unit: 'lb' | 'kg';
  isCompleted: boolean;
  type?: SetType; // 'normal' | 'warmup' | 'dropset' | 'failure'
  rpe?: 'easy' | 'target' | 'failure';
};

export type SessionExercise = {
  id: string;
  name: string; // name of exercise
  targetMuscle: string;
  restTime: number; // seconds
  notes: string;
  videoUrl?: string;
  sets: SetRecord[];
  duration?: number; // for cardio in minutes
  distanceKm?: number; // for cardio in km
  caloriesBurned?: number; // for cardio burned calories
  heartRate?: number; // for cardio average heart rate
  pace?: string; // for cardio speed / pace
  imageUrl?: string; // for treadmill captures
  supersetId?: string; // Links exercises into a superset group (e.g. 'ss-1')
  isCompleted?: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  targetMuscle: string;
  defaultRestTime: number;
};

// A single training day inside a saved program. Structurally identical to
// `PredefinedRoutine['sessions'][number]` and `ProgramSessionDraft`, so the same
// object round-trips through the program editor, the library and Firestore.
export type RoutineSession = {
  title: string;
  type: string;
  exercises: SessionExercise[];
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  exercises: SessionExercise[]; // templates for exercises
  // Multi-session programs (push/pull/legs, upper/lower, ...) need every session
  // persisted, not just `exercises` (which mirrors sessions[0] for legacy
  // single-session routines and for settings that rewrite exercise units).
  // Optional so routines written before this field existed still load.
  sessions?: RoutineSession[];
  // Mirrored from ProgramDraft.daysRequired so a reloaded program can still be
  // scheduled on the number of days it was built for. Clamped to 1..7 to stay
  // inside the `isValidRoutine` Firestore rule.
  daysRequired?: number;
};

export type TrainingGoal = 'strength' | 'muscle' | 'fatloss' | 'general';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentAccess = 'full_gym' | 'home_basic' | 'bodyweight';

export const TRAINING_GOALS: readonly TrainingGoal[] = ['strength', 'muscle', 'fatloss', 'general'];
export const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
export const EQUIPMENT_OPTIONS: readonly EquipmentAccess[] = ['full_gym', 'home_basic', 'bodyweight'];
export const DAYS_PER_WEEK_OPTIONS: readonly number[] = [2, 3, 4, 5, 6];

/**
 * What the athlete is actually training for. Collected once during onboarding
 * and read by the routine builder, the AI generator and nutrition targets, so a
 * new athlete never has to start from a blank dashboard.
 */
export type AthleteProfile = {
  goal: TrainingGoal;
  level: ExperienceLevel;
  equipment: EquipmentAccess;
  daysPerWeek: number;
  /** ISO timestamp written the first time the setup tour is completed. */
  onboardedAt?: string;
};

export const DEFAULT_ATHLETE_PROFILE: AthleteProfile = {
  goal: 'general',
  level: 'beginner',
  equipment: 'full_gym',
  daysPerWeek: 3
};

export function normalizeAthleteProfile(raw: unknown): AthleteProfile {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<AthleteProfile>;
  const goal = source.goal as TrainingGoal | undefined;
  const level = source.level as ExperienceLevel | undefined;
  const equipment = source.equipment as EquipmentAccess | undefined;
  const daysPerWeek = Number(source.daysPerWeek);
  return {
    goal: goal && TRAINING_GOALS.includes(goal) ? goal : DEFAULT_ATHLETE_PROFILE.goal,
    level: level && EXPERIENCE_LEVELS.includes(level) ? level : DEFAULT_ATHLETE_PROFILE.level,
    equipment:
      equipment && EQUIPMENT_OPTIONS.includes(equipment) ? equipment : DEFAULT_ATHLETE_PROFILE.equipment,
    daysPerWeek:
      Number.isFinite(daysPerWeek) && daysPerWeek >= 1 && daysPerWeek <= 7
        ? Math.round(daysPerWeek)
        : DEFAULT_ATHLETE_PROFILE.daysPerWeek,
    ...(typeof source.onboardedAt === 'string' && source.onboardedAt
      ? { onboardedAt: source.onboardedAt }
      : {})
  };
}

export type UserSettings = {
  weightUnit: 'lb' | 'kg';
  theme: string;
  density?: 'comfortable' | 'compact';
  motion?: 'full' | 'reduced';
  weekStartsOn?: 'saturday' | 'sunday' | 'monday';
  restTimerSeconds?: number;
  soundAlerts?: boolean;
  vibrationAlerts?: boolean;
  language?: 'en' | 'ar';
  workoutReminderEnabled?: boolean;
  workoutReminderTime?: string; // "HH:mm" e.g. "18:00"
  warmTint?: 'off' | 'on' | 'auto';
  keepScreenAwake?: boolean;
  autoCollapseFinishedExercises?: boolean;
  fontScale?: 'default' | 'large';
  highContrast?: boolean;
  /** Absent until the athlete finishes the setup tour. */
  athlete?: AthleteProfile;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealIngredient = {
  name: string;
  portion?: string;
  calories?: number;
};

export type MealRecord = {
  id: string;
  date: string; // ISO string
  mealType: MealType;
  title: string;
  description?: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients?: MealIngredient[];
  aiNotes?: string;
  healthScore?: number;
};

export type HistoryRecord = {
  id: string;
  sessionId: string;
  date: string;
  title: string;
  snapshot: WorkoutSession;
  burnedCalories?: number;
};

export type BodyMetricEntry = {
  id: string;
  date: string; // ISO string
  weight: number;
  unit: 'lb' | 'kg';
  bodyFat?: number; // percentage
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
};

export type NutritionGoals = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  dailyWaterMl: number;
};

export type CardioLog = {
  id: string;
  date: string;
  activity: string;
  durationMinutes: number;
  distanceKm?: number;
  calories?: number;
  averageHeartRate?: number;
  pace?: string;
  source: 'camera' | 'manual' | 'device';
  aiSummary?: string;
};

export type WeeklyAdaptivePlan = {
  weekOf: string;
  recoveryScore: number;
  adjustment: 'increase' | 'maintain' | 'deload';
  volumeChangePercent: number;
  recommendation: string;
  updatedAt: string;
};

export type ConnectedDevice = {
  id: string;
  name: string;
  provider: 'Apple Health' | 'Google Fit' | 'Wearable';
  status: 'connected' | 'ready';
  lastSyncAt?: string;
};

export type PerformanceInsights = {
  cardioLogs: CardioLog[];
  sleepHours?: number;
  fatigue?: number;
  adaptivePlan?: WeeklyAdaptivePlan;
  connectedDevices: ConnectedDevice[];
};

export const DEFAULT_PERFORMANCE_INSIGHTS: PerformanceInsights = {
  cardioLogs: [],
  connectedDevices: []
};

export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  unit: 'lb' | 'kg';
  reps: number;
  estimated1RM: number;
  date: string;
};

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  dailyCalories: 2200,
  dailyProtein: 150,
  dailyCarbs: 220,
  dailyFats: 65,
  dailyWaterMl: 2500
};

// CRITICAL: Maximum text length for input validation
const MAX_TEXT_LENGTH = 500;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function assertId(value: unknown, entity: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 160) {
    throw new Error(`${entity} must have a valid identifier.`);
  }
}

function assertFiniteNonNegative(value: unknown, field: string, maximum = 1_000_000) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new Error(`${field} must be a valid non-negative number.`);
  }
}

function assertValidSession(session: WorkoutSession) {
  assertId(session?.id, 'Workout session');
  if (!session.title?.trim() || session.title.length > MAX_TEXT_LENGTH) throw new Error('Workout title is required and must be under 500 characters.');
  if (!session.date || Number.isNaN(Date.parse(session.date))) throw new Error('Workout date is invalid.');
  assertFiniteNonNegative(session.duration, 'Workout duration', 1_440);
  if (!Array.isArray(session.exercises)) throw new Error('Workout exercises must be a list.');
}

function assertValidMeal(meal: MealRecord) {
  assertId(meal?.id, 'Meal');
  if (!meal.title?.trim() || meal.title.length > MAX_TEXT_LENGTH) throw new Error('Meal title is required and must be under 500 characters.');
  if (!meal.date || Number.isNaN(Date.parse(meal.date))) throw new Error('Meal date is invalid.');
  (['calories', 'protein', 'carbs', 'fats'] as const).forEach(key => assertFiniteNonNegative(meal[key], `Meal ${key}`));
}

function assertValidGoals(goals: NutritionGoals) {
  (Object.keys(DEFAULT_NUTRITION_GOALS) as Array<keyof NutritionGoals>).forEach(key => assertFiniteNonNegative(goals?.[key], `Nutrition goal: ${key}`, 100_000));
}

// ============================================================================
// BUSINESS LOGIC FUNCTIONS
// ============================================================================

export type AppData = {
  sessions: WorkoutSession[];
  routines: Routine[];
  exercises: Exercise[];
  history: HistoryRecord[];
  meals: MealRecord[];
  settings: UserSettings;
  bodyMetrics?: BodyMetricEntry[];
  nutritionGoals?: NutritionGoals;
  waterLogs?: Record<string, number>; // dateString (YYYY-MM-DD) -> total ml
  insights?: PerformanceInsights;
  user?: {
    email: string;
    name: string;
    pfp?: string;
  };
};

export function calculate1RM(weight: number, reps: number): number {
  if (!weight || weight <= 0) return 0;
  if (!reps || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight);
  // Epley formula: weight * (1 + reps / 30)
  return Math.round(weight * (1 + reps / 30));
}

export function calculateBMR(gender: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityMultiplier: number, goal: 'cut' | 'maintain' | 'bulk'): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  const maintenance = bmr * activityMultiplier;
  let targetCalories = maintenance;
  if (goal === 'cut') targetCalories = maintenance - 500;
  else if (goal === 'bulk') targetCalories = maintenance + 350;

  const calories = Math.max(1200, Math.round(targetCalories));
  const protein = Math.round((calories * 0.30) / 4);
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories * 0.45) / 4);

  return { calories, protein, carbs, fats };
}

export type PreviousPerformanceInfo = {
  exercise: SessionExercise;
  date: string;
  sessionTitle: string;
  daysAgo: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  maxWeight: number;
};

export function findPreviousPerformanceWithDetails(
  exerciseName: string,
  history: HistoryRecord[],
  currentSessions: WorkoutSession[] = [],
  excludeSessionId?: string
): PreviousPerformanceInfo | null {
  const normalizedName = (exerciseName || '').trim().toLowerCase();
  if (!normalizedName) return null;

  const now = new Date();
  type Candidate = { exercise: SessionExercise; date: string; sessionTitle: string };
  const candidates: Candidate[] = [];

  for (const h of history) {
    if (excludeSessionId && h.sessionId === excludeSessionId) continue;
    const match = h.snapshot?.exercises?.find(e => (e.name || '').trim().toLowerCase() === normalizedName);
    if (match && match.sets && match.sets.some(s => s.isCompleted || (s.weight > 0 && (s.repsActual > 0 || s.repsTarget > 0)))) {
      candidates.push({ exercise: match, date: h.date, sessionTitle: h.title });
    }
  }

  for (const s of currentSessions) {
    if (!s.isCompleted || (excludeSessionId && s.id === excludeSessionId)) continue;
    const match = s.exercises?.find(e => (e.name || '').trim().toLowerCase() === normalizedName);
    if (match && match.sets && match.sets.some(s => s.isCompleted || (s.weight > 0 && (s.repsActual > 0 || s.repsTarget > 0)))) {
      candidates.push({ exercise: match, date: s.date, sessionTitle: s.title });
    }
  }

  candidates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (candidates.length === 0) return null;

  const chosen = candidates[0];
  const dateObj = new Date(chosen.date);
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  const daysAgo = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let totalVolumeKg = 0;
  let completedSetsCount = 0;
  let maxWeight = 0;

  chosen.exercise.sets?.forEach(s => {
    const w = s.unit === 'lb' ? s.weight * 0.453592 : s.weight;
    const r = s.repsActual || s.repsTarget || 0;
    if (s.isCompleted || (w > 0 && r > 0)) {
      completedSetsCount++;
      totalVolumeKg += Math.round(w * r);
      if (s.weight > maxWeight) maxWeight = s.weight;
    }
  });

  return {
    exercise: chosen.exercise,
    date: chosen.date,
    sessionTitle: chosen.sessionTitle,
    daysAgo,
    totalVolumeKg,
    completedSetsCount,
    maxWeight
  };
}


export function computeAllPersonalRecords(history: HistoryRecord[], sessions: WorkoutSession[] = []): Record<string, PersonalRecord> {
  const records: Record<string, PersonalRecord> = {};

  const checkExerciseSets = (exercise: SessionExercise, dateStr: string) => {
    const name = (exercise.name || '').trim();
    if (!name) return;
    const lower = name.toLowerCase();

    exercise.sets?.forEach(s => {
      if (!s.isCompleted && !s.weight) return;
      const weight = s.weight || 0;
      const reps = s.repsActual || s.repsTarget || 0;
      if (weight <= 0 || reps <= 0) return;

      const est1RM = calculate1RM(weight, reps);
      const existing = records[lower];

      if (!existing || est1RM > existing.estimated1RM || (est1RM === existing.estimated1RM && weight > existing.maxWeight)) {
        records[lower] = {
          exerciseName: name,
          maxWeight: weight,
          unit: s.unit || 'kg',
          reps,
          estimated1RM: est1RM,
          date: dateStr
        };
      }
    });
  };

  history.forEach(h => {
    h.snapshot?.exercises?.forEach(e => checkExerciseSets(e, h.date));
  });

  sessions.filter(s => s.isCompleted).forEach(s => {
    s.exercises?.forEach(e => checkExerciseSets(e, s.date));
  });

  return records;
}

export function estimateWorkoutCalories(session: WorkoutSession): number {
  if (!session) return 0;
  const duration = session.duration || 30;
  const type = (session.type || '').toLowerCase();

  let baseRate = 7.0; // default strength / mixed kcal/min
  if (type.includes('cardio') || type.includes('run') || type.includes('treadmill') || type.includes('hiit') || type.includes('cycle')) {
    baseRate = 10.5;
  } else if (type.includes('yoga') || type.includes('stretch') || type.includes('pilates')) {
    baseRate = 4.5;
  } else if (type.includes('strength') || type.includes('push') || type.includes('pull') || type.includes('legs') || type.includes('chest')) {
    baseRate = 7.2;
  }

  let totalCalories = duration * baseRate;

  // Add bonus for working sets and volume lifted
  let totalVolumeKg = 0;
  let completedSets = 0;
  if (session.exercises && Array.isArray(session.exercises)) {
    session.exercises.forEach(ex => {
      ex.sets?.forEach(s => {
        if (s.isCompleted) {
          completedSets++;
          const weightKg = s.unit === 'lb' ? (s.weight || 0) * 0.453592 : (s.weight || 0);
          totalVolumeKg += weightKg * (s.repsActual || s.repsTarget || 0);
        }
      });
    });
  }

  if (completedSets > 0) {
    const volumeBonus = Math.min(totalVolumeKg * 0.02, 180);
    const setsBonus = completedSets * 4;
    totalCalories = Math.max(totalCalories, (duration * 5) + setsBonus + volumeBonus);
  }

  // Include explicit cardio calories from manual entry or machine scan
  if (session.exercises && Array.isArray(session.exercises)) {
    session.exercises.forEach(ex => {
      if (ex.targetMuscle === 'Cardio' && ex.caloriesBurned && ex.caloriesBurned > 0) {
        totalCalories += ex.caloriesBurned;
      }
    });
  }

  return Math.round(totalCalories);
}

import { auth, db } from './firebase';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';

const getDefaultLanguage = (): 'en' | 'ar' => {
  if (typeof window !== 'undefined') {
    const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
    if (navLang.startsWith('ar')) return 'ar';
  }
  return 'en';
};

const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'lb',
  theme: 'dark',
  motion: 'full',
  weekStartsOn: 'saturday',
  restTimerSeconds: 90,
  soundAlerts: true,
  vibrationAlerts: true,
  language: getDefaultLanguage(),
  workoutReminderEnabled: true,
  workoutReminderTime: '18:00',
  warmTint: 'auto',
  keepScreenAwake: true,
  autoCollapseFinishedExercises: true
  ,fontScale: 'default',
  highContrast: false
};

/**
 * Fills in missing settings keys and repairs a malformed `athlete` profile so
 * every read path (Firestore, local mirror, JSON import) yields the same shape.
 */
export function normalizeSettings(raw: unknown): UserSettings {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<UserSettings>;
  const merged: UserSettings = { ...DEFAULT_SETTINGS, ...source };
  if ('athlete' in source) {
    merged.athlete = normalizeAthleteProfile(source.athlete);
  } else {
    delete merged.athlete;
  }
  return merged;
}


async function migrateLegacyDataIfNeeded(uid: string) {
  if (!db) return;
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (!data._migratedToSubcollections) {
      const batch = writeBatch(db);
      
      const settings = normalizeSettings(data.settings);
      const user = data.user || null;
      
      // Update root document
      batch.set(docRef, { settings, user, _migratedToSubcollections: true }, { merge: true });
      
      const firestoreDb = db;
      // Migrate sessions
      if (Array.isArray(data.sessions)) {
        data.sessions.forEach((s: WorkoutSession) => {
          batch.set(doc(firestoreDb, 'users', uid, 'sessions', s.id), s);
        });
      }
      
      // Migrate routines
      if (Array.isArray(data.routines)) {
        data.routines.forEach((r: Routine) => {
          batch.set(doc(firestoreDb, 'users', uid, 'routines', r.id), r);
        });
      }
      
      // Migrate history
      if (Array.isArray(data.history)) {
        data.history.forEach((h: HistoryRecord) => {
          batch.set(doc(firestoreDb, 'users', uid, 'history', h.id), h);
        });
      }
      
      await batch.commit();
    }
  }
}

function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

function mirrorLocalData(updater: (data: AppData) => void) {
  try {
    const raw = localStorage.getItem('gym_data');
    let data: AppData;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = {
          sessions: [],
          routines: [],
          exercises: [],
          history: [],
          meals: [],
          settings: DEFAULT_SETTINGS,
          bodyMetrics: [],
          nutritionGoals: DEFAULT_NUTRITION_GOALS,
          waterLogs: {},
          insights: { ...DEFAULT_PERFORMANCE_INSIGHTS }
        };
      }
    } else {
      data = {
        sessions: [],
        routines: [],
        exercises: [],
        history: [],
        meals: [],
        settings: DEFAULT_SETTINGS,
        bodyMetrics: [],
        nutritionGoals: DEFAULT_NUTRITION_GOALS,
        waterLogs: {},
        insights: { ...DEFAULT_PERFORMANCE_INSIGHTS }
      };
    }
    updater(data);
    localStorage.setItem('gym_data', JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to update local mirror cache:", e);
  }
}

// Data Access Repository
export const api = {
  async getData(): Promise<AppData> {
    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      try {
        await migrateLegacyDataIfNeeded(uid);

        const [rootSnap, sessionsSnap, routinesSnap, historySnap, mealsSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDocs(collection(db, 'users', uid, 'sessions')),
          getDocs(collection(db, 'users', uid, 'routines')),
          getDocs(collection(db, 'users', uid, 'history')),
          getDocs(collection(db, 'users', uid, 'meals'))
        ]);

        const rootData = rootSnap.exists() ? rootSnap.data() : {};
        const settings = normalizeSettings(rootData.settings);
        const user = rootData.user;
        let bodyMetrics = Array.isArray(rootData.bodyMetrics) ? rootData.bodyMetrics : [];
        const nutritionGoals = rootData.nutritionGoals || DEFAULT_NUTRITION_GOALS;
        const waterLogs = rootData.waterLogs || {};
        const insights = { ...DEFAULT_PERFORMANCE_INSIGHTS, ...(rootData.insights || {}) };
        
        let sessions = sessionsSnap.docs.map(d => d.data() as WorkoutSession);
        let routines = routinesSnap.docs.map(d => d.data() as Routine);
        let history = historySnap.docs.map(d => d.data() as HistoryRecord);
        let meals = mealsSnap.docs.map(d => d.data() as MealRecord);

        // Fallback to legacy rootData if subcollections are empty
        if (sessions.length === 0 && Array.isArray(rootData.sessions) && rootData.sessions.length > 0) {
          sessions = rootData.sessions;
        }
        if (routines.length === 0 && Array.isArray(rootData.routines) && rootData.routines.length > 0) {
          routines = rootData.routines;
        }
        if (history.length === 0 && Array.isArray(rootData.history) && rootData.history.length > 0) {
          history = rootData.history;
        }
        if (meals.length === 0 && Array.isArray(rootData.meals) && rootData.meals.length > 0) {
          meals = rootData.meals;
        }

        // CRITICAL: Merge with local cached data so that locally logged or saved items
        // are NEVER wiped out when refreshing before remote sync or if remote returned empty!
        const localRaw = localStorage.getItem('gym_data');
        if (localRaw) {
          try {
            const local = JSON.parse(localRaw) as AppData;
            if (Array.isArray(local.sessions) && local.sessions.length > 0) {
              const remoteSessionIds = new Set(sessions.map(s => s.id));
              const missingSessions = local.sessions.filter(s => !remoteSessionIds.has(s.id));
              if (missingSessions.length > 0) {
                sessions = [...sessions, ...missingSessions];
              }
            }
            if (Array.isArray(local.history) && local.history.length > 0) {
              const remoteHistoryIds = new Set(history.map(h => h.id));
              const missingHistory = local.history.filter(h => !remoteHistoryIds.has(h.id));
              if (missingHistory.length > 0) {
                history = [...history, ...missingHistory];
              }
            }
            if (Array.isArray(local.routines) && local.routines.length > 0) {
              const remoteRoutineIds = new Set(routines.map(r => r.id));
              const missingRoutines = local.routines.filter(r => !remoteRoutineIds.has(r.id));
              if (missingRoutines.length > 0) {
                routines = [...routines, ...missingRoutines];
              }
            }
            if (Array.isArray(local.meals) && local.meals.length > 0) {
              const remoteMealIds = new Set(meals.map(m => m.id));
              const missingMeals = local.meals.filter(m => !remoteMealIds.has(m.id));
              if (missingMeals.length > 0) {
                meals = [...meals, ...missingMeals];
              }
            }
            if (bodyMetrics.length === 0 && Array.isArray(local.bodyMetrics) && local.bodyMetrics.length > 0) {
              bodyMetrics = local.bodyMetrics;
            }
            if (local.waterLogs && Object.keys(local.waterLogs).length > 0) {
              Object.assign(waterLogs, local.waterLogs);
            }
          } catch (e) {
            console.warn("Could not merge local cached data:", e);
          }
        }

        const result: AppData = { sessions, routines, history, meals, exercises: [], settings, user, bodyMetrics, nutritionGoals, waterLogs, insights };
        
        // Cache snapshot locally for offline use
        try {
          localStorage.setItem('gym_data', JSON.stringify(result));
        } catch (e) {}

        return result;
      } catch (err) {
        console.warn("Offline or failed fetching from Firestore, falling back to local mirror:", err);
      }
    }
    
    // Fallback to local storage (Offline or Guest mode)
    const stored = localStorage.getItem('gym_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (!data.settings) data.settings = DEFAULT_SETTINGS;
        else data.settings = normalizeSettings(data.settings);
        if (!data.meals) data.meals = [];
        if (!data.bodyMetrics) data.bodyMetrics = [];
        if (!data.nutritionGoals) data.nutritionGoals = DEFAULT_NUTRITION_GOALS;
        if (!data.waterLogs) data.waterLogs = {};
        if (!data.insights) data.insights = { ...DEFAULT_PERFORMANCE_INSIGHTS };
        return data;
      } catch (e) {}
    }
    return { sessions: [], routines: [], exercises: [], history: [], meals: [], settings: DEFAULT_SETTINGS, bodyMetrics: [], nutritionGoals: DEFAULT_NUTRITION_GOALS, waterLogs: {}, insights: { ...DEFAULT_PERFORMANCE_INSIGHTS } };
  },

  async updateRootSettings(settings: UserSettings, user?: AppData['user']) {
    mirrorLocalData(local => {
      local.settings = settings;
      if (user !== undefined) {
        if (user === null) {
          delete local.user;
        } else {
          local.user = user;
        }
      }
    });

    if (auth?.currentUser && db) {
      try {
        const payload: Record<string, any> = {
          settings: sanitizeForFirestore(settings)
        };
        if (user !== undefined && user !== null) {
          payload.user = sanitizeForFirestore(user);
        }
        await setDoc(doc(db, 'users', auth.currentUser.uid), payload, { merge: true });
      } catch (err) {
        console.warn("Could not sync root settings to Firestore (retained in local cache):", err);
      }
    }
  },

  async saveSession(session: WorkoutSession) {
    assertValidSession(session);
    mirrorLocalData(local => {
      if (!local.sessions) local.sessions = [];
      const idx = local.sessions.findIndex(s => s.id === session.id);
      if (idx >= 0) local.sessions[idx] = session;
      else local.sessions.push(session);
    });

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'sessions', session.id), sanitizeForFirestore(session));
      } catch (err) {
        console.warn("Could not sync session to Firestore (retained in local cache):", err);
      }
    }
  },

  async saveSessions(sessions: WorkoutSession[]) {
    if (!Array.isArray(sessions)) throw new Error('Workout sessions must be a list.');
    sessions.forEach(assertValidSession);
    mirrorLocalData(local => {
      if (!local.sessions) local.sessions = [];
      for (const session of sessions) {
        const idx = local.sessions.findIndex(s => s.id === session.id);
        if (idx >= 0) local.sessions[idx] = session;
        else local.sessions.push(session);
      }
    });

    if (auth?.currentUser && db) {
      try {
        const chunkSize = 450;
        for (let i = 0; i < sessions.length; i += chunkSize) {
          const chunk = sessions.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          for (const session of chunk) {
            batch.set(
              doc(db, 'users', auth.currentUser.uid, 'sessions', session.id),
              sanitizeForFirestore(session)
            );
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn("Could not sync sessions to Firestore (retained in local cache):", err);
      }
    }
  },

  async deleteSession(id: string) {
    assertId(id, 'Workout session');
    mirrorLocalData(local => {
      if (local.sessions) local.sessions = local.sessions.filter(s => s.id !== id);
    });

    if (auth?.currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'sessions', id));
      } catch (err) {
        console.warn("Could not delete session from Firestore (removed from local cache):", err);
      }
    }
  },

  async deleteSessions(ids: string[]) {
    if (!ids || ids.length === 0) return;
    if (!Array.isArray(ids)) throw new Error('Workout session identifiers must be a list.');
    ids.forEach(id => assertId(id, 'Workout session'));
    const idSet = new Set(ids);
    mirrorLocalData(local => {
      if (local.sessions) local.sessions = local.sessions.filter(s => !idSet.has(s.id));
    });

    if (auth?.currentUser && db) {
      try {
        const chunkSize = 450;
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          for (const id of chunk) {
            batch.delete(doc(db, 'users', auth.currentUser.uid, 'sessions', id));
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn("Could not delete sessions from Firestore:", err);
      }
    }
  },

  async saveRoutine(routine: Routine) {
    assertId(routine?.id, 'Routine');
    if (!routine.name?.trim() || routine.name.length > MAX_TEXT_LENGTH || !Array.isArray(routine.exercises)) throw new Error('Routine requires a valid name and exercise list.');
    if (routine.sessions !== undefined && !Array.isArray(routine.sessions)) throw new Error('Routine sessions must be a list.');
    if (routine.daysRequired !== undefined) assertFiniteNonNegative(routine.daysRequired, 'Routine days required', 7);
    mirrorLocalData(local => {
      if (!local.routines) local.routines = [];
      const idx = local.routines.findIndex(r => r.id === routine.id);
      if (idx >= 0) local.routines[idx] = routine;
      else local.routines.push(routine);
    });

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'routines', routine.id), sanitizeForFirestore(routine));
      } catch (err) {
        console.warn("Could not sync routine to Firestore (retained in local cache):", err);
      }
    }
  },

  async deleteRoutine(id: string) {
    mirrorLocalData(local => {
      if (local.routines) local.routines = local.routines.filter(r => r.id !== id);
    });

    if (auth?.currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'routines', id));
      } catch (err) {
        console.warn("Could not delete routine from Firestore:", err);
      }
    }
  },
  
  async saveHistory(record: HistoryRecord) {
    assertId(record?.id, 'History record');
    assertId(record?.sessionId, 'History session');
    if (!record.snapshot || !record.date || Number.isNaN(Date.parse(record.date))) throw new Error('History record is incomplete.');
    mirrorLocalData(local => {
      if (!local.history) local.history = [];
      const idx = local.history.findIndex(h => h.id === record.id);
      if (idx >= 0) local.history[idx] = record;
      else local.history.push(record);
    });

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'history', record.id), sanitizeForFirestore(record));
      } catch (err) {
        console.warn("Could not sync history to Firestore (retained in local cache):", err);
      }
    }
  },
  
  async deleteHistory(id: string) {
    mirrorLocalData(local => {
      if (local.history) local.history = local.history.filter(h => h.id !== id);
    });

    if (auth?.currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'history', id));
      } catch (err) {
        console.warn("Could not delete history from Firestore:", err);
      }
    }
  },

  async saveMeal(meal: MealRecord) {
    assertValidMeal(meal);
    mirrorLocalData(local => {
      if (!local.meals) local.meals = [];
      const idx = local.meals.findIndex(m => m.id === meal.id);
      if (idx >= 0) local.meals[idx] = meal;
      else local.meals.push(meal);
    });

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'meals', meal.id), sanitizeForFirestore(meal));
      } catch (err) {
        console.warn("Could not sync meal to Firestore (retained in local cache):", err);
      }
    }
  },

  async deleteMeal(id: string) {
    mirrorLocalData(local => {
      if (local.meals) local.meals = local.meals.filter(m => m.id !== id);
    });

    if (auth?.currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meals', id));
      } catch (err) {
        console.warn("Could not delete meal from Firestore:", err);
      }
    }
  },

  async saveBodyMetric(entry: BodyMetricEntry) {
    assertId(entry?.id, 'Body metric');
    assertFiniteNonNegative(entry.weight, 'Body weight', 1_000);
    if (!entry.date || Number.isNaN(Date.parse(entry.date))) throw new Error('Body metric date is invalid.');
    
    mirrorLocalData(local => {
      if (!local.bodyMetrics) local.bodyMetrics = [];
      const idx = local.bodyMetrics.findIndex(m => m.id === entry.id);
      if (idx >= 0) local.bodyMetrics[idx] = entry;
      else local.bodyMetrics.unshift(entry);
    });

    let currentMetrics: BodyMetricEntry[] = [];
    try {
      const stored = localStorage.getItem('gym_data');
      if (stored) {
        const local = JSON.parse(stored);
        if (!local.bodyMetrics) local.bodyMetrics = [];
        const idx = local.bodyMetrics.findIndex((m: BodyMetricEntry) => m.id === entry.id);
        if (idx >= 0) local.bodyMetrics[idx] = entry;
        else local.bodyMetrics.unshift(entry);
        localStorage.setItem('gym_data', JSON.stringify(local));
        currentMetrics = local.bodyMetrics;
      }
    } catch (e) {
      console.warn("Failed to persist body metric to localStorage:", e);
    }

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          bodyMetrics: sanitizeForFirestore(currentMetrics)
        }, { merge: true });
      } catch (err) {
        console.warn("Could not sync body metric to Firestore (retained in local cache):", err);
      }
    }
  },

  async deleteBodyMetric(id: string) {
    mirrorLocalData(local => {
      if (!local.bodyMetrics) local.bodyMetrics = [];
      local.bodyMetrics = local.bodyMetrics.filter(m => m.id !== id);
    });

    let currentMetrics: BodyMetricEntry[] = [];
    try {
      const stored = localStorage.getItem('gym_data');
      if (stored) {
        const local = JSON.parse(stored);
        if (local.bodyMetrics) {
          local.bodyMetrics = local.bodyMetrics.filter((m: BodyMetricEntry) => m.id !== id);
          localStorage.setItem('gym_data', JSON.stringify(local));
          currentMetrics = local.bodyMetrics;
        }
      }
    } catch (e) {}

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          bodyMetrics: sanitizeForFirestore(currentMetrics)
        }, { merge: true });
      } catch (err) {
        console.warn("Could not sync body metric deletion to Firestore (retained in local cache):", err);
      }
    }
  },

  async updateNutritionGoals(goals: NutritionGoals) {
    assertValidGoals(goals);
    mirrorLocalData(local => {
      local.nutritionGoals = goals;
    });

    try {
      const stored = localStorage.getItem('gym_data');
      if (stored) {
        const local = JSON.parse(stored);
        local.nutritionGoals = goals;
        localStorage.setItem('gym_data', JSON.stringify(local));
      }
    } catch (e) {}

    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          nutritionGoals: sanitizeForFirestore(goals)
        }, { merge: true });
      } catch (err) {
        console.warn("Could not sync nutrition goals to Firestore (retained in local cache):", err);
      }
    }
  },

  async logWater(dateKey: string, totalMl: number) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Water log date must use YYYY-MM-DD.');
    assertFiniteNonNegative(totalMl, 'Water total', 20_000);

    // 1. Immediately persist to localStorage synchronously
    mirrorLocalData(local => {
      if (!local.waterLogs) local.waterLogs = {};
      local.waterLogs[dateKey] = Math.max(0, totalMl);
    });

    let updatedLogs: Record<string, number> = { [dateKey]: Math.max(0, totalMl) };
    try {
      const stored = localStorage.getItem('gym_data');
      if (stored) {
        const local = JSON.parse(stored);
        if (!local.waterLogs) local.waterLogs = {};
        local.waterLogs[dateKey] = Math.max(0, totalMl);
        localStorage.setItem('gym_data', JSON.stringify(local));
        updatedLogs = local.waterLogs;
      }
    } catch (e) {
      console.warn("Direct localStorage write failed:", e);
    }

    // 2. Safely sync to Firestore without blocking or crashing local updates
    if (auth?.currentUser && db) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          waterLogs: sanitizeForFirestore(updatedLogs)
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn("Could not sync waterLogs to Firestore (retained safely in local storage):", firestoreErr);
      }
    }
  },

  async saveInsights(insights: PerformanceInsights) {
    const cleanInsights = sanitizeForFirestore({ ...DEFAULT_PERFORMANCE_INSIGHTS, ...insights });
    if (auth?.currentUser && db) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { insights: cleanInsights }, { merge: true });
    }
    const local = await this.getData();
    local.insights = cleanInsights;
    localStorage.setItem('gym_data', JSON.stringify(local));
  },

  async importAllData(imported: AppData): Promise<AppData> {
    if (!imported || typeof imported !== 'object') {
      throw new Error('Invalid backup file format');
    }

    const validSessions = Array.isArray(imported.sessions) ? imported.sessions.filter(item => {
      try { assertValidSession(item); return true; } catch { return false; }
    }) : [];
    const validRoutines = Array.isArray(imported.routines) ? imported.routines : [];
    const validExercises = Array.isArray(imported.exercises) ? imported.exercises : [];
    const validHistory = Array.isArray(imported.history) ? imported.history : [];
    const validMeals = Array.isArray(imported.meals) ? imported.meals.filter(item => {
      try { assertValidMeal(item); return true; } catch { return false; }
    }) : [];
    const validMetrics = Array.isArray(imported.bodyMetrics) ? imported.bodyMetrics : [];
    const validGoals = imported.nutritionGoals ? { ...DEFAULT_NUTRITION_GOALS, ...imported.nutritionGoals } : DEFAULT_NUTRITION_GOALS;
    assertValidGoals(validGoals);
    const validWater = imported.waterLogs && typeof imported.waterLogs === 'object' ? imported.waterLogs : {};
    const validSettings = normalizeSettings(imported.settings);

    const fullData: AppData = {
      user: imported.user || { name: 'Athlete', email: 'guest@forma.app' },
      settings: validSettings,
      sessions: validSessions,
      routines: validRoutines,
      exercises: validExercises,
      history: validHistory,
      meals: validMeals,
      bodyMetrics: validMetrics,
      nutritionGoals: validGoals,
      waterLogs: validWater,
      insights: { ...DEFAULT_PERFORMANCE_INSIGHTS, ...(imported.insights || {}) }
    };

    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, 'users', uid), {
        settings: sanitizeForFirestore(validSettings),
        user: sanitizeForFirestore(fullData.user),
        bodyMetrics: sanitizeForFirestore(validMetrics),
        nutritionGoals: sanitizeForFirestore(validGoals),
        waterLogs: sanitizeForFirestore(validWater),
        insights: sanitizeForFirestore(fullData.insights)
      }, { merge: true });
      
      const itemsToBatch: { ref: any; data: any }[] = [];
      for (const s of validSessions) {
        itemsToBatch.push({ ref: doc(db, 'users', uid, 'sessions', s.id), data: sanitizeForFirestore(s) });
      }
      for (const r of validRoutines) {
        itemsToBatch.push({ ref: doc(db, 'users', uid, 'routines', r.id), data: sanitizeForFirestore(r) });
      }
      for (const h of validHistory) {
        itemsToBatch.push({ ref: doc(db, 'users', uid, 'history', h.id), data: sanitizeForFirestore(h) });
      }
      for (const m of validMeals) {
        itemsToBatch.push({ ref: doc(db, 'users', uid, 'meals', m.id), data: sanitizeForFirestore(m) });
      }

      const chunkSize = 450;
      for (let i = 0; i < itemsToBatch.length; i += chunkSize) {
        const chunk = itemsToBatch.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const item of chunk) {
          batch.set(item.ref, item.data);
        }
        await batch.commit();
      }
    }

    localStorage.setItem('gym_data', JSON.stringify(fullData));
    return fullData;
  }
};

