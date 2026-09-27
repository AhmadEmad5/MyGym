import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Check, Plus, Minus } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface WorkoutNumberKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialValue: number;
  unit?: string;
  type: 'weight' | 'reps';
  onSave: (value: number) => void;
}

export function WorkoutNumberKeypadModal({
  isOpen,
  onClose,
  title,
  subtitle,
  initialValue,
  unit,
  type,
  onSave
}: WorkoutNumberKeypadModalProps) {
  const { isRTL } = useTranslation();
  const [valStr, setValStr] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setValStr(initialValue > 0 ? String(initialValue) : '');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const currentNum = parseFloat(valStr) || 0;

  const handleDigit = (d: string) => {
    gymAudio.triggerVibration([10]);
    if (d === '.') {
      if (type === 'reps') return; // reps are integers
      if (valStr.includes('.')) return;
      setValStr(prev => (prev === '' ? '0.' : prev + '.'));
    } else {
      // Avoid leading zeroes like 00 or 05 unless decimal
      if (valStr === '0') {
        setValStr(d);
      } else {
        if (valStr.length < 6) {
          setValStr(prev => prev + d);
        }
      }
    }
  };

  const handleBackspace = () => {
    gymAudio.triggerVibration([10]);
    setValStr(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    gymAudio.triggerVibration([12]);
    setValStr('');
  };

  const handleAdjust = (delta: number) => {
    gymAudio.triggerVibration([12]);
    const next = Math.max(0, Math.round((currentNum + delta) * 100) / 100);
    setValStr(next === 0 ? '' : String(next));
  };

  const handleDone = () => {
    gymAudio.triggerSubtleHaptic([25]);
    onSave(currentNum);
    onClose();
  };

  const weightShortcuts = unit === 'lb' ? [2.5, 5, 10, 20] : [1.25, 2.5, 5, 10];
  const repsShortcuts = [1, 2, 5];

  return (
    <AnimatePresence>
      <div 
        className="workout-keypad-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
      >
        <motion.div
          className="workout-keypad-sheet"
          onClick={e => e.stopPropagation()}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#0f172a',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderBottom: 'none',
            padding: '1.25rem 1.25rem calc(1.25rem + max(12px, env(safe-area-inset-bottom, 0px)))',
            boxShadow: '0 -20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            userSelect: 'none',
            touchAction: 'manipulation'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={onClose}
              style={{ padding: '0.4rem', borderRadius: '10px', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Value Display */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: valStr ? 'var(--text-primary)' : 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                {valStr || '0'}
              </span>
              {unit && (
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                  {unit}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isRTL ? 'مسح' : 'Clear'}
            </button>
          </div>

          {/* Quick Increment Shortcuts */}
          <div style={{
            display: 'flex',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '0.2rem'
          }} className="hide-scrollbar">
            {type === 'weight' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleAdjust(unit === 'lb' ? -5 : -2.5)}
                  style={{
                    flex: '1 0 auto',
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Minus size={13} />
                  {unit === 'lb' ? '5' : '2.5'}
                </button>
                {weightShortcuts.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAdjust(val)}
                    style={{
                      flex: '1 0 auto',
                      padding: '0.5rem 0.65rem',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={13} />
                    {val}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleAdjust(-1)}
                  style={{
                    flex: '1 0 auto',
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Minus size={13} /> 1
                </button>
                {repsShortcuts.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAdjust(val)}
                    style={{
                      flex: '1 0 auto',
                      padding: '0.5rem 0.65rem',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={13} /> {val}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Numeric Keypad Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <motion.button
                key={d}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => handleDigit(d)}
                style={{
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.12s'
                }}
              >
                {d}
              </motion.button>
            ))}

            {/* Bottom Row */}
            {type === 'weight' ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => handleDigit('.')}
                style={{
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                .
              </motion.button>
            ) : (
              <div />
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleDigit('0')}
              style={{
                height: '56px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                color: 'var(--text-primary)',
                fontSize: '1.45rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              0
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleBackspace}
              style={{
                height: '56px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Backspace"
            >
              <Delete size={22} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </motion.button>
          </div>

          {/* Confirm Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleDone}
            style={{
              height: '52px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              marginTop: '0.25rem'
            }}
          >
            <Check size={20} />
            <span>{isRTL ? 'تأكيد' : 'Done'}</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
