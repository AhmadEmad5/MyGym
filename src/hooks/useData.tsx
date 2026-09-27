import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { format } from 'date-fns';
import { api, AppData, WorkoutSession, Routine, HistoryRecord, UserSettings, MealRecord, BodyMetricEntry, NutritionGoals, PerformanceInsights, estimateWorkoutCalories } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { notify } from '../lib/feedback';

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
      const raw = localStorage.getItem('gym_data');
      if (raw) {
        return JSON.parse(raw) as AppData;
      }
    } catch (e) {
      console.warn('Failed to parse cached gym_data:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !localStorage.getItem('gym_data');
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
  }, [data?.settings?.fontScale, data?.settings?.highContrast]);

  const fetchInitialData = useCallback(async () => {
    if (!localStorage.getItem('gym_data')) {
      setLoading(true);
    }
    const result = await api.getData();
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
          if (!localStorage.getItem('gym_data')) {
            setLoading(true);
          }
          const result = await api.getData();
          
          if (!result.user || result.user.email !== firebaseUser.email) {
            const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            const userObj = { email: firebaseUser.email || '', name: name.charAt(0).toUpperCase() + name.slice(1) };
            result.user = userObj;
            await api.updateRootSettings(result.settings, userObj);
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
        } else {
          // Logged out or Guest mode
          fetchInitialData();
        }
      });
    } else {
      fetchInitialData();
    }

    return () => unsubscribe();
  }, [fetchInitialData]);

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
    let calculatedTotal = 0;
    let snapshot: AppData | null = null;

    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const currentWater = { ...(prev.waterLogs || {}) };
      const currentAmount = currentWater[key] || 0;
      calculatedTotal = Math.max(0, currentAmount + amountDelta);
      currentWater[key] = calculatedTotal;
      return { ...prev, waterLogs: currentWater };
    });

    try {
      await api.logWater(key, calculatedTotal);
    } catch (err) {
      console.warn("Could not sync water log to cloud, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not sync water log to cloud.', 'error');
    }
  }, []);

  const resetWater = useCallback(async (dateStr?: string) => {
    const key = dateStr || format(new Date(), 'yyyy-MM-dd');
    let snapshot: AppData | null = null;

    setData(prev => {
      if (!prev) return prev;
      snapshot = prev;
      const currentWater = { ...(prev.waterLogs || {}) };
      currentWater[key] = 0;
      return { ...prev, waterLogs: currentWater };
    });

    try {
      await api.logWater(key, 0);
    } catch (err) {
      console.warn("Could not sync water reset to cloud, rolling back:", err);
      if (snapshot) setData(snapshot);
      notify('Could not reset water log.', 'error');
    }
  }, []);

  const saveInsights = useCallback(async (insights: PerformanceInsights) => {
    if (!data) return;
    const previous = { ...data };
    setData({ ...data, insights });
    try {
      await api.saveInsights(insights);
    } catch (err) {
      console.error('Failed to save performance insights, rolling back:', err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const setTheme = useCallback(async (newTheme: string) => {
    const resolved = applyThemeToDom(newTheme);
    setThemeState(resolved);

    if (data) {
      const newSettings: UserSettings = { ...data.settings, theme: resolved };
      setData({ ...data, settings: newSettings });

      try {
        await api.updateRootSettings(newSettings, data.user);
      } catch (err) {
        console.warn("Could not sync theme to cloud, kept local preference:", err);
      }
    }
  }, [data]);

  const updateSettings = useCallback(async (settings: UserSettings, user?: AppData['user']) => {
    if (!data) return;
    if (settings.theme) {
      const resolved = applyThemeToDom(settings.theme);
      setThemeState(resolved);
      settings.theme = resolved;
    }
    const previous = { ...data };
    const targetUser = user !== undefined ? user : data.user;
    const newData = { ...data, settings, user: targetUser };
    setData(newData);

    try {
      await api.updateRootSettings(settings, targetUser);
    } catch (err) {
      console.error("Failed to update settings, rolling back UI state:", err);
      const currentActiveTheme = localStorage.getItem('forma_theme') || localStorage.getItem('kinetic_theme') || localStorage.getItem('mygym_theme') || theme;
      const preservedSettings = { ...previous.settings, theme: currentActiveTheme };
      setData({ ...previous, settings: preservedSettings });
      throw err;
    }
  }, [data, theme]);

  const updateData = useCallback(async (newData: AppData) => {
    setData(newData);
    await api.updateRootSettings(newData.settings, newData.user);
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
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup:', err);
    }
  }, [data]);

  const importBackup = useCallback(async (backupJson: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(backupJson);
      const updated = await api.importAllData(parsed);
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

  return (
    <DataContext.Provider value={{ 
      data, loading, theme, setTheme, forceRefresh: fetchInitialData,
      saveSession, saveSessions, deleteSession, deleteSessions, finishWorkoutSession, saveRoutine, deleteRoutine, saveHistory, deleteHistory, saveMeal, deleteMeal,
      saveBodyMetric, deleteBodyMetric, updateNutritionGoals, logWater, resetWater,
      saveInsights,
      updateSettings, updateData,
      exportBackup, importBackup
    }}>
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
