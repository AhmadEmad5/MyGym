import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Share2, Smartphone, X } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_COOLDOWN_DAYS = 7;
const APPEAR_DELAY_MS = 2500;

export function InstallAppPrompt() {
  const { t, isRTL } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);
  const standalone = useRef(false);

  useEffect(() => {
    standalone.current =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone.current) return;

    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent.toLowerCase()));

    const dismissedAt = localStorage.getItem('mygym_pwa_dismissed');
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      setIsDismissed(diffDays < DISMISS_COOLDOWN_DAYS);
    } else {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (standalone.current || isDismissed) return;
    if (!deferredPrompt && !isIOS) return;
    const timer = window.setTimeout(() => setIsDismissed(false), APPEAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [deferredPrompt, isDismissed, isIOS]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalledSuccessfully(true);
      window.setTimeout(() => setIsDismissed(true), 2000);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('mygym_pwa_dismissed', Date.now().toString());
  };

  if (standalone.current || isDismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="dialog"
        aria-label={t('installAppTitle')}
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          insetInlineStart: 'max(1rem, env(safe-area-inset-left, 0px))',
          insetInlineEnd: 'max(1rem, env(safe-area-inset-right, 0px))',
          maxWidth: '460px',
          margin: '0 auto',
          zIndex: 90,
          backgroundColor: 'var(--surface-glass)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid color-mix(in srgb, var(--accent-cyan) 32%, transparent)',
          boxShadow: 'var(--shadow-modal)',
          padding: '1rem 1.15rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              aria-hidden="true"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #43dcff, #855cff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Smartphone size={22} className="text-slate-950" />
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
              padding: '0.35rem',
              borderRadius: '8px',
              minWidth: 36,
              minHeight: 36
            }}
            aria-label={t('dismissWord')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={handleDismiss}
              style={{
                minHeight: 40,
                padding: '0.45rem 0.85rem',
                borderRadius: '9px',
                background: 'transparent',
                border: '1px solid var(--border-card)',
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
                minHeight: 40,
                padding: '0.45rem 1.15rem',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #43dcff, #3b82f6)',
                border: 'none',
                color: '#06121e',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              {installedSuccessfully ? (
                <>
                  <Check size={16} aria-hidden="true" />
                  <span>{isRTL ? 'تم التثبيت بنجاح' : 'Installed'}</span>
                </>
              ) : (
                <>
                  <Download size={16} aria-hidden="true" />
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
              background: 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)'
            }}
          >
            <Share2 size={16} aria-hidden="true" className="flex-shrink-0" />
            <span>{t('iosInstallTip')}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
