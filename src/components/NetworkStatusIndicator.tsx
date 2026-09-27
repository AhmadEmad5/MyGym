import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

export function NetworkStatusIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 0.85rem)',
            left: 0,
            right: 0,
            marginInline: 'auto',
            width: 'fit-content',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(23, 20, 31, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            fontSize: '0.8rem',
            fontWeight: 600,
            pointerEvents: 'none',
            maxWidth: '92vw'
          }}
        >
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-400" />
          <span>{t('offlineModeDesc')}</span>
        </motion.div>
      )}

      {showRestored && isOnline && (
        <motion.div
          key="online-restored"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 0.85rem)',
            left: 0,
            right: 0,
            marginInline: 'auto',
            width: 'fit-content',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(16, 30, 24, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(34, 197, 94, 0.25)',
            color: '#4ade80',
            fontSize: '0.8rem',
            fontWeight: 600,
            pointerEvents: 'none',
            maxWidth: '92vw'
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{t('onlineRestored')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
