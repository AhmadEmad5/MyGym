import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { SHEET_SPRING, resolveTransition } from './navMotion';
import { useMotionEnabled } from './useMotionPreference';

interface MobileActionSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function MobileActionSheet({ open, title, onClose, children }: MobileActionSheetProps) {
  const { isRTL } = useTranslation();
  const motionEnabled = useMotionEnabled();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeHandler = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  closeHandler.current = onClose;

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHandler.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="forma-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={resolveTransition({ duration: 0.18 }, motionEnabled)}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.section
            ref={panelRef}
            className="forma-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={motionEnabled ? { y: '100%' } : false}
            animate={{ y: 0 }}
            exit={motionEnabled ? { y: '100%' } : { opacity: 0 }}
            transition={resolveTransition(SHEET_SPRING, motionEnabled)}
            style={motionEnabled ? { willChange: 'transform' } : undefined}
          >
            <div className="forma-sheet-handle" aria-hidden="true" />
            <div className="forma-sheet-header">
              <h2 id={titleId}>{title}</h2>
              <button
                type="button"
                className="btn-icon btn-ghost"
                onClick={onClose}
                aria-label={isRTL ? 'إغلاق' : 'Close'}
              >
                <X width={20} height={20} aria-hidden="true" />
              </button>
            </div>
            <div className="forma-sheet-body">{children}</div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
