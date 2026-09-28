import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useReducedMotion } from './performance/useReducedMotion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  description,
  footer,
  hideCloseButton = false
}: ModalProps) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const getFocusable = useCallback((): HTMLElement[] => {
    if (!cardRef.current) return [];
    return Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.classList.add('modal-open');

    const focusTimer = window.setTimeout(() => {
      const focusable = getFocusable();
      (focusable[0] || cardRef.current)?.focus();
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        cardRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === cardRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown, true);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose, getFocusable]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="portal-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={cardRef}
        className="card premium-modal modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={reducedMotion ? undefined : { animation: 'none' }}
      >
        <div className="modal-drag-handle" />
        <div
          className="modal-header-bar flex items-center justify-between"
          style={{
            padding: '1rem 1.4rem',
            paddingInlineStart: 'max(1.4rem, env(safe-area-inset-left, 0px))',
            paddingInlineEnd: 'max(1.4rem, env(safe-area-inset-right, 0px))',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
            flexShrink: 0
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 id={titleId} style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{title}</h2>
            {description && (
              <p id={descriptionId} style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                padding: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          className="modal-body-content"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '1.25rem 1.4rem',
            paddingBlockEnd: 'calc(1.25rem + max(12px, env(safe-area-inset-bottom, 0px)))',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: '0.85rem 1.4rem',
              paddingBlockEnd: 'calc(0.85rem + max(12px, env(safe-area-inset-bottom, 0px)))',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
