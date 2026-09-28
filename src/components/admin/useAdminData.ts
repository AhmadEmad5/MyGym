import { useCallback, useEffect, useRef, useState } from 'react';
import { loadAdminPlatformData, type AdminPlatformStats, type AthleteSummary } from '../../lib/adminData';
import type { LoadStatus } from './types';

export type AdminDataState = {
  status: LoadStatus;
  error: string | null;
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  isRefreshing: boolean;
  lastSyncedAt: Date | null;
  refresh: (manual?: boolean) => Promise<void>;
  retry: () => Promise<void>;
};

export function useAdminData(onNotify: (message: string, tone: 'success' | 'error') => void): AdminDataState {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const mounted = useRef(true);
  const notifyRef = useRef(onNotify);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    notifyRef.current = onNotify;
  }, [onNotify]);

  const refresh = useCallback(
    async (manual = false) => {
      setStatus((current) => (current === 'ready' || current === 'error' ? 'refreshing' : 'loading'));
      setError(null);
      try {
        const result = await loadAdminPlatformData();
        if (!mounted.current) return;
        setStats(result.stats);
        setAthletes(result.athletes);
        setLastSyncedAt(new Date());
        setStatus('ready');
        if (manual) notifyRef.current('sync-ok', 'success');
      } catch (caught) {
        console.error('Error loading admin platform data:', caught);
        if (!mounted.current) return;
        setError(caught instanceof Error ? caught.message : 'unknown');
        setStatus('error');
        if (manual) notifyRef.current('sync-fail', 'error');
      }
    },
    []
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  return {
    status,
    error,
    stats,
    athletes,
    isRefreshing: status === 'refreshing',
    lastSyncedAt,
    refresh,
    retry: () => refresh(false)
  };
}
