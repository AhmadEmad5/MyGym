import { useState, useMemo } from 'react';
import { Calculator, Check, Sparkles, Flame, Dumbbell, Target, Droplet } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { calculateBMR, calculateTDEE, NutritionGoals } from '../lib/api';
import { ModalShell, InlineNumberField, FieldError, PrimaryAction, SecondaryAction } from './AIMealVisionModal';

interface TDEECalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIMITS = {
  age: { min: 12, max: 99 },
  weightKg: { min: 25, max: 300 },
  heightCm: { min: 120, max: 240 }
};

export function TDEECalculatorModal({ isOpen, onClose }: TDEECalculatorModalProps) {
  const { data, updateNutritionGoals } = useData();
  const { t, isRTL } = useTranslation();

  const latestWeight = data?.bodyMetrics?.[0]?.weight || 75;

  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('26');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState(String(latestWeight));
  const [activityMultiplier, setActivityMultiplier] = useState('1.55');
  const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>('maintain');
  const [isApplied, setIsApplied] = useState(false);
  const [errors, setErrors] = useState<{ age?: string; weight?: string; height?: string }>({});

  const ageNum = Math.min(LIMITS.age.max, Math.max(LIMITS.age.min, Number(age) || LIMITS.age.min));
  const weightNum = Math.min(LIMITS.weightKg.max, Math.max(LIMITS.weightKg.min, Number(weightKg) || 70));
  const heightNum = Math.min(LIMITS.heightCm.max, Math.max(LIMITS.heightCm.min, Number(heightCm) || 170));
  const activityNum = Number(activityMultiplier) || 1.55;

  const calculation = useMemo(() => {
    const bmr = calculateBMR(gender, weightNum, heightNum, ageNum);
    const macroPlan = calculateTDEE(bmr, activityNum, goal);
    return {
      bmr,
      ...macroPlan,
      water: Math.max(2000, Math.round(weightNum * 35))
    };
  }, [gender, weightNum, heightNum, ageNum, activityNum, goal]);

  const finalGoals: NutritionGoals = useMemo(() => ({
    dailyCalories: calculation.calories,
    dailyProtein: calculation.protein,
    dailyCarbs: calculation.carbs,
    dailyFats: calculation.fats,
    dailyWaterMl: calculation.water
  }), [calculation]);

  const handleApply = async () => {
    const next: typeof errors = {};
    if (!age) next.age = isRTL ? 'العمر مطلوب' : 'Age is required';
    if (!weightKg) next.weight = isRTL ? 'الوزن مطلوب' : 'Weight is required';
    if (!heightCm) next.height = isRTL ? 'الطول مطلوب' : 'Height is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await updateNutritionGoals(finalGoals);
    setIsApplied(true);
    window.setTimeout(() => {
      setIsApplied(false);
      onClose();
    }, 900);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="tdee-modal-title"
      title={t('tdeeCalculator')}
      subtitle={t('tdeeSubtitle')}
      icon={<Calculator size={19} />}
      accent="#43dcff"
      maxWidth={620}
      footer={
        <>
          <SecondaryAction onClick={onClose} fullWidth>{t('cancel')}</SecondaryAction>
          <PrimaryAction onClick={() => void handleApply()} icon={isApplied ? <Check size={18} /> : <Sparkles size={17} />}>
            {isApplied ? t('appliedSuccess') : t('calculateAndApply')}
          </PrimaryAction>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.7rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t('gender')}</span>
          <div role="radiogroup" aria-label={t('gender')} style={{ display: 'flex', gap: '0.4rem' }}>
            {([
              { value: 'male' as const, label: t('male') },
              { value: 'female' as const, label: t('female') }
            ]).map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={gender === option.value}
                onClick={() => setGender(option.value)}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '11px',
                  border: `1px solid ${gender === option.value ? '#43dcff' : 'var(--border-color)'}`,
                  background: gender === option.value ? 'rgba(67, 220, 255, 0.14)' : 'var(--bg-tertiary)',
                  color: gender === option.value ? '#43dcff' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minHeight: 44
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="tdee-age" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t('age')}</label>
          <InlineNumberField
            id="tdee-age"
            label=""
            value={age}
            onChange={value => { setAge(value); if (errors.age) setErrors(prev => ({ ...prev, age: undefined })); }}
            min={LIMITS.age.min}
            max={LIMITS.age.max}
            accent="#43dcff"
            invalid={Boolean(errors.age)}
            describedBy={errors.age ? 'tdee-age-error' : undefined}
            dir="ltr"
            onEnter={() => document.getElementById('tdee-weight')?.focus()}
          />
          {errors.age && <FieldError id="tdee-age-error" message={errors.age} />}
        </div>

        <div>
          <label htmlFor="tdee-weight" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t('weightKg')}</label>
          <InlineNumberField
            id="tdee-weight"
            label=""
            value={weightKg}
            onChange={value => { setWeightKg(value); if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined })); }}
            inputMode="decimal"
            min={LIMITS.weightKg.min}
            max={LIMITS.weightKg.max}
            accent="#43dcff"
            invalid={Boolean(errors.weight)}
            describedBy={errors.weight ? 'tdee-weight-error' : undefined}
            dir="ltr"
            onEnter={() => document.getElementById('tdee-height')?.focus()}
          />
          {errors.weight && <FieldError id="tdee-weight-error" message={errors.weight} />}
        </div>

        <div>
          <label htmlFor="tdee-height" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t('heightCm')}</label>
          <InlineNumberField
            id="tdee-height"
            label=""
            value={heightCm}
            onChange={value => { setHeightCm(value); if (errors.height) setErrors(prev => ({ ...prev, height: undefined })); }}
            min={LIMITS.heightCm.min}
            max={LIMITS.heightCm.max}
            accent="#43dcff"
            invalid={Boolean(errors.height)}
            describedBy={errors.height ? 'tdee-height-error' : undefined}
            dir="ltr"
          />
          {errors.height && <FieldError id="tdee-height-error" message={errors.height} />}
        </div>
      </div>

      <div>
        <label htmlFor="tdee-activity" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{t('activityLevel')}</label>
        <select
          id="tdee-activity"
          className="input"
          value={activityMultiplier}
          onChange={event => setActivityMultiplier(event.target.value)}
          style={{ width: '100%', fontSize: '1rem', minHeight: 46, boxSizing: 'border-box' }}
        >
          <option value="1.2">{t('sedentary')}</option>
          <option value="1.375">{t('lightlyActive')}</option>
          <option value="1.55">{t('moderatelyActive')}</option>
          <option value="1.725">{t('veryActive')}</option>
        </select>
      </div>

      <div>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{t('tdeeFitnessGoal')}</span>
        <div role="radiogroup" aria-label={t('tdeeFitnessGoal')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {([
            { value: 'cut' as const, label: t('cut'), icon: <Flame size={16} /> },
            { value: 'maintain' as const, label: t('maintain'), icon: <Sparkles size={16} /> },
            { value: 'bulk' as const, label: t('bulk'), icon: <Dumbbell size={16} /> }
          ]).map(option => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={goal === option.value}
              onClick={() => setGoal(option.value)}
              style={{
                padding: '0.6rem 0.4rem',
                borderRadius: '12px',
                border: `1px solid ${goal === option.value ? '#43dcff' : 'var(--border-color)'}`,
                background: goal === option.value ? 'rgba(67, 220, 255, 0.14)' : 'var(--bg-tertiary)',
                color: goal === option.value ? '#43dcff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                minHeight: 56
              }}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <section
        aria-label={t('dailyGoals')}
        style={{
          padding: '1rem',
          borderRadius: '16px',
          border: '1px solid rgba(67, 220, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.08), rgba(133, 92, 255, 0.08))'
        }}
      >
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Target size={13} />
          {t('dailyGoals')}
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '0.6rem', marginTop: '0.7rem' }}>
          {([
            { label: t('targetCalories'), value: finalGoals.dailyCalories, unit: 'kcal', color: '#43dcff' },
            { label: t('proteinTarget'), value: finalGoals.dailyProtein, unit: 'g', color: '#f59e0b' },
            { label: t('carbsTarget'), value: finalGoals.dailyCarbs, unit: 'g', color: '#10b981' },
            { label: t('fatsTarget'), value: finalGoals.dailyFats, unit: 'g', color: '#ef4444' }
          ]).map(tile => (
            <div key={tile.label} style={{ padding: '0.7rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>{tile.label}</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 850, color: tile.color, fontVariantNumeric: 'tabular-nums', display: 'block', lineHeight: 1.2 }}>
                {tile.value}
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}> {tile.unit}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.1rem', marginTop: '0.7rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Flame size={12} style={{ color: '#f97316' }} />
            {isRTL ? 'معدل الأيض الأساسي' : 'Basal metabolic rate'}: <strong style={{ color: 'var(--text-primary)' }}>{calculation.bmr} kcal</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Droplet size={12} style={{ color: '#38bdf8' }} />
            {isRTL ? 'هدف الماء' : 'Water target'}: <strong style={{ color: 'var(--text-primary)' }}>{finalGoals.dailyWaterMl.toLocaleString()} ml</strong>
          </span>
        </div>
      </section>
    </ModalShell>
  );
}
