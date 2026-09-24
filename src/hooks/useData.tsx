import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, AppData, WorkoutSession, Routine, HistoryRecord, UserSettings, MealRecord } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  saveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  saveHistory: (record: HistoryRecord) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  saveMeal: (meal: MealRecord) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
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
    localStorage.setItem('mygym_theme', resolved);
  } catch (e) {}
  return resolved;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mygym_theme');
      if (stored) return stored;
    }
    return 'dark';
  });

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const result = await api.getData();
    const localTheme = localStorage.getItem('mygym_theme');
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
          setLoading(true);
          const result = await api.getData();
          
          if (!result.user || result.user.email !== firebaseUser.email) {
            const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            const userObj = { email: firebaseUser.email || '', name: name.charAt(0).toUpperCase() + name.slice(1) };
            result.user = userObj;
            await api.updateRootSettings(result.settings, userObj);
          }
          const localTheme = localStorage.getItem('mygym_theme');
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
  const saveSession = useCallback(async (session: WorkoutSession) => {
    if (!data) return;
    const previous = { ...data };
    const newSessions = [...data.sessions];
    const idx = newSessions.findIndex(s => s.id === session.id);
    if (idx >= 0) newSessions[idx] = session;
    else newSessions.push(session);
    setData({ ...data, sessions: newSessions });

    try {
      await api.saveSession(session);
    } catch (err) {
      console.error("Failed to save session, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const saveSessions = useCallback(async (sessions: WorkoutSession[]) => {
    if (!data || sessions.length === 0) return;
    const previous = { ...data };
    const newSessions = [...data.sessions];
    for (const session of sessions) {
      const idx = newSessions.findIndex(s => s.id === session.id);
      if (idx >= 0) newSessions[idx] = session;
      else newSessions.push(session);
    }
    setData({ ...data, sessions: newSessions });

    try {
      await api.saveSessions(sessions);
    } catch (err) {
      console.error("Failed to save sessions, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const deleteSession = useCallback(async (id: string) => {
    if (!data) return;
    const previous = { ...data };
    setData({ ...data, sessions: data.sessions.filter(s => s.id !== id) });

    try {
      await api.deleteSession(id);
    } catch (err) {
      console.error("Failed to delete session, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const deleteSessions = useCallback(async (ids: string[]) => {
    if (!data || ids.length === 0) return;
    const previous = { ...data };
    const idSet = new Set(ids);
    setData({ ...data, sessions: data.sessions.filter(s => !idSet.has(s.id)) });

    try {
      await api.deleteSessions(ids);
    } catch (err) {
      console.error("Failed to delete sessions, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const saveRoutine = useCallback(async (routine: Routine) => {
    if (!data) return;
    const previous = { ...data };
    const newRoutines = [...data.routines];
    const idx = newRoutines.findIndex(r => r.id === routine.id);
    if (idx >= 0) newRoutines[idx] = routine;
    else newRoutines.push(routine);
    setData({ ...data, routines: newRoutines });

    try {
      await api.saveRoutine(routine);
    } catch (err) {
      console.error("Failed to save routine, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const deleteRoutine = useCallback(async (id: string) => {
    if (!data) return;
    const previous = { ...data };
    setData({ ...data, routines: data.routines.filter(r => r.id !== id) });

    try {
      await api.deleteRoutine(id);
    } catch (err) {
      console.error("Failed to delete routine, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const saveHistory = useCallback(async (record: HistoryRecord) => {
    if (!data) return;
    const previous = { ...data };
    const currentHistory = data.history || [];
    const newHistory = [...currentHistory];
    const idx = newHistory.findIndex(h => h.id === record.id);
    if (idx >= 0) newHistory[idx] = record;
    else newHistory.push(record);
    setData({ ...data, history: newHistory });

    try {
      await api.saveHistory(record);
    } catch (err) {
      console.error("Failed to save history, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);
  
  const deleteHistory = useCallback(async (id: string) => {
    if (!data) return;
    const previous = { ...data };
    setData({ ...data, history: (data.history || []).filter(h => h.id !== id) });

    try {
      await api.deleteHistory(id);
    } catch (err) {
      console.error("Failed to delete history, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const saveMeal = useCallback(async (meal: MealRecord) => {
    if (!data) return;
    const previous = { ...data };
    const currentMeals = data.meals || [];
    const newMeals = [...currentMeals];
    const idx = newMeals.findIndex(m => m.id === meal.id);
    if (idx >= 0) newMeals[idx] = meal;
    else newMeals.unshift(meal);
    setData({ ...data, meals: newMeals });

    try {
      await api.saveMeal(meal);
    } catch (err) {
      console.error("Failed to save meal, rolling back UI state:", err);
      setData(previous);
      throw err;
    }
  }, [data]);

  const deleteMeal = useCallback(async (id: string) => {
    if (!data) return;
    const previous = { ...data };
    const currentMeals = data.meals || [];
    setData({ ...data, meals: currentMeals.filter(m => m.id !== id) });

    try {
      await api.deleteMeal(id);
    } catch (err) {
      console.error("Failed to delete meal, rolling back UI state:", err);
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
    const newData = { ...data, settings };
    if (user !== undefined) newData.user = user;
    setData(newData);

    try {
      await api.updateRootSettings(settings, newData.user);
    } catch (err) {
      console.error("Failed to update settings, rolling back UI state:", err);
      const currentActiveTheme = localStorage.getItem('mygym_theme') || theme;
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
      link.download = `mygym-backup-${dateStr}.json`;
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
      saveSession, saveSessions, deleteSession, deleteSessions, saveRoutine, deleteRoutine, saveHistory, deleteHistory, saveMeal, deleteMeal, updateSettings, updateData,
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
