import { useCallback, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { POPOVER_TRANSITION, resolveTransition } from './navMotion';

export interface ThemeOption {
  id: string;
  name: string;
  color: string;
}

export const THEME_CATALOG: readonly ThemeOption[] = [
  { id: 'dark', name: 'Obsidian', color: '#38bdf8' },
  { id: 'light', name: 'Cloud', color: '#3b82f6' },
  { id: 'midnight', name: 'Midnight', color: '#60a5fa' },
  { id: 'neon', name: 'Neon', color: '#e879f9' },
  { id: 'ocean', name: 'Ocean', color: '#14b8a6' },
  { id: 'forest', name: 'Forest', color: '#10b981' },
  { id: 'sunset', name: 'Sunset', color: '#f97316' },
  { id: 'paper', name: 'Paper', color: '#cbd5e1' },
] as const;

interface ThemePalettePopoverProps {
  open: boolean;
  activeTheme: string;
  motionEnabled: boolean;
  onClose: () => void;
  onSelect: (themeId: string) => void;
}

export function ThemePalettePopover({
  open,
  activeTheme,
  motionEnabled,
  onClose,
  onSelect,
}: ThemePalettePopoverProps) {
  const { t, isRTL } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const transition = resolveTransition(POPOVER_TRANSITION, motionEnabled);

  const requestClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    });

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        requestClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', handlePointerDown);
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
            className="theme-popover-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={requestClose}
            aria-hidden="true"
          />
          <div ref={containerRef} className="theme-popover-anchor">
            <motion.div
              ref={panelRef}
              className="theme-popover-menu"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${titleId}-label`}
              initial={motionEnabled ? { opacity: 0, y: 10, scale: 0.95 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={motionEnabled ? { opacity: 0, y: 8, scale: 0.95 } : { opacity: 0 }}
              transition={transition}
            >
              <div className="theme-popover-header">
                <span className="theme-popover-title" id={`${titleId}-label`}>
                  {t('themesPaletteTitle')}
                </span>
                <button
                  type="button"
                  className="theme-popover-close-btn touch-target"
                  onClick={requestClose}
                  aria-label={isRTL ? 'إغلاق' : 'Close'}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
              <div
                className="theme-popover-grid"
                role="radiogroup"
                aria-labelledby={`${titleId}-label`}
                onKeyDown={event => {
                  // Roving focus, so Tab leaves the radiogroup instead of walking all
                  // eight themes. Direction-aware: ArrowRight moves forward in LTR,
                  // backward in RTL.
                  const forward = isRTL ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
                  const back = isRTL ? event.key === 'ArrowRight' : event.key === 'ArrowLeft';
                  if (!forward && !back && event.key !== 'Home' && event.key !== 'End') return;
                  event.preventDefault();
                  const total = THEME_CATALOG.length;
                  const from = THEME_CATALOG.findIndex(theme => theme.id === activeTheme);
                  const next =
                    event.key === 'Home' ? 0
                    : event.key === 'End' ? total - 1
                    : ((from < 0 ? 0 : from) + (forward ? 1 : -1) + total) % total;
                  const target = THEME_CATALOG[next];
                  onSelect(target.id);
                  window.requestAnimationFrame(() => {
                    document.getElementById(`${titleId}-${target.id}`)?.focus();
                  });
                }}
              >
                {THEME_CATALOG.map(theme => {
                  const isSelected = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      id={`${titleId}-${theme.id}`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      className={`theme-popover-item touch-target${isSelected ? ' is-selected' : ''}`}
                      onClick={() => onSelect(theme.id)}
                    >
                      <span className="theme-preview-dot" style={{ backgroundColor: theme.color }} aria-hidden="true" />
                      <span>{theme.name}</span>
                      {isSelected && <Check size={13} className="theme-popover-check" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
