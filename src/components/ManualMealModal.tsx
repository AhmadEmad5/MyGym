import { useState, useEffect, useCallback } from 'react';
import { Utensils, Check, Flame, Sparkles, RotateCcw } from 'lucide-react';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import {
  ModalShell, InlineNumberField, UnitToggle, FieldError, PrimaryAction, SecondaryAction,
  massToGrams, gramsToMass, energyToKcal, kcalToEnergy, type MassUnit, type EnergyUnit
} from './AIMealVisionModal';

interface ManualMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<MealRecord, 'id'> | MealRecord) => void;
  initialMeal?: MealRecord | null;
}

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: '🍳' },
  { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
  { type: 'dinner', labelKey: 'dinner', icon: '🥩' },
  { type: 'snack', labelKey: 'snack', icon: '🍎' }
];

const MACRO_FIELDS = [
  { key: 'protein' as const, labelKey: 'protein' as TranslationKey, icon: '🥩', color: '#06b6d4' },
  { key: 'carbs' as const, labelKey: 'carbs' as TranslationKey, icon: '⚡', color: '#f59e0b' },
  { key: 'fats' as const, labelKey: 'fats' as TranslationKey, icon: '🥑', color: '#ec4899' }
];

export function ManualMealModal({ isOpen, onClose, onSave, initialMeal }: ManualMealModalProps) {
  const { t, isRTL } = useTranslation();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [description, setDescription] = useState('');
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>('kcal');
  const [massUnit, setMassUnit] = useState<MassUnit>('g');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [macroError, setMacroError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMeal) {
      setTitle(initialMeal.title || '');
      setMealType(initialMeal.mealType || 'lunch');
      setCalories(initialMeal.calories ? String(initialMeal.calories) : '');
      setProtein(initialMeal.protein ? String(initialMeal.protein) : '');
      setCarbs(initialMeal.carbs ? String(initialMeal.carbs) : '');
      setFats(initialMeal.fats ? String(initialMeal.fats) : '');
      setDescription(initialMeal.description || '');
    } else {
      setTitle('');
      setMealType('lunch');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setDescription('');
    }
    setEnergyUnit('kcal');
    setMassUnit('g');
    setTitleError(null);
    setMacroError(null);
  }, [initialMeal, isOpen]);

  const derivedKcal = Math.round(
    (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fats) || 0) * 9
  );

  const applyAutoCalc = useCallback(() => {
    if (derivedKcal <= 0) return;
    setCalories(String(Math.round(kcalToEnergy(derivedKcal, energyUnit))));
    gymAudio.triggerSubtleHaptic([20]);
  }, [derivedKcal, energyUnit]);

  const convertEnergy = (next: EnergyUnit) => {
    if (next === energyUnit) return;
    const kcal = energyToKcal(Number(calories) || 0, energyUnit);
    setEnergyUnit(next);
    setCalories(String(Math.round(kcalToEnergy(kcal, next))));
  };

  const convertMass = (next: MassUnit) => {
    if (next === massUnit) return;
    const convert = (raw: string) => {
      const grams = massToGrams(Number(raw) || 0, massUnit);
      const converted = gramsToMass(grams, next);
      return String(Math.round(converted * 10) / 10);
    };
    setMassUnit(next);
    setProtein(convert(protein));
    setCarbs(convert(carbs));
    setFats(convert(fats));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError(isRTL ? 'اكتب اسم الوجبة لتتمكن من تمييزها لاحقاً' : 'Name the meal so you can spot it later');
      document.getElementById('manual-meal-title')?.focus();
      return;
    }

    const p = Number(protein) || 0;
    const c = Number(carbs) || 0;
    const f = Number(fats) || 0;
    if (p === 0 && c === 0 && f === 0) {
      setMacroError(isRTL ? 'أدخل سعراً واحداً على الأقل' : 'Enter at least one macro value');
      document.getElementById('manual-protein')?.focus();
      return;
    }

    setTitleError(null);
    setMacroError(null);

    const kcal = energyToKcal(Number(calories) || 0, energyUnit);
    const proteinGrams = massToGrams(p, massUnit);
    const carbsGrams = massToGrams(c, massUnit);
    const fatsGrams = massToGrams(f, massUnit);

    gymAudio.triggerSubtleHaptic([30, 50]);
    gymAudio.playSetCompleteChime();

    onSave({
      ...(initialMeal?.id ? { id: initialMeal.id } : {}),
      date: initialMeal?.date || new Date().toISOString(),
      mealType,
      title: cleanTitle,
      calories: Math.max(0, Math.round(kcal)),
      protein: Math.max(0, Math.round(proteinGrams * 10) / 10),
      carbs: Math.max(0, Math.round(carbsGrams * 10) / 10),
      fats: Math.max(0, Math.round(fatsGrams * 10) / 10),
      description: description.trim() || undefined,
      imageUrl: initialMeal?.imageUrl
    } as Omit<MealRecord, 'id'>);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="manual-meal-title-heading"
      title={initialMeal
        ? (isRTL ? 'تعديل بيانات الوجبة' : 'Edit meal')
        : (isRTL ? 'تسجيل وجبة يدوياً' : 'Log a meal manually')}
      subtitle={isRTL ? 'أدخل القيم من العبوة أو من تطبيق آخر — نطبّق التحويل تلقائياً' : 'Type the values from the label or another app — units convert automatically'}
      icon={<Utensils size={19} />}
      accent="#10b981"
      maxWidth={480}
      footer={
        <>
          <SecondaryAction onClick={onClose} fullWidth>{t('cancel')}</SecondaryAction>
          <PrimaryAction type="submit" form="manual-meal-form" icon={<Check size={18} />}>
            {initialMeal ? (isRTL ? 'حفظ التعديلات' : 'Save changes') : (isRTL ? 'تسجيل الوجبة' : 'Log meal')}
          </PrimaryAction>
        </>
      }
    >
      <form id="manual-meal-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div>
          <label htmlFor="manual-meal-title" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {isRTL ? 'اسم الوجبة' : 'Meal name'} <span aria-hidden="true" style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            id="manual-meal-title"
            type="text"
            value={title}
            onChange={event => {
              setTitle(event.target.value);
              if (titleError) setTitleError(null);
            }}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'manual-meal-title-error' : undefined}
            placeholder={isRTL ? 'مثال: أرز مع صدور دجاج مشوية' : 'e.g., Grilled chicken & rice'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '12px',
              border: `1px solid ${titleError ? '#f87171' : 'var(--border-color)'}`,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              padding: '0.7rem 0.85rem',
              outline: 'none'
            }}
          />
          {titleError && <FieldError id="manual-meal-title-error" message={titleError} />}
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{t('mealType')}</span>
          <div role="radiogroup" aria-label={t('mealType')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
            {MEAL_TYPES.map(item => (
              <button
                key={item.type}
                type="button"
                role="radio"
                aria-checked={mealType === item.type}
                onClick={() => setMealType(item.type)}
                style={{
                  padding: '0.5rem 0.2rem',
                  borderRadius: '10px',
                  border: `1px solid ${mealType === item.type ? '#10b981' : 'var(--border-color)'}`,
                  background: mealType === item.type ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-tertiary)',
                  color: mealType === item.type ? '#10b981' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: mealType === item.type ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15rem',
                  minHeight: 50
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <UnitToggle
            id="manual-energy-unit"
            label={isRTL ? 'وحدة الطاقة' : 'Energy unit'}
            value={energyUnit}
            onChange={convertEnergy}
            options={[{ value: 'kcal', label: 'kcal' }, { value: 'kJ', label: 'kJ' }]}
          />
          <UnitToggle
            id="manual-mass-unit"
            label={isRTL ? 'وحدة الوزن' : 'Weight unit'}
            value={massUnit}
            onChange={convertMass}
            options={[{ value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }]}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 800, color: '#f97316' }}>
              <Flame size={15} />
              {isRTL ? 'السعرات الحرارية' : 'Calories'}
            </span>
            {derivedKcal > 0 && (
              <button
                type="button"
                onClick={applyAutoCalc}
                style={{ background: 'transparent', border: 'none', color: '#06b6d4', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: 30 }}
              >
                <Sparkles size={12} />
                {isRTL ? `احسب من الماكروز (${derivedKcal})` : `Auto-calc from macros (${derivedKcal})`}
              </button>
            )}
          </div>
          <InlineNumberField
            id="manual-calories"
            label=""
            value={calories}
            onChange={setCalories}
            suffix={energyUnit}
            accent="#f97316"
            wide
            dir="ltr"
            onEnter={() => document.getElementById('manual-protein')?.focus()}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {MACRO_FIELDS.map((field, index) => (
            <InlineNumberField
              key={field.key}
              id={`manual-${field.key}`}
              label={`${field.icon} ${t(field.labelKey)}`}
              value={index === 0 ? protein : index === 1 ? carbs : fats}
              onChange={value => {
                if (macroError) setMacroError(null);
                if (index === 0) setProtein(value);
                else if (index === 1) setCarbs(value);
                else setFats(value);
              }}
              suffix={massUnit}
              accent={field.color}
              inputMode="decimal"
              max={2000}
              dir="ltr"
              invalid={Boolean(macroError)}
              describedBy={macroError ? 'manual-macro-error' : undefined}
              onEnter={() => {
                if (index === 0) document.getElementById('manual-carbs')?.focus();
                else if (index === 1) document.getElementById('manual-fats')?.focus();
                else document.getElementById('manual-notes')?.focus();
              }}
            />
          ))}
        </div>
        {macroError && <FieldError id="manual-macro-error" message={macroError} />}

        <div>
          <label htmlFor="manual-notes" style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 700 }}>
            {isRTL ? 'المكونات أو ملاحظات (اختياري)' : 'Ingredients or notes (optional)'}
          </label>
          <textarea
            id="manual-notes"
            className="input"
            rows={2}
            placeholder={isRTL ? 'مثال: 200 جم صدر دجاج، 150 جم أرز' : 'e.g., 200g chicken breast, 150g basmati'}
            value={description}
            onChange={event => setDescription(event.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', borderRadius: '10px', resize: 'vertical' }}
          />
        </div>

        {(title || calories || protein || carbs || fats) && (
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setCalories('');
              setProtein('');
              setCarbs('');
              setFats('');
              setDescription('');
              setTitleError(null);
              setMacroError(null);
              document.getElementById('manual-meal-title')?.focus();
            }}
            style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', minHeight: 30 }}
          >
            <RotateCcw size={12} />
            {isRTL ? 'مسح الحقول' : 'Clear fields'}
          </button>
        )}
      </form>
    </ModalShell>
  );
}
