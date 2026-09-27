import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface MobileActionSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function MobileActionSheet({ open, title, onClose, children }: MobileActionSheetProps) {
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

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ));
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
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.section
            ref={panelRef}
            className="forma-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forma-mobile-sheet-title"
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          >
            <div className="forma-sheet-handle" aria-hidden="true" />
            <div className="forma-sheet-header">
              <h2 id="forma-mobile-sheet-title">{title}</h2>
              <button type="button" className="btn-icon btn-ghost" onClick={onClose} aria-label="Close">
                <X width={18} height={18} />
              </button>
            </div>
            <div className="forma-sheet-body">{children}</div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
