import React, { useEffect } from 'react';
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="card premium-modal" 
        style={{ width: '100%', maxWidth: '500px', margin: '0 1rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
