import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Flame, Zap, Dumbbell, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useReducedMotion } from './performance/useReducedMotion';
import type { SetType } from '../lib/api';

interface SetTypePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: SetType;
  setNumber: number;
  exerciseName?: string;
  onSelect: (type: SetType) => void;
}

export function SetTypePickerModal({
  isOpen,
  onClose,
  currentType,
  setNumber,
  exerciseName,
  onSelect
}: SetTypePickerModalProps) {
  const { t, isRTL, tExercise } = useTranslation();
  const reducedMotion = useReducedMotion();

  if (!isOpen) return null;

  const options: Array<{
    type: SetType;
    badge: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
  }> = [
    {
      type: 'normal',
      badge: `${setNumber}`,
      title: t('normalSet'),
      description: t('normalSetDesc'),
      icon: <Dumbbell size={18} />,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.35)'
    },
    {
      type: 'warmup',
      badge: `W${setNumber}`,
      title: t('warmupSet'),
      description: t('warmupSetDesc'),
      icon: <Sparkles size={18} />,
      color: '#facc15',
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.35)'
    },
    {
      type: 'dropset',
      badge: `D${setNumber}`,
      title: t('dropset'),
      description: t('dropsetDesc'),
      icon: <Zap size={18} />,
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.35)'
    },
    {
      type: 'failure',
      badge: `F${setNumber}`,
      title: t('failureSet'),
      description: t('failureSetDesc'),
      icon: <Flame size={18} />,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)'
    }
  ];

  const handleSelect = (type: SetType) => {
    gymAudio.triggerVibration([15]);
    onSelect(type);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
      >
        <motion.div
          className="forma-set-type-sheet"
          initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
          animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--premium-surface)',
            borderTop: '1px solid var(--premium-line)',
            borderTopLeftRadius: '26px',
            borderTopRightRadius: '26px',
            padding: '1.25rem 1.25rem calc(1.5rem + max(16px, var(--shell-safe-bottom, env(safe-area-inset-bottom, 0px))))',
            boxShadow: '0 -15px 40px rgba(0, 0, 0, 0.65)',
            userSelect: 'none',
            touchAction: 'manipulation',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
        >
          {/* Top Sheet Grab Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div style={{ width: '42px', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.22)', borderRadius: '999px' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('selectSetType')}
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {exerciseName ? tExercise(exerciseName) : ''} · {t('setWord')} {setNumber}
              </p>
            </div>
            <button
              type="button"
              className="btn-icon btn-ghost forma-set-type-close"
              onClick={onClose}
              style={{ color: 'var(--text-secondary)' }}
              aria-label={isRTL ? 'إغلاق' : 'Close'}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Type Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {options.map((opt) => {
              const isSelected = currentType === opt.type;

              return (
                <button
                  key={opt.type}
                  type="button"
                  className="forma-set-type-option"
                  onClick={() => handleSelect(opt.type)}
                  aria-pressed={isSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '16px',
                    background: isSelected ? opt.bg : 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
                    border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    boxShadow: isSelected ? `0 4px 16px ${opt.bg}` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: opt.bg,
                        border: `1px solid ${opt.border}`,
                        color: opt.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        flexShrink: 0
                      }}
                    >
                      {opt.badge}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? opt.color : 'var(--text-primary)' }}>
                          {opt.title}
                        </span>
                        <span style={{ color: opt.color, display: 'flex' }}>
                          {opt.icon}
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {isSelected ? (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: opt.color,
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={15} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid var(--border-highlight)'
                      }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
