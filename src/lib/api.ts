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

export type SetRecord = {
  id: string;
  weight: number;
  repsTarget: number;
  repsActual: number;
  unit: 'lb' | 'kg';
  isCompleted: boolean;
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
  imageUrl?: string; // for treadmill captures
};

export type Exercise = {
  id: string;
  name: string;
  targetMuscle: string;
  defaultRestTime: number;
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  exercises: SessionExercise[]; // templates for exercises
};

export type UserSettings = {
  weightUnit: 'lb' | 'kg';
  theme: string;
  density?: 'comfortable' | 'compact';
  motion?: 'full' | 'reduced';
  weekStartsOn?: 'sunday' | 'monday';
  restTimerSeconds?: number;
  soundAlerts?: boolean;
  vibrationAlerts?: boolean;
  language?: 'en' | 'ar';
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

export type AppData = {
  sessions: WorkoutSession[];
  routines: Routine[];
  exercises: Exercise[];
  history: HistoryRecord[];
  meals: MealRecord[];
  settings: UserSettings;
  user?: {
    email: string;
    name: string;
    pfp?: string;
  };
};

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

  return Math.round(totalCalories);
}

import { auth, db } from './firebase';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';

const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'lb',
  theme: 'dark',
  motion: 'full',
  weekStartsOn: 'sunday',
  restTimerSeconds: 90,
  soundAlerts: true,
  vibrationAlerts: true,
  language: 'en'
};

async function migrateLegacyDataIfNeeded(uid: string) {
  if (!db) return;
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (!data._migratedToSubcollections) {
      console.log('Migrating legacy monolithic data to sub-collections...');
      const batch = writeBatch(db);
      
      const settings = data.settings || DEFAULT_SETTINGS;
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
      console.log('Migration complete.');
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
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
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
        const settings = rootData.settings || DEFAULT_SETTINGS;
        const user = rootData.user;
        
        const sessions = sessionsSnap.docs.map(d => d.data() as WorkoutSession);
        const routines = routinesSnap.docs.map(d => d.data() as Routine);
        const history = historySnap.docs.map(d => d.data() as HistoryRecord);
        const meals = mealsSnap.docs.map(d => d.data() as MealRecord);

        return { sessions, routines, history, meals, exercises: [], settings, user };
      } catch (err) {
        console.error("Error fetching from Firestore", err);
      }
    }
    
    // Fallback to local storage (Guest mode)
    const stored = localStorage.getItem('gym_data');
    if (stored) {
      const data = JSON.parse(stored);
      if (!data.settings) data.settings = DEFAULT_SETTINGS;
      if (!data.meals) data.meals = [];
      return data;
    }
    return { sessions: [], routines: [], exercises: [], history: [], meals: [], settings: DEFAULT_SETTINGS };
  },

  async updateRootSettings(settings: UserSettings, user?: AppData['user']) {
    if (auth?.currentUser && db) {
      const payload: Record<string, any> = {
        settings: sanitizeForFirestore(settings)
      };
      if (user !== undefined && user !== null) {
        payload.user = sanitizeForFirestore(user);
      }
      await setDoc(doc(db, 'users', auth.currentUser.uid), payload, { merge: true });
    } else {
      const local = await this.getData();
      local.settings = settings;
      if (user !== undefined && user !== null) {
        local.user = user;
      } else {
        delete local.user;
      }
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async saveSession(session: WorkoutSession) {
    if (auth?.currentUser && db) {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'sessions', session.id), sanitizeForFirestore(session));
    } else {
      const local = await this.getData();
      const idx = local.sessions.findIndex(s => s.id === session.id);
      if (idx >= 0) local.sessions[idx] = session;
      else local.sessions.push(session);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async saveSessions(sessions: WorkoutSession[]) {
    if (auth?.currentUser && db) {
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
    } else {
      const local = await this.getData();
      for (const session of sessions) {
        const idx = local.sessions.findIndex(s => s.id === session.id);
        if (idx >= 0) local.sessions[idx] = session;
        else local.sessions.push(session);
      }
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async deleteSession(id: string) {
    if (auth?.currentUser && db) {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'sessions', id));
    } else {
      const local = await this.getData();
      local.sessions = local.sessions.filter(s => s.id !== id);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async deleteSessions(ids: string[]) {
    if (!ids || ids.length === 0) return;
    if (auth?.currentUser && db) {
      const chunkSize = 450;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.delete(doc(db, 'users', auth.currentUser.uid, 'sessions', id));
        }
        await batch.commit();
      }
    } else {
      const local = await this.getData();
      const idSet = new Set(ids);
      local.sessions = local.sessions.filter(s => !idSet.has(s.id));
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async saveRoutine(routine: Routine) {
    if (auth?.currentUser && db) {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'routines', routine.id), sanitizeForFirestore(routine));
    } else {
      const local = await this.getData();
      const idx = local.routines.findIndex(r => r.id === routine.id);
      if (idx >= 0) local.routines[idx] = routine;
      else local.routines.push(routine);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async deleteRoutine(id: string) {
    if (auth?.currentUser && db) {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'routines', id));
    } else {
      const local = await this.getData();
      local.routines = local.routines.filter(r => r.id !== id);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },
  
  async saveHistory(record: HistoryRecord) {
    if (auth?.currentUser && db) {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'history', record.id), sanitizeForFirestore(record));
    } else {
      const local = await this.getData();
      if (!local.history) local.history = [];
      const idx = local.history.findIndex(h => h.id === record.id);
      if (idx >= 0) local.history[idx] = record;
      else local.history.push(record);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },
  
  async deleteHistory(id: string) {
    if (auth?.currentUser && db) {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'history', id));
    } else {
      const local = await this.getData();
      local.history = local.history.filter(h => h.id !== id);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async saveMeal(meal: MealRecord) {
    if (auth?.currentUser && db) {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'meals', meal.id), sanitizeForFirestore(meal));
    } else {
      const local = await this.getData();
      if (!local.meals) local.meals = [];
      const idx = local.meals.findIndex(m => m.id === meal.id);
      if (idx >= 0) local.meals[idx] = meal;
      else local.meals.push(meal);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async deleteMeal(id: string) {
    if (auth?.currentUser && db) {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meals', id));
    } else {
      const local = await this.getData();
      if (!local.meals) local.meals = [];
      local.meals = local.meals.filter(m => m.id !== id);
      localStorage.setItem('gym_data', JSON.stringify(local));
    }
  },

  async importAllData(imported: AppData): Promise<AppData> {
    if (!imported || typeof imported !== 'object') {
      throw new Error('Invalid backup file format');
    }

    const validSessions = Array.isArray(imported.sessions) ? imported.sessions : [];
    const validRoutines = Array.isArray(imported.routines) ? imported.routines : [];
    const validExercises = Array.isArray(imported.exercises) ? imported.exercises : [];
    const validHistory = Array.isArray(imported.history) ? imported.history : [];
    const validMeals = Array.isArray(imported.meals) ? imported.meals : [];
    const validSettings = imported.settings ? { ...DEFAULT_SETTINGS, ...imported.settings } : DEFAULT_SETTINGS;

    const fullData: AppData = {
      user: imported.user || { name: 'Athlete', email: 'guest@mygym.app' },
      settings: validSettings,
      sessions: validSessions,
      routines: validRoutines,
      exercises: validExercises,
      history: validHistory,
      meals: validMeals
    };

    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      await this.updateRootSettings(validSettings, fullData.user);
      
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
