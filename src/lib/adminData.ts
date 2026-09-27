import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { 
  WorkoutSession, 
  HistoryRecord, 
  MealRecord, 
  Routine, 
  BodyMetricEntry, 
  AppData 
} from './api';

export type AthleteTier = 'Elite' | 'Pro' | 'Dedicated' | 'Rookie';

export interface AthletePR {
  exerciseName: string;
  weight: number;
  reps: number;
  unit: string;
  date: string;
}

export interface AthleteSummary {
  uid: string;
  email: string;
  name: string;
  pfp?: string;
  tier: AthleteTier;
  createdAt?: string;
  lastActive?: string;
  totalWorkouts: number;
  totalSessions: number;
  totalMeals: number;
  totalCaloriesBurned: number;
  totalTonnage: number; // sum of (weight * reps) in kg/lb
  weightUnit: 'lb' | 'kg';
  latestWeight?: number;
  weightDelta?: number;
  personalRecords: AthletePR[];
  history: HistoryRecord[];
  sessions: WorkoutSession[];
  meals: MealRecord[];
  routines: Routine[];
  bodyMetrics: BodyMetricEntry[];
}

export interface RecentActivityItem {
  id: string;
  athleteUid: string;
  athleteName: string;
  athleteEmail: string;
  athletePfp?: string;
  title: string;
  date: string;
  duration?: number;
  burnedCalories?: number;
  exerciseCount: number;
  tonnage: number;
  type?: string;
}

export interface GlobalPRItem {
  exerciseName: string;
  weight: number;
  unit: string;
  athleteName: string;
  athleteEmail: string;
  date: string;
}

export interface AdminPlatformStats {
  totalAthletes: number;
  activeAthletes30d: number;
  totalWorkoutsCompleted: number;
  totalCaloriesBurned: number;
  totalTonnage: number;
  totalSessionsPlanned: number;
  totalMealsLogged: number;
  avgWorkoutDuration: number;
  categoryBreakdown: {
    strength: number;
    hypertrophy: number;
    cardio: number;
    bodyweight: number;
    other: number;
  };
  macroTotals: {
    protein: number;
    carbs: number;
    fats: number;
  };
  globalPRs: GlobalPRItem[];
  recentActivity: RecentActivityItem[];
}

function calculateTier(workoutsCount: number, tonnage: number): AthleteTier {
  if (workoutsCount >= 20 || tonnage >= 50000) return 'Elite';
  if (workoutsCount >= 10 || tonnage >= 20000) return 'Pro';
  if (workoutsCount >= 3 || tonnage >= 5000) return 'Dedicated';
  return 'Rookie';
}

