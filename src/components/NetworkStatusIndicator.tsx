import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, WifiOff, X } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

const OFFLINE_GRACE_MS = 2500;
const RESTORED_LINGER_MS = 3200;

type BannerState = 'hidden' | 'offline' | 'restored';

export function NetworkStatusIndicator() {
  const { t, isRTL } = useTranslation();
  const [banner, setBanner] = useState<BannerState>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const graceTimer = useRef<number | null>(null);
  const lingerTimer = useRef<number | null>(null);
  const bannerRef = useRef<BannerState>('hidden');

  const clearGrace = useCallback(() => {
    if (graceTimer.current !== null) {
      window.clearTimeout(graceTimer.current);
      graceTimer.current = null;
    }
  }, []);

  const clearLinger = useCallback(() => {
    if (lingerTimer.current !== null) {
      window.clearTimeout(lingerTimer.current);
      lingerTimer.current = null;
    }
  }, []);

  const setBannerState = useCallback((next: BannerState) => {
    bannerRef.current = next;
    setBanner(next);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setBannerState('offline');
    }

    const handleOffline = () => {
      clearLinger();
      if (dismissed) return;
      clearGrace();
      graceTimer.current = window.setTimeout(() => setBannerState('offline'), OFFLINE_GRACE_MS);
    };

    const handleOnline = () => {
      clearGrace();
      if (bannerRef.current !== 'offline') {
        setBannerState('hidden');
        return;
      }
      clearLinger();
      setBannerState('restored');
      lingerTimer.current = window.setTimeout(() => setBannerState('hidden'), RESTORED_LINGER_MS);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearGrace();
      clearLinger();
    };
  }, [clearGrace, clearLinger, dismissed, setBannerState]);

  const offline = banner === 'offline';
  const restored = banner === 'restored';

  return (
    <AnimatePresence>
      {(offline || restored) && (
        <motion.div
          key={banner}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-auto fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.85rem)] z-[9999] mx-auto flex w-fit max-w-[92vw] items-center gap-2.5 rounded-full border px-3.5 py-2 text-[0.8rem] font-semibold backdrop-blur-[16px]"
          style={
            offline
              ? {
                  backgroundColor: 'rgba(23, 20, 31, 0.94)',
                  borderColor: 'rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(245, 158, 11, 0.25)'
                }
              : {
                  backgroundColor: 'rgba(16, 30, 24, 0.94)',
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  color: '#4ade80',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(34, 197, 94, 0.25)'
                }
          }
        >
          {offline ? (
            <WifiOff size={16} className="flex-shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={16} className="flex-shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{offline ? t('offlineModeDesc') : t('onlineRestored')}</span>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setBannerState('hidden');
            }}
            className="-me-1 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-current opacity-70 transition-opacity hover:opacity-100"
            aria-label={isRTL ? 'إخفاء' : 'Dismiss'}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
