import { useState, useEffect, useRef, useCallback } from 'react';
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

const WEIGHT_UNITS = ['kg', 'lb'] as const;

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
  const { isRTL, t } = useTranslation();
  const [valStr, setValStr] = useState<string>('');
  const [activeUnit, setActiveUnit] = useState<string>(unit || 'kg');
  const [announcement, setAnnouncement] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValStr(initialValue > 0 ? String(initialValue) : '');
      setActiveUnit(unit || 'kg');
      setAnnouncement('');
    }
  }, [isOpen, initialValue, unit]);

  const currentNum = useCallback(() => parseFloat(valStr) || 0, [valStr]);

  const describe = useCallback((value: string) => {
    const parsed = parseFloat(value) || 0;
    if (type === 'reps') {
      return isRTL ? `${parsed} تكرار` : `${parsed} ${parsed === 1 ? 'rep' : 'reps'}`;
    }
    return isRTL ? `${parsed} ${activeUnit}` : `${parsed} ${activeUnit}`;
  }, [type, activeUnit, isRTL]);

  const announce = useCallback((message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 40);
  }, []);

  const handleDigit = useCallback((d: string) => {
    gymAudio.triggerVibration([10]);
    setValStr(prev => {
      let next = prev;
      if (d === '.') {
        if (type === 'reps') return prev;
        if (prev.includes('.')) return prev;
        next = prev === '' ? '0.' : prev + '.';
      } else if (prev === '0') {
        next = d;
      } else if (prev.length < 6) {
        next = prev + d;
      }
      announce(describe(next));
      return next;
    });
  }, [type, announce, describe]);

  const handleBackspace = useCallback(() => {
    gymAudio.triggerVibration([10]);
    setValStr(prev => {
      const next = prev.slice(0, -1);
      announce(next ? describe(next) : (isRTL ? 'تم المسح' : 'Cleared'));
      return next;
    });
  }, [announce, describe, isRTL]);

  const handleClear = useCallback(() => {
    gymAudio.triggerVibration([12]);
    setValStr('');
    announce(isRTL ? 'تم المسح' : 'Cleared');
  }, [announce, isRTL]);

  const handleAdjust = useCallback((delta: number) => {
    gymAudio.triggerVibration([12]);
    const next = Math.max(0, Math.round((currentNum() + delta) * 100) / 100);
    setValStr(next === 0 ? '' : String(next));
    announce(describe(String(next)));
  }, [announce, currentNum, describe]);

  const handleUnitChange = useCallback((nextUnit: string) => {
    gymAudio.triggerVibration([12]);
    setActiveUnit(nextUnit);
    announce(isRTL ? `الوحدة ${nextUnit}` : `Unit ${nextUnit}`);
  }, [announce, isRTL]);

  const handleDone = useCallback(() => {
    gymAudio.triggerSubtleHaptic([25]);
    onSave(currentNum());
    onClose();
  }, [onSave, onClose, currentNum]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unitSuffix = type === 'reps' ? (isRTL ? 'تكرار' : 'reps') : activeUnit;
  const weightShortcuts = activeUnit === 'lb' ? [2.5, 5, 10, 20] : [1.25, 2.5, 5, 10];
  const repsShortcuts = [1, 2, 5];
  const entryLabel = isRTL
    ? (type === 'reps' ? 'إدخال عدد التكرارات' : 'إدخال الوزن')
    : (type === 'reps' ? 'Entering repetitions' : 'Entering weight');

  return (
    <div
      className="portal-modal-backdrop"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999
      }}
    >
      <AnimatePresence>
        <motion.div
          ref={sheetRef}
          className="forma-keypad-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={e => e.stopPropagation()}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-cyan)'
                }}
              >
                {entryLabel}
              </p>
              <h3 style={{ margin: '0.1rem 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
              className="session-target session-target-ghost"
              onClick={onClose}
              aria-label={isRTL ? 'إغلاق' : 'Close'}
              style={{ minWidth: '48px', minHeight: '48px', padding: 0, flexShrink: 0 }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="forma-keypad-value">
            <strong aria-hidden="true">{valStr || '0'}</strong>
            <span aria-hidden="true">{unitSuffix}</span>
            <span className="forma-sr-only">{describe(valStr)}</span>
          </div>

          <span className="forma-sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
            {type === 'weight' ? (
              <div className="forma-unit-toggle" role="group" aria-label={isRTL ? 'وحدة الوزن' : 'Weight unit'}>
                {WEIGHT_UNITS.map(candidate => (
                  <button
                    key={candidate}
                    type="button"
                    aria-pressed={activeUnit === candidate}
                    onClick={() => handleUnitChange(candidate)}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('reps')}
              </span>
            )}

            <button
              type="button"
              className="forma-3d-chip"
              onClick={handleClear}
              style={{ minHeight: '44px' }}
            >
              {isRTL ? 'مسح الكل' : 'Clear all'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }} role="group" aria-label={isRTL ? 'تعديل سريع' : 'Quick adjust'}>
            <button
              type="button"
              className="forma-keypad-key is-muted"
              style={{ flex: 1, borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)', color: 'var(--danger)' }}
              onClick={() => handleAdjust(type === 'reps' ? -1 : (activeUnit === 'lb' ? -5 : -2.5))}
            >
              <Minus size={16} aria-hidden="true" />
              <span className="forma-sr-only">{isRTL ? 'إنقاص' : 'Decrease'}</span>
              {type === 'reps' ? 1 : (activeUnit === 'lb' ? 5 : 2.5)}
            </button>
            {(type === 'weight' ? weightShortcuts : repsShortcuts).map(step => (
              <button
                key={step}
                type="button"
                className="forma-keypad-key is-muted"
                style={{ flex: 1 }}
                onClick={() => handleAdjust(step)}
              >
                <Plus size={16} aria-hidden="true" />
                {step}
              </button>
            ))}
          </div>

          <div className="forma-keypad-grid" role="group" aria-label={isRTL ? 'لوحة الأرقام' : 'Number pad'}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                type="button"
                className="forma-keypad-key"
                onClick={() => handleDigit(d)}
              >
                {d}
              </button>
            ))}

            {type === 'weight' ? (
              <button
                type="button"
                className="forma-keypad-key"
                onClick={() => handleDigit('.')}
                aria-label={isRTL ? 'فاصلة عشرية' : 'Decimal point'}
              >
                .
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            <button
              type="button"
              className="forma-keypad-key"
              onClick={() => handleDigit('0')}
            >
              0
            </button>

            <button
              type="button"
              className="forma-keypad-key is-muted"
              onClick={handleBackspace}
              aria-label={isRTL ? 'حذف' : 'Backspace'}
            >
              <Delete size={24} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="session-target session-target-success"
            onClick={handleDone}
            style={{ width: '100%', minHeight: '60px', fontSize: '1.05rem' }}
          >
            <Check size={20} aria-hidden="true" />
            <span>
              {isRTL ? `حفظ ${describe(valStr)}` : `Save ${describe(valStr)}`}
            </span>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