function extractPRs(history: HistoryRecord[]): AthletePR[] {
  const prMap = new Map<string, AthletePR>();

  for (const h of history) {
    const exercises = h.snapshot?.exercises || [];
    for (const ex of exercises) {
      const cleanName = ex.name.trim();
      for (const set of (ex.sets || [])) {
        if (!set.weight || set.weight <= 0) continue;
        const current = prMap.get(cleanName);
        if (!current || set.weight > current.weight) {
          prMap.set(cleanName, {
            exerciseName: cleanName,
            weight: set.weight,
            reps: set.repsActual || set.repsTarget || 1,
            unit: set.unit || 'kg',
            date: h.date
          });
        }
      }
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.weight - a.weight);
}

/**
 * Loads all real users and calculates rich pro-tier telemetry from Firestore.
 */
export async function loadAdminPlatformData(): Promise<{
  stats: AdminPlatformStats;
  athletes: AthleteSummary[];
}> {
  const athletes: AthleteSummary[] = [];

  if (db && auth?.currentUser) {
    const firestoreDb = db;
    try {
      const usersColRef = collection(firestoreDb, 'users');
      const usersSnap = await getDocs(usersColRef);

      const athletePromises = usersSnap.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const rootData = userDoc.data() || {};
        const profile = rootData.user || {};
        const settings = rootData.settings || {};

        let history: HistoryRecord[] = [];
        let sessions: WorkoutSession[] = [];
        let meals: MealRecord[] = [];
        let routines: Routine[] = [];

        try {
          const [historySnap, sessionsSnap, mealsSnap, routinesSnap] = await Promise.all([
            getDocs(collection(firestoreDb, 'users', uid, 'history')),
            getDocs(collection(firestoreDb, 'users', uid, 'sessions')),
            getDocs(collection(firestoreDb, 'users', uid, 'meals')),
            getDocs(collection(firestoreDb, 'users', uid, 'routines')),
          ]);

          history = historySnap.docs.map(d => d.data() as HistoryRecord);
          sessions = sessionsSnap.docs.map(d => d.data() as WorkoutSession);
          meals = mealsSnap.docs.map(d => d.data() as MealRecord);
          routines = routinesSnap.docs.map(d => d.data() as Routine);
        } catch (subErr) {
          console.warn(`Could not load subcollections for user ${uid}:`, subErr);
        }

        // Fallback to legacy root embedded arrays
        if (history.length === 0 && Array.isArray(rootData.history)) history = rootData.history;
        if (sessions.length === 0 && Array.isArray(rootData.sessions)) sessions = rootData.sessions;
        if (meals.length === 0 && Array.isArray(rootData.meals)) meals = rootData.meals;
        if (routines.length === 0 && Array.isArray(rootData.routines)) routines = rootData.routines;

        const bodyMetrics: BodyMetricEntry[] = Array.isArray(rootData.bodyMetrics) ? rootData.bodyMetrics : [];
        const latestWeight = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1].weight : undefined;
        const initialWeight = bodyMetrics.length > 1 ? bodyMetrics[0].weight : latestWeight;
        const weightDelta = (latestWeight && initialWeight) ? Number((latestWeight - initialWeight).toFixed(1)) : undefined;

        // Calculate total tonnage lifted
        let userTonnage = 0;
        for (const h of history) {
          for (const ex of (h.snapshot?.exercises || [])) {
            for (const set of (ex.sets || [])) {
              if (set.weight && set.weight > 0) {
                userTonnage += (set.weight * (set.repsActual || set.repsTarget || 1));
              }
            }
          }
        }

        // Determine last active timestamp
        let lastActive: string | undefined = undefined;
        if (history.length > 0) {
          const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          lastActive = sorted[0].date;
        } else if (sessions.length > 0) {
          const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          lastActive = sorted[0].date;
        }

        const totalCaloriesBurned = history.reduce((sum, h) => sum + (h.burnedCalories || (h.snapshot?.duration ? h.snapshot.duration * 6.5 : 0)), 0);
        const athleteName = profile.name || profile.displayName || profile.email?.split('@')[0] || `Athlete #${uid.slice(0, 4)}`;
        const personalRecords = extractPRs(history);
        const tier = calculateTier(history.length, userTonnage);

        return {
          uid,
          email: profile.email || 'No email provided',
          name: athleteName,
          pfp: profile.pfp,
          tier,
          createdAt: rootData.createdAt || undefined,
          lastActive,
          totalWorkouts: history.length,
          totalSessions: sessions.length,
          totalMeals: meals.length,
          totalCaloriesBurned,
          totalTonnage: Math.round(userTonnage),
          weightUnit: settings.weightUnit || 'kg',
          latestWeight,
          weightDelta,
          personalRecords,
          history,
          sessions,
          meals,
          routines,
          bodyMetrics
        } as AthleteSummary;
      });

      const loaded = await Promise.all(athletePromises);
      athletes.push(...loaded);
    } catch (err) {
      console.error('Failed to query users from Firestore:', err);
    }
  }

  // Fallback to local storage if running in local environment or empty database
  if (athletes.length === 0) {
    try {
      const localRaw = localStorage.getItem('gym_data');
      if (localRaw) {
        const local = JSON.parse(localRaw) as AppData;
        const history = local.history || [];
        const sessions = local.sessions || [];
        const meals = local.meals || [];
        const routines = local.routines || [];
        const bodyMetrics = local.bodyMetrics || [];
        const latestWeight = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1].weight : undefined;
        const initialWeight = bodyMetrics.length > 1 ? bodyMetrics[0].weight : latestWeight;
        const weightDelta = (latestWeight && initialWeight) ? Number((latestWeight - initialWeight).toFixed(1)) : undefined;

        let userTonnage = 0;
        for (const h of history) {
          for (const ex of (h.snapshot?.exercises || [])) {
            for (const set of (ex.sets || [])) {
              if (set.weight && set.weight > 0) {
                userTonnage += (set.weight * (set.repsActual || set.repsTarget || 1));
              }
            }
          }
        }

        const totalCaloriesBurned = history.reduce((sum, h) => sum + (h.burnedCalories || (h.snapshot?.duration ? h.snapshot.duration * 6.5 : 0)), 0);
        const personalRecords = extractPRs(history);
        const tier = calculateTier(history.length, userTonnage);

        athletes.push({
          uid: 'local-master',
          email: local.user?.email || (import.meta.env.VITE_ADMIN_EMAIL || 'admin@mygym.app'),
          name: local.user?.name || 'Master Athlete',
          pfp: local.user?.pfp,
          tier,
          lastActive: history.length > 0 ? history[history.length - 1].date : new Date().toISOString(),
          totalWorkouts: history.length,
          totalSessions: sessions.length,
          totalMeals: meals.length,
          totalCaloriesBurned,
          totalTonnage: Math.round(userTonnage),
          weightUnit: local.settings?.weightUnit || 'kg',
          latestWeight,
          weightDelta,
          personalRecords,
          history,
          sessions,
          meals,
          routines,
          bodyMetrics
        });
      }
    } catch (e) {
      console.warn('Error reading local cache fallback:', e);
    }
  }

  // Calculate platform aggregate metrics
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalAthletes = athletes.length;
  let activeAthletes30d = 0;
  let totalWorkoutsCompleted = 0;
  let totalCaloriesBurned = 0;
  let totalTonnage = 0;
  let totalSessionsPlanned = 0;
  let totalMealsLogged = 0;
  let totalDurationMinutes = 0;
  let workoutsWithDuration = 0;

  const categoryBreakdown = {
    strength: 0,
    hypertrophy: 0,
    cardio: 0,
    bodyweight: 0,
    other: 0
  };

  const macroTotals = {
    protein: 0,
    carbs: 0,
    fats: 0
  };

  const allActivities: RecentActivityItem[] = [];
  const globalPRMap = new Map<string, GlobalPRItem>();

  for (const athlete of athletes) {
    totalWorkoutsCompleted += athlete.totalWorkouts;
    totalCaloriesBurned += athlete.totalCaloriesBurned;
    totalTonnage += athlete.totalTonnage;
    totalSessionsPlanned += athlete.totalSessions;
    totalMealsLogged += athlete.totalMeals;

    const isActive = athlete.lastActive ? new Date(athlete.lastActive).getTime() >= thirtyDaysAgo : false;
    if (isActive) activeAthletes30d++;

    // Tally meals macros
    for (const m of athlete.meals) {
      macroTotals.protein += (m.protein || 0);
      macroTotals.carbs += (m.carbs || 0);
      macroTotals.fats += (m.fats || 0);
    }

    // Process workouts & PRs
    for (const h of athlete.history) {
      const exerciseCount = h.snapshot?.exercises?.length || 0;
      if (h.snapshot?.duration) {
        totalDurationMinutes += h.snapshot.duration;
        workoutsWithDuration++;
      }

      // Category breakdown
      const type = (h.snapshot?.type || 'strength').toLowerCase();
      if (type.includes('cardio') || type.includes('run')) categoryBreakdown.cardio++;
      else if (type.includes('bodyweight') || type.includes('calisthenic')) categoryBreakdown.bodyweight++;
      else if (type.includes('hypertrophy') || type.includes('pump')) categoryBreakdown.hypertrophy++;
      else if (type.includes('strength') || type.includes('power')) categoryBreakdown.strength++;
      else categoryBreakdown.other++;

      // Calculate workout tonnage
      let workoutTonnage = 0;
      for (const ex of (h.snapshot?.exercises || [])) {
        for (const s of (ex.sets || [])) {
          if (s.weight && s.weight > 0) {
            workoutTonnage += (s.weight * (s.repsActual || s.repsTarget || 1));
          }
        }
      }

      allActivities.push({
        id: `${athlete.uid}-${h.id}`,
        athleteUid: athlete.uid,
        athleteName: athlete.name,
        athleteEmail: athlete.email,
        athletePfp: athlete.pfp,
        title: h.title || 'Completed Workout',
        date: h.date,
        duration: h.snapshot?.duration,
        burnedCalories: h.burnedCalories,
        exerciseCount,
        tonnage: Math.round(workoutTonnage),
        type: h.snapshot?.type || 'Strength'
      });
    }

    // Collect global PRs
    for (const pr of athlete.personalRecords) {
      const current = globalPRMap.get(pr.exerciseName);
      if (!current || pr.weight > current.weight) {
        globalPRMap.set(pr.exerciseName, {
          exerciseName: pr.exerciseName,
          weight: pr.weight,
          unit: pr.unit,
          athleteName: athlete.name,
          athleteEmail: athlete.email,
          date: pr.date
        });
      }
    }
  }

  // Sort activities newest first, limit to 50
  allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentActivity = allActivities.slice(0, 50);

  const globalPRs = Array.from(globalPRMap.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const avgWorkoutDuration = workoutsWithDuration > 0 ? Math.round(totalDurationMinutes / workoutsWithDuration) : 45;

  return {
    stats: {
      totalAthletes,
      activeAthletes30d: Math.max(activeAthletes30d, totalAthletes > 0 ? 1 : 0),
      totalWorkoutsCompleted,
      totalCaloriesBurned,
      totalTonnage,
      totalSessionsPlanned,
      totalMealsLogged,
      avgWorkoutDuration,
      categoryBreakdown,
      macroTotals,
      globalPRs,
      recentActivity
    },
    athletes
  };
}

/**
 * Downloads a professional CSV file of all athletes and their metrics.
 */
export function exportAthletesToCSV(athletes: AthleteSummary[]) {
  const headers = [
    'UID',
    'Name',
    'Email',
    'Tier',
    'Total Workouts',
    'Planned Sessions',
    'Logged Meals',
    'Total Volume Lifted',
    'Total Calories (kcal)',
    'Latest Weight',
    'Weight Delta',
    'Last Active Date'
  ];

  const rows = athletes.map(a => [
    `"${a.uid}"`,
    `"${a.name.replace(/"/g, '""')}"`,
    `"${a.email.replace(/"/g, '""')}"`,
    `"${a.tier}"`,
    a.totalWorkouts,
    a.totalSessions,
    a.totalMeals,
    `${a.totalTonnage} ${a.weightUnit}`,
    Math.round(a.totalCaloriesBurned),
    a.latestWeight ? `${a.latestWeight} ${a.weightUnit}` : 'N/A',
    a.weightDelta !== undefined ? `${a.weightDelta > 0 ? '+' : ''}${a.weightDelta} ${a.weightUnit}` : '0',
    a.lastActive ? new Date(a.lastActive).toISOString() : 'N/A'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `forma_athletes_roster_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
