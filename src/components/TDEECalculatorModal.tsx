import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Sparkles, Check, Flame, Dumbbell } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { calculateBMR, calculateTDEE, NutritionGoals } from '../lib/api';

interface TDEECalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TDEECalculatorModal({ isOpen, onClose }: TDEECalculatorModalProps) {
  const { data, updateNutritionGoals } = useData();
  const { t, isRTL } = useTranslation();

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

  // Load defaults from existing logs if available
  const latestWeight = data?.bodyMetrics?.[0]?.weight || 75;

  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(26);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(latestWeight);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55); // Moderate
  const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>('maintain');
  const [isApplied, setIsApplied] = useState(false);

  // Calculate results on the fly
  const calculation = useMemo(() => {
    const bmr = calculateBMR(gender, weightKg, heightCm, age);
    const macroPlan = calculateTDEE(bmr, activityMultiplier, goal);
    const recommendedWater = Math.round(weightKg * 35); // 35ml per kg of body weight
    return {
      bmr,
      ...macroPlan,
      water: Math.max(2000, recommendedWater)
    };
  }, [gender, weightKg, heightCm, age, activityMultiplier, goal]);

  const finalGoals: NutritionGoals = useMemo(() => ({
    dailyCalories: calculation.calories,
    dailyProtein: calculation.protein,
    dailyCarbs: calculation.carbs,
    dailyFats: calculation.fats,
    dailyWaterMl: calculation.water
  }), [calculation]);

  const handleApply = async () => {
    await updateNutritionGoals(finalGoals);
    setIsApplied(true);
    setTimeout(() => {
      setIsApplied(false);
      onClose();
    }, 900);
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="modal-card"
          style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 20px)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl, 22px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
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
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.2), rgba(133, 92, 255, 0.2))',
                  border: '1px solid rgba(67, 220, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Calculator className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {t('tdeeCalculator')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('tdeeSubtitle')}
                </p>
              </div>
            </div>

            <button className="btn-icon btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Input fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{t('gender')}</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`btn ${gender === 'male' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    onClick={() => setGender('male')}
                  >
                    {t('male')}
                  </button>
                  <button
                    type="button"
                    className={`btn ${gender === 'female' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    onClick={() => setGender('female')}
                  >
                    {t('female')}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{t('age')}</label>
                <input
                  type="number"
                  className="input"
                  style={{ width: '100%' }}
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 20)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{t('weightKg')}</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  style={{ width: '100%' }}
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 70)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{t('heightCm')}</label>
                <input
                  type="number"
                  className="input"
                  style={{ width: '100%' }}
                  value={heightCm}
                  onChange={e => setHeightCm(parseInt(e.target.value) || 170)}
                />
              </div>
            </div>

            {/* Activity Level Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {t('activityLevel')}
              </label>
              <select
                className="input"
                style={{ width: '100%', padding: '0.5rem' }}
                value={activityMultiplier}
                onChange={e => setActivityMultiplier(parseFloat(e.target.value))}
              >
                <option value={1.2}>{t('sedentary')}</option>
                <option value={1.375}>{t('lightlyActive')}</option>
                <option value={1.55}>{t('moderatelyActive')}</option>
                <option value={1.725}>{t('veryActive')}</option>
              </select>
            </div>

            {/* Goal Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {t('tdeeFitnessGoal')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${goal === 'cut' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                  onClick={() => setGoal('cut')}
                >
                  <Flame className="w-4 h-4" />
                  <span>{t('cut')}</span>
                </button>
                <button
                  type="button"
                  className={`btn ${goal === 'maintain' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                  onClick={() => setGoal('maintain')}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('maintain')}</span>
                </button>
                <button
                  type="button"
                  className={`btn ${goal === 'bulk' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                  onClick={() => setGoal('bulk')}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>{t('bulk')}</span>
                </button>
              </div>
            </div>

            {/* Calculated Plan Output Display */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '16px',
                border: '1px solid rgba(67, 220, 255, 0.3)',
                background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.08), rgba(133, 92, 255, 0.08))'
              }}
            >
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 700 }}>
                {t('dailyGoals')}
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('targetCalories')}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                    {finalGoals.dailyCalories} <span style={{ fontSize: '0.75rem' }}>kcal</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('proteinTarget')}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {finalGoals.dailyProtein} <span style={{ fontSize: '0.75rem' }}>g</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('carbsTarget')}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                    {finalGoals.dailyCarbs} <span style={{ fontSize: '0.75rem' }}>g</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('fatsTarget')}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem' }}>
                    {finalGoals.dailyFats} <span style={{ fontSize: '0.75rem' }}>g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onClick={handleApply}
            >
              {isApplied ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              <span>{isApplied ? t('appliedSuccess') : t('calculateAndApply')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
