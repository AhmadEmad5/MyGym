import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, AppData } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type DataContextType = {
  data: AppData | null;
  loading: boolean;
  updateData: (newData: AppData) => Promise<void>;
  forceRefresh: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const result = await api.getData();
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
            result.user = { email: firebaseUser.email || '', name: name.charAt(0).toUpperCase() + name.slice(1) };
            await api.saveData(result);
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

  const updateData = async (newData: AppData) => {
    // Optimistic update
    setData(newData);
    // Background sync
    await api.saveData(newData);
  };

  return (
    <DataContext.Provider value={{ data, loading, updateData, forceRefresh: fetchInitialData }}>
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
