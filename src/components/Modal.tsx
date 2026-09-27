import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="portal-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="card premium-modal modal-card" 
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-handle" />
        <div 
          className="modal-header-bar flex items-center justify-between" 
          style={{ 
            padding: '1rem 1.4rem', 
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
            flexShrink: 0
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{title}</h2>
          <button 
            className="btn-icon btn-ghost" 
            onClick={onClose} 
            aria-label="Close modal" 
            style={{ 
              padding: '0.5rem', 
              minWidth: '44px', 
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-body-content" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.4rem', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

