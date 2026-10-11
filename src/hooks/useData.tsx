import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { format } from 'date-fns';
import { api, AppData, WorkoutSession, Routine, HistoryRecord, UserSettings, MealRecord, BodyMetricEntry, NutritionGoals, PerformanceInsights, WeightUnit, convertSessionUnits, convertRoutineUnits, estimateWorkoutCalories, readLocalMirror, hasLocalMirror, clearLocalMirror } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { notify } from '../lib/feedback';
import { broadcastSyncEvent, subscribeSyncChannel } from '../lib/syncChannel';

type DataContextType = {
  data: AppData | null;
  loading: boolean;
  theme: string;
  setTheme: (theme: string) => Promise<void>;
  forceRefresh: () => Promise<void>;
  
  // New granular methods
  saveSession: (session: WorkoutSession) => Promise<void>;
  saveSessions: (sessions: WorkoutSession[]) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteSessions: (ids: string[]) => Promise<void>;
  finishWorkoutSession: (session: WorkoutSession) => Promise<HistoryRecord>;
  saveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  saveHistory: (record: HistoryRecord) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  saveMeal: (meal: MealRecord) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  saveBodyMetric: (entry: BodyMetricEntry) => Promise<void>;
  deleteBodyMetric: (id: string) => Promise<void>;
  updateNutritionGoals: (goals: NutritionGoals) => Promise<void>;
  logWater: (amountDelta: number, dateStr?: string) => Promise<void>;
  resetWater: (dateStr?: string) => Promise<void>;
  saveInsights: (insights: PerformanceInsights) => Promise<void>;
  updateSettings: (settings: UserSettings, user?: AppData['user']) => Promise<void>;
  /**
   * Rewrites every stored weight in the account into `target` together with the
   * settings document, as a single all-or-nothing operation.
   */
  convertWeightUnits: (settings: UserSettings, target: WeightUnit) => Promise<void>;
  /**
   * Ends the session: signs out of Firebase Auth, drops this athlete's
   * device-local mirror, and clears the in-memory athlete so the app returns to
   * the login screen. Only the mirror owned by the account being signed out is
   * removed - another account that used this device keeps its own copy.
   * Device-level preferences (theme, language) live outside the mirror and
   * deliberately survive.
   */
  signOutUser: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (backupJson: string) => Promise<boolean>;
  
  // Legacy method for easy porting (optional, better to remove eventually)
  updateData: (newData: AppData) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const applyThemeToDom = (themeName: string) => {
  const supported = ['dark', 'light', 'midnight', 'neon', 'ocean', 'forest', 'sunset', 'paper'];
  const resolved = supported.includes(themeName) ? themeName : 'dark';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  }
  try {
    localStorage.setItem('forma_theme', resolved);
    localStorage.setItem('kinetic_theme', resolved);
    localStorage.setItem('mygym_theme', resolved);
  } catch (e) {}
  return resolved;
};

