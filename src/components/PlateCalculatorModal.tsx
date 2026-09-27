import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Check, Plus, Minus, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../lib/i18n';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialUnit?: 'kg' | 'lb';
  unit?: 'kg' | 'lb';
  onApply?: (weight: number, unit: 'kg' | 'lb') => void;
}

interface PlateConfig {
  weight: number;
  color: string;
  textColor: string;
  heightPercent: number;
}

const KG_PLATES: PlateConfig[] = [
  { weight: 25, color: '#ef4444', textColor: '#ffffff', heightPercent: 95 },
  { weight: 20, color: '#3b82f6', textColor: '#ffffff', heightPercent: 95 },
  { weight: 15, color: '#eab308', textColor: '#000000', heightPercent: 82 },
  { weight: 10, color: '#10b981', textColor: '#ffffff', heightPercent: 72 },
  { weight: 5, color: '#f8fafc', textColor: '#0f172a', heightPercent: 58 },
  { weight: 2.5, color: '#475569', textColor: '#ffffff', heightPercent: 46 },
  { weight: 1.25, color: '#94a3b8', textColor: '#0f172a', heightPercent: 36 }
];

const LB_PLATES: PlateConfig[] = [
  { weight: 45, color: '#3b82f6', textColor: '#ffffff', heightPercent: 95 },
  { weight: 35, color: '#eab308', textColor: '#000000', heightPercent: 84 },
  { weight: 25, color: '#10b981', textColor: '#ffffff', heightPercent: 74 },
  { weight: 10, color: '#f8fafc', textColor: '#0f172a', heightPercent: 60 },
  { weight: 5, color: '#475569', textColor: '#ffffff', heightPercent: 48 },
  { weight: 2.5, color: '#94a3b8', textColor: '#0f172a', heightPercent: 38 }
];

