import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // Check dismissal cooldown (7 days)
    const dismissedAt = localStorage.getItem('mygym_pwa_dismissed');
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      // Delay showing for 2.5 seconds so it doesn't disturb initial view
      const timer = setTimeout(() => setIsDismissed(false), 2500);
      return () => clearTimeout(timer);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install prompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccessfully(true);
        setTimeout(() => setIsDismissed(true), 2000);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('mygym_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || isDismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          left: '1rem',
          right: '1rem',
          maxWidth: '460px',
          margin: '0 auto',
          zIndex: 90,
          backgroundColor: 'rgba(18, 24, 38, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid rgba(67, 220, 255, 0.3)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(67, 220, 255, 0.15)',
          padding: '1rem 1.15rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #43dcff, #855cff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 16px rgba(67, 220, 255, 0.3)'
              }}
            >
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('installAppTitle')}
              </h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {isIOS ? t('iosInstallTip') : t('installAppDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
              borderRadius: '6px'
            }}
            aria-label={t('dismissWord')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        {!isIOS && deferredPrompt && (
          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={handleDismiss}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '9px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('dismissWord')}
            </button>

            <button
              onClick={handleInstallClick}
              style={{
                padding: '0.45rem 1.15rem',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #43dcff, #3b82f6)',
                border: 'none',
                color: '#06121e',
                fontSize: '0.8rem',
                fontWeight: 750,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(67, 220, 255, 0.4)'
              }}
            >
              {installedSuccessfully ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم التثبيت بنجاح</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('installNow')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {isIOS && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#43dcff'
            }}
          >
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span>{t('iosInstallTip')}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
