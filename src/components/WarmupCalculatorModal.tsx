import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface WarmupSetItem {
  id: string;
  stageName: string;
  percent: number;
  weight: number;
  reps: number;
  restSec: number;
  description: string;
  selected: boolean;
}

interface WarmupCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  initialWeight: number;
  unit: 'kg' | 'lb';
  onApplyWarmupSets: (warmupSets: { weight: number; repsTarget: number; unit: 'kg' | 'lb'; setType: 'warmup' }[]) => void;
}

export function WarmupCalculatorModal({
  isOpen,
  onClose,
  exerciseName,
  initialWeight,
  unit,
  onApplyWarmupSets
}: WarmupCalculatorModalProps) {
  const { t, isRTL, tExercise } = useTranslation();
  const [workingWeight, setWorkingWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [selectedStages, setSelectedStages] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true
  });

  useEffect(() => {
    if (initialWeight > 0) {
      setWorkingWeight(initialWeight);
    }
  }, [initialWeight]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Round weight to standard gym increments (2.5 kg or 5 lb)
  const roundIncrement = (w: number) => {
    const inc = unit === 'kg' ? 2.5 : 5;
    return Math.max(inc, Math.round(w / inc) * inc);
  };

  const stages: WarmupSetItem[] = useMemo(() => {
    const barWeight = unit === 'kg' ? 20 : 45;
    const w = Math.max(barWeight, workingWeight);

    return [
      {
        id: 'warmup-1',
        stageName: isRTL ? 'المرحلة 1: تهيئة المفاصل' : 'Stage 1: Joint Warmup',
        percent: 40,
        weight: Math.min(barWeight, roundIncrement(w * 0.4)),
        reps: 10,
        restSec: 45,
        description: isRTL ? 'إحماء المفاصل وتنشيط مسار الحركة بدون أي إجهاد' : 'Joint lubrication & groove motor pattern with zero fatigue',
        selected: selectedStages[0] ?? true
      },
      {
        id: 'warmup-2',
        stageName: isRTL ? 'المرحلة 2: تنشيط عصبي' : 'Stage 2: Muscle Activation',
        percent: 60,
        weight: roundIncrement(w * 0.6),
        reps: 5,
        restSec: 60,
        description: isRTL ? 'تنشيط الوحدات الحركية وضخ الدم في العضلات المستهدفة' : 'Recruit motor units and increase muscle blood flow',
        selected: selectedStages[1] ?? true
      },
      {
        id: 'warmup-3',
        stageName: isRTL ? 'المرحلة 3: تهيئة الحمل الثقيل' : 'Stage 3: Heavy Potentiation',
        percent: 78,
        weight: roundIncrement(w * 0.78),
        reps: 3,
        restSec: 90,
        description: isRTL ? 'تحفيز الجهاز العصبي المركزي وتجهيز الأوتار للوزن الأساسي' : 'CNS potentiation to prepare tendons for working weight',
        selected: selectedStages[2] ?? true
      },
      {
        id: 'warmup-4',
        stageName: isRTL ? 'المرحلة 4: قمة التهيئة' : 'Stage 4: Peak Acclimatization',
        percent: 90,
        weight: roundIncrement(w * 0.9),
        reps: 1,
        restSec: 120,
        description: isRTL ? 'تكرار واحد فقط لجعل الوزن الأساسي يشعر بخفة استثنائية' : 'Single rep so working weight feels substantially lighter',
        selected: selectedStages[3] ?? true
      }
    ];
  }, [workingWeight, unit, isRTL, selectedStages]);

  const toggleStage = (index: number) => {
    setSelectedStages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleApply = () => {
    const toApply = stages
      .filter(s => s.selected)
      .map(s => ({
        weight: s.weight,
        repsTarget: s.reps,
        unit,
        setType: 'warmup' as const
      }));

    if (toApply.length > 0) {
      onApplyWarmupSets(toApply);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="modal-card"
          style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl, 20px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-tertiary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.6rem',
                  height: '2.6rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Flame className="w-5 h-5" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  {t('warmupCalculatorTitle')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {tExercise(exerciseName)}
                </p>
              </div>
            </div>

            <button className="btn-icon btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Working Weight Selector */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t('targetWorkingWeight')}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {workingWeight}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {unit}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.85rem' }}
                  onClick={() => setWorkingWeight(prev => Math.max(unit === 'kg' ? 20 : 45, prev - (unit === 'kg' ? 5 : 10)))}
                >
                  <Minus size={16} />
                  <span>{unit === 'kg' ? '-5' : '-10'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.85rem' }}
                  onClick={() => setWorkingWeight(prev => prev + (unit === 'kg' ? 5 : 10))}
                >
                  <Plus size={16} />
                  <span>{unit === 'kg' ? '+5' : '+10'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Warmup Stages List */}
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>{t('warmupScienceTip')}</span>
            </div>

            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                onClick={() => toggleStage(idx)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  backgroundColor: stage.selected ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                  border: `1px solid ${stage.selected ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '1.8rem',
                      height: '1.8rem',
                      borderRadius: '8px',
                      backgroundColor: stage.selected ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${stage.selected ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    {stage.selected && <Check size={14} strokeWidth={3} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stage.stageName}</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171'
                      }}>
                        {stage.percent}%
                      </span>
                    </div>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {stage.weight} {unit}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {stage.reps} {t('repsWord')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              backgroundColor: 'var(--bg-tertiary)'
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('cancel')}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                border: 'none',
                fontWeight: 700
              }}
            >
              <Flame size={16} />
              <span>{t('applyWarmupSetsBtn')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