const applyWarmTintToDom = (warmSetting?: 'off' | 'on' | 'auto') => {
  if (typeof document === 'undefined') return;
  const hours = new Date().getHours();
  const isNightTime = hours >= 19 || hours < 6;
  const shouldApply = warmSetting === 'on' || (warmSetting === 'auto' && isNightTime);
  if (shouldApply) {
    document.documentElement.classList.add('warm-night-filter');
  } else {
    document.documentElement.classList.remove('warm-night-filter');
  }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return readLocalMirror();
    } catch (e) {
      console.warn('Failed to read the cached training mirror:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !hasLocalMirror();
    } catch {
      return true;
    }
  });
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('forma_theme') || localStorage.getItem('kinetic_theme') || localStorage.getItem('mygym_theme');
      if (stored) return stored;
    }
    return 'dark';
  });

  // Identifies the newest in-flight load so a slow, older response cannot
  // overwrite fresher state.
  const loadRequestRef = useRef(0);
  const realtimeUnsubRef = useRef<() => void>(() => {});
  // Always the latest committed data. Reading it inside a state updater (instead
  // of closing over `data`) is what keeps derived values correct when several
  // mutations land before React re-renders.
  const dataRef = useRef<AppData | null>(data);
  dataRef.current = data;

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    applyWarmTintToDom(data?.settings?.warmTint);
    const interval = setInterval(() => {
      applyWarmTintToDom(data?.settings?.warmTint);
    }, 60000);
    return () => clearInterval(interval);
  }, [data?.settings?.warmTint]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', data?.settings?.fontScale || 'default');
    document.documentElement.toggleAttribute('data-high-contrast', Boolean(data?.settings?.highContrast));
    // `data-motion` was read by useFormaReducedMotion but never written by
    // anything, so the app's own Motion preference was inert - the only thing
    // that could stop an animation was the OS setting. `auto` means "follow
    // the OS"; `full` / `reduced` are deliberate user choices.
    document.documentElement.setAttribute('data-motion', data?.settings?.motion || 'auto');
  }, [data?.settings?.fontScale, data?.settings?.highContrast, data?.settings?.motion]);

  const fetchInitialData = useCallback(async () => {
    // Guards against two loads overlapping (auth listener + manual refresh): the
    // slower one must not overwrite the state the newer one already published.
    const requestId = ++loadRequestRef.current;
    try {
      if (!hasLocalMirror()) {
        setLoading(true);
      }
    } catch (e) {
      setLoading(true);
    }

    let result: AppData;
    try {
      result = await api.getData();
    } catch (err) {
      // Never leave the app spinning on a failed read.
      console.warn('Could not load training data:', err);
      if (requestId === loadRequestRef.current) setLoading(false);
      return;
    }
    if (requestId !== loadRequestRef.current) return;

    const localTheme = localStorage.getItem('forma_theme') || localStorage.getItem('kinetic_theme') || localStorage.getItem('mygym_theme');
    if (localTheme && result.settings) {
      result.settings.theme = localTheme;
    } else if (result.settings?.theme) {
      setThemeState(result.settings.theme);
      applyThemeToDom(result.settings.theme);
    }
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const requestId = ++loadRequestRef.current;
          try {
            if (!hasLocalMirror()) {
              setLoading(true);
            }
          } catch (e) {
            setLoading(true);
          }
          let result: AppData;
          try {
            result = await api.getData();
          } catch (err) {
            console.warn('Could not load training data for the signed-in athlete:', err);
            if (requestId === loadRequestRef.current) setLoading(false);
            return;
          }
          if (requestId !== loadRequestRef.current) return;

          if (!result.user || result.user.email !== firebaseUser.email) {
            const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            const userObj = { email: firebaseUser.email || '', name: name.charAt(0).toUpperCase() + name.slice(1) };
            result.user = userObj;
            try {
              await api.updateRootSettings(result.settings, userObj);
            } catch (err) {
              // The athlete profile is a convenience: a failed write must not
              // block the whole sign-in.
              console.warn('Could not sync the athlete profile to Firestore:', err);
            }
          }
          const localTheme = localStorage.getItem('forma_theme') || localStorage.getItem('kinetic_theme') || localStorage.getItem('mygym_theme');
          if (localTheme && result.settings) {
            result.settings.theme = localTheme;
          } else if (result.settings?.theme) {
            setThemeState(result.settings.theme);
            applyThemeToDom(result.settings.theme);
          }
          setData(result);
          setLoading(false);

          // Push-based reactive listeners for instant cross-device synchronization (<150ms)
          realtimeUnsubRef.current();
          realtimeUnsubRef.current = api.subscribeUserData(
            firebaseUser.uid,
            (delta) => {
              setData(prev => {
                if (!prev) return prev;
                return { ...prev, ...delta };
              });
            },
            (err) => console.warn('Realtime sync listener notice:', err)
          );
        } else {
          // Logged out or Guest mode
          realtimeUnsubRef.current();
          realtimeUnsubRef.current = () => {};
          fetchInitialData();
        }
      });
    } else {
      fetchInitialData();
    }

    return () => {
      unsubscribe();
      realtimeUnsubRef.current();
    };
  }, [fetchInitialData]);

  // Instant Cross-Tab & Multi-Surface Synchronization (<5ms, zero network calls)
  useEffect(() => {
    const unsubscribeChannel = subscribeSyncChannel((event) => {
      const currentUid = auth?.currentUser?.uid || 'guest';
      if (event.uid && event.uid !== currentUid) return;

      setData(prev => {
        if (!prev) return prev;
        switch (event.type) {
          case 'SESSION_SAVED': {
            const { session } = event.payload;
            const newSessions = [...prev.sessions];
            const idx = newSessions.findIndex(s => s.id === session.id);
            if (idx >= 0) newSessions[idx] = session;
            else newSessions.push(session);
            return { ...prev, sessions: newSessions };
          }
          case 'SESSIONS_SAVED': {
            const { sessions } = event.payload;
            const newSessions = [...prev.sessions];
            for (const s of sessions) {
              const idx = newSessions.findIndex(item => item.id === s.id);
              if (idx >= 0) newSessions[idx] = s;
              else newSessions.push(s);
            }
            return { ...prev, sessions: newSessions };
          }
          case 'SESSION_DELETED': {
            return { ...prev, sessions: prev.sessions.filter(s => s.id !== event.payload.id) };
          }
          case 'SESSIONS_DELETED': {
            const idSet = new Set(event.payload.ids);
            return { ...prev, sessions: prev.sessions.filter(s => !idSet.has(s.id)) };
          }
          case 'WORKOUT_FINISHED': {
            const { session, record } = event.payload;
            return {
              ...prev,
              sessions: prev.sessions.filter(s => s.id !== session.id),
              history: [record, ...(prev.history || []).filter(h => h.sessionId !== session.id)]
            };
          }
          case 'ROUTINE_SAVED': {
            const { routine } = event.payload;
            const newRoutines = [...prev.routines];
            const idx = newRoutines.findIndex(r => r.id === routine.id);
            if (idx >= 0) newRoutines[idx] = routine;
            else newRoutines.push(routine);
            return { ...prev, routines: newRoutines };
          }
          case 'ROUTINE_DELETED': {
            return { ...prev, routines: prev.routines.filter(r => r.id !== event.payload.id) };
          }
          case 'MEAL_SAVED': {
            const { meal } = event.payload;
            const currentMeals = prev.meals || [];
            const newMeals = [...currentMeals];
            const idx = newMeals.findIndex(m => m.id === meal.id);
            if (idx >= 0) newMeals[idx] = meal;
            else newMeals.unshift(meal);
            return { ...prev, meals: newMeals };
          }
          case 'MEAL_DELETED': {
            return { ...prev, meals: (prev.meals || []).filter(m => m.id !== event.payload.id) };
          }
          case 'WATER_LOGGED': {
            const { dateStr, amountDelta } = event.payload;
            const current = prev.waterLogs?.[dateStr] || 0;
            return {
              ...prev,
              waterLogs: { ...prev.waterLogs, [dateStr]: Math.max(0, current + amountDelta) }
            };
          }
          case 'WATER_RESET': {
            const { dateStr } = event.payload;
            return {
              ...prev,
              waterLogs: { ...prev.waterLogs, [dateStr]: 0 }
            };
          }
          case 'GOALS_UPDATED': {
            return { ...prev, nutritionGoals: event.payload.goals };
          }
          case 'METRIC_SAVED': {
            const { entry } = event.payload;
            const list = prev.bodyMetrics || [];
            const idx = list.findIndex(m => m.id === entry.id);
            const next = [...list];
            if (idx >= 0) next[idx] = entry;
            else next.unshift(entry);
            return { ...prev, bodyMetrics: next };
          }
          case 'METRIC_DELETED': {
            return { ...prev, bodyMetrics: (prev.bodyMetrics || []).filter(m => m.id !== event.payload.id) };
          }
          case 'SETTINGS_UPDATED': {
            return { ...prev, settings: event.payload.settings };
          }
          default:
            return prev;
        }
      });
    });

    return () => unsubscribeChannel();
  }, []);

  // Granular update functions (optimistic UI + rollback on error)
  // Granular update functions (optimistic UI updates with state rollback on error)
  const saveSession = useCallback(async (session: WorkoutSession) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const newSessions = [...prev.sessions];
      const idx = newSessions.findIndex(s => s.id === session.id);
      if (idx >= 0) newSessions[idx] = session;
      else newSessions.push(session);
      return { ...prev, sessions: newSessions };
    });

    broadcastSyncEvent('SESSION_SAVED', { session }, auth?.currentUser?.uid);

    try {
      await api.saveSession(session);
    } catch (err) {
      console.error("Failed to save session, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save workout session. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const saveSessions = useCallback(async (sessions: WorkoutSession[]) => {
    if (sessions.length === 0) return;
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const newSessions = [...prev.sessions];
      for (const session of sessions) {
        const idx = newSessions.findIndex(s => s.id === session.id);
        if (idx >= 0) newSessions[idx] = session;
        else newSessions.push(session);
      }
      return { ...prev, sessions: newSessions };
    });

    broadcastSyncEvent('SESSIONS_SAVED', { sessions }, auth?.currentUser?.uid);

    try {
      await api.saveSessions(sessions);
    } catch (err) {
      console.error("Failed to save sessions, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save sessions. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, sessions: prev.sessions.filter(s => s.id !== id) };
    });

    broadcastSyncEvent('SESSION_DELETED', { id }, auth?.currentUser?.uid);

    try {
      await api.deleteSession(id);
    } catch (err) {
      console.error("Failed to delete session, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete session. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const deleteSessions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, sessions: prev.sessions.filter(s => !idSet.has(s.id)) };
    });

    broadcastSyncEvent('SESSIONS_DELETED', { ids }, auth?.currentUser?.uid);

    try {
      await api.deleteSessions(ids);
    } catch (err) {
      console.error("Failed to delete sessions, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete sessions. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  // Dedicated atomic workout finish logic: removes session from schedule and adds to history in ONE atomic render
  const finishWorkoutSession = useCallback(async (session: WorkoutSession): Promise<HistoryRecord> => {
    const completedSession: WorkoutSession = { ...session, isCompleted: true };
    const burnedCalories = estimateWorkoutCalories(completedSession);
    const historyRecord: HistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: session.id,
      date: new Date().toISOString(),
      title: session.title,
      snapshot: completedSession,
      burnedCalories
    };

    let snapshot: AppData | null = null;
    // Atomic UI state transition
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const filteredSessions = prev.sessions.filter(s => s.id !== session.id);
      const prevHistory = prev.history || [];
      const updatedHistory = [historyRecord, ...prevHistory.filter(h => h.sessionId !== session.id)];
      return {
        ...prev,
        sessions: filteredSessions,
        history: updatedHistory
      };
    });

    broadcastSyncEvent('WORKOUT_FINISHED', { session: completedSession, record: historyRecord }, auth?.currentUser?.uid);

    try {
      await Promise.all([
        api.saveHistory(historyRecord),
        api.deleteSession(session.id)
      ]);
    } catch (err) {
      console.error("Failed to persist finished workout to backend, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save finished workout to history. Changes reverted.', 'error');
      throw err;
    }

    return historyRecord;
  }, []);

  const saveRoutine = useCallback(async (routine: Routine) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const newRoutines = [...prev.routines];
      const idx = newRoutines.findIndex(r => r.id === routine.id);
      if (idx >= 0) newRoutines[idx] = routine;
      else newRoutines.push(routine);
      return { ...prev, routines: newRoutines };
    });

    broadcastSyncEvent('ROUTINE_SAVED', { routine }, auth?.currentUser?.uid);

    try {
      await api.saveRoutine(routine);
    } catch (err) {
      console.error("Failed to save routine, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save routine template. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, routines: prev.routines.filter(r => r.id !== id) };
    });

    broadcastSyncEvent('ROUTINE_DELETED', { id }, auth?.currentUser?.uid);

    try {
      await api.deleteRoutine(id);
    } catch (err) {
      console.error("Failed to delete routine, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete routine. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const saveHistory = useCallback(async (record: HistoryRecord) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const currentHistory = prev.history || [];
      const newHistory = [...currentHistory];
      const idx = newHistory.findIndex(h => h.id === record.id);
      if (idx >= 0) newHistory[idx] = record;
      else newHistory.unshift(record);
      return { ...prev, history: newHistory };
    });

    try {
      await api.saveHistory(record);
    } catch (err) {
      console.error("Failed to save history, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to record history entry. Changes reverted.', 'error');
      throw err;
    }
  }, []);
  
  const deleteHistory = useCallback(async (id: string) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, history: (prev.history || []).filter(h => h.id !== id) };
    });

    try {
      await api.deleteHistory(id);
    } catch (err) {
      console.error("Failed to delete history, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete history record. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const saveMeal = useCallback(async (meal: MealRecord) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const currentMeals = prev.meals || [];
      const newMeals = [...currentMeals];
      const idx = newMeals.findIndex(m => m.id === meal.id);
      if (idx >= 0) newMeals[idx] = meal;
      else newMeals.unshift(meal);
      return { ...prev, meals: newMeals };
    });

    broadcastSyncEvent('MEAL_SAVED', { meal }, auth?.currentUser?.uid);

    try {
      await api.saveMeal(meal);
    } catch (err) {
      console.error("Failed to save meal, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save meal entry. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const deleteMeal = useCallback(async (id: string) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const currentMeals = prev.meals || [];
      return { ...prev, meals: currentMeals.filter(m => m.id !== id) };
    });

    broadcastSyncEvent('MEAL_DELETED', { id }, auth?.currentUser?.uid);

    try {
      await api.deleteMeal(id);
    } catch (err) {
      console.error("Failed to delete meal, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete meal entry. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const saveBodyMetric = useCallback(async (entry: BodyMetricEntry) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const current = prev.bodyMetrics || [];
      const newMetrics = [...current];
      const idx = newMetrics.findIndex(m => m.id === entry.id);
      if (idx >= 0) newMetrics[idx] = entry;
      else newMetrics.unshift(entry);
      return { ...prev, bodyMetrics: newMetrics };
    });

    broadcastSyncEvent('METRIC_SAVED', { entry }, auth?.currentUser?.uid);

    try {
      await api.saveBodyMetric(entry);
    } catch (err) {
      console.error("Failed to save body metric, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to save body metric. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const deleteBodyMetric = useCallback(async (id: string) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const current = prev.bodyMetrics || [];
      return { ...prev, bodyMetrics: current.filter(m => m.id !== id) };
    });

    broadcastSyncEvent('METRIC_DELETED', { id }, auth?.currentUser?.uid);

    try {
      await api.deleteBodyMetric(id);
    } catch (err) {
      console.error("Failed to delete body metric, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not delete body metric. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const updateNutritionGoals = useCallback(async (goals: NutritionGoals) => {
    let snapshot: AppData | null = null;
    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, nutritionGoals: goals };
    });

    broadcastSyncEvent('GOALS_UPDATED', { goals }, auth?.currentUser?.uid);

    try {
      await api.updateNutritionGoals(goals);
    } catch (err) {
      console.error("Failed to update nutrition goals, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Failed to update nutrition goals. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  const logWater = useCallback(async (amountDelta: number, dateStr?: string) => {
    const key = dateStr || format(new Date(), 'yyyy-MM-dd');
    let snapshot: AppData | null = null;

    // The new total must be computed here, not inside the setData updater:
    // React runs updaters during the next render, so a value captured in the
    // updater is still 0 by the time api.logWater below is called - which
    // zeroed the local mirror and the cloud copy on every single tap.
    const current = dataRef.current?.waterLogs?.[key] || 0;
    const nextTotal = Math.max(0, current + amountDelta);
    if (dataRef.current) {
      dataRef.current = { ...dataRef.current, waterLogs: { ...(dataRef.current.waterLogs || {}), [key]: nextTotal } };
    }

    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, waterLogs: { ...(prev.waterLogs || {}), [key]: nextTotal } };
    });

    broadcastSyncEvent('WATER_LOGGED', { dateStr: key, amountDelta, newTotal: nextTotal }, auth?.currentUser?.uid);

    try {
      await api.logWater(key, nextTotal);
    } catch (err) {
      console.warn("Could not sync water log to cloud, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not sync water log to cloud.', 'error');
    }
  }, []);

  const resetWater = useCallback(async (dateStr?: string) => {
    const key = dateStr || format(new Date(), 'yyyy-MM-dd');
    let snapshot: AppData | null = null;
    if (dataRef.current) {
      dataRef.current = { ...dataRef.current, waterLogs: { ...(dataRef.current.waterLogs || {}), [key]: 0 } };
    }

    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      return { ...prev, waterLogs: { ...(prev.waterLogs || {}), [key]: 0 } };
    });

    broadcastSyncEvent('WATER_RESET', { dateStr: key }, auth?.currentUser?.uid);

    try {
      await api.logWater(key, 0);
    } catch (err) {
      console.warn("Could not sync water reset to cloud, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not reset water log.', 'error');
    }
  }, []);

  const saveInsights = useCallback(async (insights: PerformanceInsights) => {
    const previousInsights = dataRef.current?.insights;
    if (!dataRef.current) return;
    setData(prev => (prev ? { ...prev, insights } : prev));
    try {
      await api.saveInsights(insights);
    } catch (err) {
      console.error('Failed to save performance insights, rolling back:', err);
      if (previousInsights) setData(prev => (prev ? { ...prev, insights: previousInsights } : prev));
      notify('Could not save performance insights.', 'error');
      throw err;
    }
  }, []);

  const setTheme = useCallback(async (newTheme: string) => {
    const resolved = applyThemeToDom(newTheme);
    setThemeState(resolved);

    if (dataRef.current) {
      const newSettings: UserSettings = { ...dataRef.current.settings, theme: resolved };
      setData(prev => (prev ? { ...prev, settings: { ...prev.settings, theme: resolved } } : prev));
      try {
        await api.updateRootSettings(newSettings, dataRef.current.user);
      } catch (err) {
        console.warn("Could not sync theme to cloud, kept local preference:", err);
      }
    }
  }, []);

  const updateSettings = useCallback(async (settings: UserSettings, user?: AppData['user']) => {
    if (!dataRef.current) return;
    if (settings.theme) {
      const resolved = applyThemeToDom(settings.theme);
      setThemeState(resolved);
      settings.theme = resolved;
    }
    const previous = dataRef.current;
    const targetUser = user !== undefined ? user : previous.user;
    setData(prev => (prev ? { ...prev, settings, user: targetUser } : prev));
    broadcastSyncEvent('SETTINGS_UPDATED', { settings }, auth?.currentUser?.uid);

    try {
      await api.updateRootSettings(settings, targetUser);
    } catch (err) {
      console.error("Failed to update settings, rolling back UI state:", err);
      const currentActiveTheme = localStorage.getItem('forma_theme') || localStorage.getItem('kinetic_theme') || localStorage.getItem('mygym_theme') || theme;
      const preservedSettings = { ...previous.settings, theme: currentActiveTheme };
      setData(prev => (prev ? { ...prev, settings: preservedSettings, user: previous.user } : prev));
      throw err;
    }
  }, [theme]);

  const updateData = useCallback(async (newData: AppData) => {
    setData(newData);
    await api.updateRootSettings(newData.settings, newData.user);
  }, []);

  /**
   * Moves the whole account into `settings.weightUnit` in one shot.
   *
   * One state update covers sessions, routines and settings together, so the UI can
   * never render a half-converted history, and the snapshot taken beforehand is
   * restored in full if persistence fails.
   */
  const convertWeightUnits = useCallback(async (settings: UserSettings, target: WeightUnit) => {
    const previous = dataRef.current;
    if (!previous) return;
    if (previous.settings.weightUnit === target) return;

    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        settings,
        sessions: prev.sessions.map((session) => convertSessionUnits(session, prev.settings.weightUnit, target)),
        routines: prev.routines.map((routine) => convertRoutineUnits(routine, prev.settings.weightUnit, target))
      };
    });

    try {
      await api.convertWeightUnits({
        target,
        currentUnit: previous.settings.weightUnit,
        sessions: previous.sessions,
        routines: previous.routines,
        settings,
        previousSettings: previous.settings
      });
    } catch (err) {
      console.error('Failed to convert weight units, rolling back:', err);
      setData(previous);
      notify('Could not convert your saved weights. Changes reverted.', 'error');
      throw err;
    }
  }, []);

  /**
   * Order matters here. `signOut(auth)` makes `onAuthStateChanged` fire with
   * `null`, which triggers `fetchInitialData()` and rebuilds state from the
   * local mirror. Dropping this athlete's mirror first means that reload finds
   * nothing and yields a clean, user-less athlete instead of resurrecting the
   * previous one. Calling `api.updateRootSettings` on the way out would
   * re-create the very cache we are trying to delete.
   *
   * Only the mirror owned by the account being signed out is removed, so an
   * account that used this device earlier keeps its cached workouts.
   */
  const signOutUser = useCallback(async () => {
    realtimeUnsubRef.current();
    clearLocalMirror();

    if (auth?.currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Could not sign out of Firebase Auth, clearing local state anyway:', err);
      }
    }

    setData(prev =>
      prev
        ? {
            ...prev,
            user: undefined,
            sessions: [],
            routines: [],
            exercises: [],
            history: [],
            meals: [],
            bodyMetrics: [],
            waterLogs: {}
          }
        : prev
    );
  }, []);

  // Export and import backup helpers
  const exportBackup = useCallback(() => {
    if (!data) return;
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `forma-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoking in the same tick cancels the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error('Failed to export backup:', err);
    }
  }, [data]);

  const importBackup = useCallback(async (backupJson: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(backupJson);
      const updated = await api.importAllData(parsed);
      dataRef.current = updated;
      setData(updated);
      if (updated.settings?.theme) {
        setThemeState(updated.settings.theme);
        applyThemeToDom(updated.settings.theme);
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }, []);

  // Stable identity unless the data itself changes, so consumers of the context
  // are not forced to re-render on every provider render.
  const contextValue = useMemo<DataContextType>(() => ({
    data, loading, theme, setTheme, forceRefresh: fetchInitialData,
    saveSession, saveSessions, deleteSession, deleteSessions, finishWorkoutSession, saveRoutine, deleteRoutine, saveHistory, deleteHistory, saveMeal, deleteMeal,
    saveBodyMetric, deleteBodyMetric, updateNutritionGoals, logWater, resetWater,
    saveInsights,
    updateSettings, convertWeightUnits, updateData, signOutUser,
    exportBackup, importBackup
  }), [
    data, loading, theme, setTheme, fetchInitialData,
    saveSession, saveSessions, deleteSession, deleteSessions, finishWorkoutSession, saveRoutine, deleteRoutine, saveHistory, deleteHistory, saveMeal,
    saveBodyMetric, deleteBodyMetric, updateNutritionGoals, logWater, resetWater,
    saveInsights, updateSettings, convertWeightUnits, updateData, signOutUser, exportBackup, importBackup
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