export function PlateCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 60,
  initialUnit,
  unit = 'kg',
  onApply
}: PlateCalculatorModalProps) {
  const { t, isRTL } = useTranslation();

  const defaultUnit = initialUnit || unit;
  const [activeUnit, setActiveUnit] = useState<'kg' | 'lb'>(defaultUnit);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight || (defaultUnit === 'kg' ? 60 : 135));
  const [barWeight, setBarWeight] = useState<number>(defaultUnit === 'kg' ? 20 : 45);

  useEffect(() => {
    if (isOpen) {
      const u = initialUnit || unit;
      setActiveUnit(u);
      setTargetWeight(initialWeight && initialWeight > 0 ? initialWeight : (u === 'kg' ? 60 : 135));
      setBarWeight(u === 'kg' ? 20 : 45);
    }
  }, [isOpen, initialWeight, initialUnit, unit]);

  const availablePlates = activeUnit === 'kg' ? KG_PLATES : LB_PLATES;

  // Calculate plates per side
  const calculation = useMemo(() => {
    const weightToDistribute = Math.max(0, targetWeight - barWeight);
    let perSide = weightToDistribute / 2;

    const platesCount: Record<number, number> = {};
    const orderedPlates: PlateConfig[] = [];

    availablePlates.forEach(p => {
      if (perSide >= p.weight) {
        const count = Math.floor(perSide / p.weight);
        platesCount[p.weight] = count;
        perSide = Number((perSide - count * p.weight).toFixed(2));
        for (let i = 0; i < count; i++) {
          orderedPlates.push(p);
        }
      }
    });

    const perSideTotal = Object.entries(platesCount).reduce((acc, [w, c]) => acc + Number(w) * c, 0);
    const actualLoaded = barWeight + perSideTotal * 2;
    const remainder = Number(perSide.toFixed(2));

    return {
      platesCount,
      orderedPlates,
      perSideTotal,
      actualLoaded,
      remainder
    };
  }, [targetWeight, barWeight, availablePlates]);

  if (!isOpen) return null;

  const barOptions = activeUnit === 'kg' 
    ? [
        { label: t('olympicBar'), weight: 20 },
        { label: t('womensBar'), weight: 15 },
        { label: t('ezBar'), weight: 10 },
        { label: t('noBar'), weight: 0 }
      ]
    : [
        { label: 'Olympic Bar (45 lb)', weight: 45 },
        { label: 'Women’s Bar (35 lb)', weight: 35 },
        { label: 'EZ Curl Bar (25 lb)', weight: 25 },
        { label: 'No Bar (0 lb)', weight: 0 }
      ];

  const quickIncrements = activeUnit === 'kg' ? [1.25, 2.5, 5, 10] : [2.5, 5, 10, 25];

  return createPortal(
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-secondary, #131824)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                padding: '0.45rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.2))',
                color: '#38bdf8',
                display: 'flex'
              }}>
                <Dumbbell size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {t('plateCalculator')}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('exactPlatesNeeded')} ({activeUnit})
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={onClose}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Target Weight & Adjustments */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('targetWeight')}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setTargetWeight(w => Math.max(barWeight, Number((w - (activeUnit === 'kg' ? 2.5 : 5)).toFixed(2))))}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <input
                    type="number"
                    step={activeUnit === 'kg' ? '0.5' : '1'}
                    value={targetWeight}
                    onChange={e => setTargetWeight(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '130px',
                      textAlign: 'center',
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-primary, #38bdf8)',
                      outline: 'none',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {activeUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTargetWeight(w => Number((w + (activeUnit === 'kg' ? 2.5 : 5)).toFixed(2)))}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick increment chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {quickIncrements.map(inc => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setTargetWeight(w => Number((w + inc * 2).toFixed(2)))}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    +{inc * 2} {activeUnit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTargetWeight(barWeight)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Reset to bar only"
                >
                  <RotateCcw size={12} />
                  <span>{isRTL ? 'البار فقط' : 'Bar only'}</span>
                </button>
              </div>
            </div>

            {/* Visual Barbell Graphic */}
            <div style={{
              background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('platesEachSide')} ({calculation.perSideTotal} {activeUnit})
              </span>

              {/* Barbell Sleeve Graphic */}
              <div style={{
                width: '100%',
                maxWidth: '420px',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Center Bar shaft */}
                <div style={{
                  position: 'absolute',
                  width: '95%',
                  height: '14px',
                  background: 'linear-gradient(180deg, #94a3b8 0%, #475569 50%, #334155 100%)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }} />

                {/* Left side plates */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  width: '45%',
                  height: '100%',
                  paddingRight: '18px',
                  gap: '2px',
                  zIndex: 2
                }}>
                  {calculation.orderedPlates.slice().reverse().map((plate, idx) => (
                    <motion.div
                      key={`left-${idx}`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      style={{
                        width: '18px',
                        height: `${plate.heightPercent}%`,
                        background: `linear-gradient(180deg, ${plate.color}, ${plate.color}dd)`,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        color: plate.textColor,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        userSelect: 'none'
                      }}
                    >
                      {plate.weight}
                    </motion.div>
                  ))}
                </div>

                {/* Bar Center Collar */}
                <div style={{
                  width: '24px',
                  height: '70px',
                  background: 'linear-gradient(180deg, #cbd5e1 0%, #64748b 50%, #475569 100%)',
                  borderRadius: '4px',
                  zIndex: 3,
                  boxShadow: '0 0 10px rgba(0,0,0,0.6)'
                }} />

                {/* Right side plates */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '45%',
                  height: '100%',
                  paddingLeft: '18px',
                  gap: '2px',
                  zIndex: 2
                }}>
                  {calculation.orderedPlates.map((plate, idx) => (
                    <motion.div
                      key={`right-${idx}`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      style={{
                        width: '18px',
                        height: `${plate.heightPercent}%`,
                        background: `linear-gradient(180deg, ${plate.color}, ${plate.color}dd)`,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        color: plate.textColor,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        userSelect: 'none'
                      }}
                    >
                      {plate.weight}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Textual list of plates each side */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {Object.keys(calculation.platesCount).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isRTL ? 'البار فارغ بدون أطباق' : 'Empty barbell (no plates)'}
                  </span>
                ) : (
                  Object.entries(calculation.platesCount).map(([w, c]) => {
                    const cfg = availablePlates.find(p => p.weight === Number(w));
                    return (
                      <div
                        key={w}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${cfg?.color || 'rgba(255,255,255,0.1)'}`,
                          fontSize: '0.78rem'
                        }}
                      >
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: cfg?.color || 'white'
                        }} />
                        <strong>{c} × {w} {activeUnit}</strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Barbell Weight Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                {t('barWeight')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {barOptions.map(opt => (
                  <button
                    key={opt.weight}
                    type="button"
                    onClick={() => setBarWeight(opt.weight)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      background: barWeight === opt.weight ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                      border: barWeight === opt.weight ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: barWeight === opt.weight ? '#38bdf8' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Loaded Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  {t('totalLoaded')}
                </span>
                <strong style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 800 }}>
                  {calculation.actualLoaded} {activeUnit}
                </strong>
              </div>

              {onApply && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onApply(calculation.actualLoaded, activeUnit);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <Check size={16} />
                  <span>{t('applyToSet')}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
