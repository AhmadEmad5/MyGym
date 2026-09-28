import { useCallback, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Globe, Palette, X } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import {
  DRAG_CLOSE_DISTANCE,
  DRAG_CLOSE_VELOCITY,
  SHEET_SPRING,
  resolveTransition,
} from './navMotion';
import { NavDestinationLink } from './NavDestinationLink';
import type { ShellNavItem } from './navModel';

interface NavOverflowSheetProps {
  open: boolean;
  items: ShellNavItem[];
  motionEnabled: boolean;
  languageLabel: string;
  onClose: () => void;
  onSelect: () => void;
  onPrefetch: (routeId: string) => void;
  onOpenThemePalette: () => void;
  onToggleLanguage: () => void;
}

export function NavOverflowSheet({
  open,
  items,
  motionEnabled,
  languageLabel,
  onClose,
  onSelect,
  onPrefetch,
  onOpenThemePalette,
  onToggleLanguage,
}: NavOverflowSheetProps) {
  const { t, isRTL } = useTranslation();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const titleId = useId();
  const transition = resolveTransition(SHEET_SPRING, motionEnabled);

  const requestClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => panelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [open, requestClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="more-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={resolveTransition({ duration: 0.18 }, motionEnabled)}
            onClick={requestClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            className="more-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={motionEnabled ? { y: '100%' } : false}
            animate={{ y: 0 }}
            exit={motionEnabled ? { y: '100%' } : { opacity: 0 }}
            transition={transition}
            drag={motionEnabled ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.28 }}
            dragListener={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > DRAG_CLOSE_DISTANCE || info.velocity.y > DRAG_CLOSE_VELOCITY) {
                requestClose();
              }
            }}
          >
            <div
              className="more-sheet-handle"
              role="presentation"
              aria-label={isRTL ? 'اسحب للأسفل للإغلاق' : 'Drag down to close'}
              onPointerDown={event => dragControls.start(event)}
            />

            <div className="more-sheet-title-row">
              <span className="more-sheet-title" id={titleId}>{t('navMore')}</span>
              <button
                type="button"
                className="more-sheet-close-btn"
                onClick={requestClose}
                aria-label={isRTL ? 'إغلاق' : 'Close'}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <nav className="more-sheet-grid" aria-label={t('navMore')}>
              {items.map(item => (
                <NavDestinationLink
                  key={item.id}
                  item={item}
                  surface="overflow"
                  activeLayoutId={null}
                  motionEnabled={motionEnabled}
                  onSelect={onSelect}
                  onPrefetch={() => onPrefetch(item.id)}
                />
              ))}
            </nav>

            <div className="more-sheet-footer-actions">
              <button type="button" className="more-sheet-footer-btn" onClick={onOpenThemePalette}>
                <Palette size={16} aria-hidden="true" />
                <span>{t('themesPaletteTitle')}</span>
              </button>
              <button type="button" className="more-sheet-footer-btn" onClick={onToggleLanguage}>
                <Globe size={16} aria-hidden="true" />
                <span>{languageLabel}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
