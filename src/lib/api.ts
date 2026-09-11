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
};

export type HistoryRecord = {
  id: string;
  sessionId: string;
  date: string;
  title: string;
  snapshot: WorkoutSession;
};

export type AppData = {
  sessions: WorkoutSession[];
  routines: Routine[];
  exercises: Exercise[];
  history: HistoryRecord[];
  settings: UserSettings;
  user?: {
    email: string;
    name: string;
    pfp?: string;
  };
};

declare global {
  interface Window {
    electronAPI: {
      readData: () => Promise<AppData>;
      writeData: (data: AppData) => Promise<boolean>;
    };
  }
}

import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'lb',
  theme: 'dark'
};

export const api = {
  async getData(): Promise<AppData> {
    // If logged in to Firebase, fetch from Firestore
    if (auth?.currentUser && db) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AppData;
          if (!data.settings) data.settings = DEFAULT_SETTINGS;
          return data;
        } else {
          // Document doesn't exist (new account) -> migrate local storage data to cloud!
          const stored = localStorage.getItem('gym_data');
          let data: AppData = { sessions: [], routines: [], exercises: [], history: [], settings: DEFAULT_SETTINGS };
          if (stored) {
             data = JSON.parse(stored);
             if (!data.settings) data.settings = DEFAULT_SETTINGS;
          }
          await setDoc(docRef, data); // save the local data to cloud immediately
          return data;
        }
      } catch (err) {
        console.error("Error fetching from Firestore", err);
      }
    }
    
    // Fallback to local storage (Guest mode or Firebase not configured)
    const stored = localStorage.getItem('gym_data');
    if (stored) {
      const data = JSON.parse(stored);
      if (!data.settings) data.settings = DEFAULT_SETTINGS;
      return data;
    }
    return { sessions: [], routines: [], exercises: [], history: [], settings: DEFAULT_SETTINGS };
  },

  async saveData(data: AppData): Promise<boolean> {
    // If logged in to Firebase, save to Firestore
    if (auth?.currentUser && db) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(docRef, data);
        return true;
      } catch (err) {
        console.error("Error saving to Firestore", err);
      }
    }
    
    // Fallback to local storage
    localStorage.setItem('gym_data', JSON.stringify(data));
    return true;
  }
};
