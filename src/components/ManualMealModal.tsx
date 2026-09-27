import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Utensils, X, Check, Flame, Sparkles } from 'lucide-react';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

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
  { type: 'snack', labelKey: 'snack', icon: '🍎' },
];

export function ManualMealModal({
  isOpen,
  onClose,
  onSave,
  initialMeal
}: ManualMealModalProps) {
  const { t, isRTL } = useTranslation();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  }, [initialMeal, isOpen]);

  if (!isOpen) return null;

  // Auto-estimate calories from macros: (P * 4) + (C * 4) + (F * 9)
  const handleAutoCalcCalories = () => {
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fats) || 0;
    if (p > 0 || c > 0 || f > 0) {
      const estimated = Math.round(p * 4 + c * 4 + f * 9);
      setCalories(String(estimated));
      gymAudio.triggerSubtleHaptic([20]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(isRTL ? 'يرجى كتابة اسم الوجبة' : 'Please enter a meal title');
      return;
    }

    const cal = parseInt(calories, 10) || 0;
    const pro = parseInt(protein, 10) || 0;
    const carb = parseInt(carbs, 10) || 0;
    const fat = parseInt(fats, 10) || 0;

    gymAudio.triggerSubtleHaptic([30, 50]);
    gymAudio.playSetCompleteChime();

    const mealPayload = {
      ...(initialMeal?.id ? { id: initialMeal.id } : {}),
      date: initialMeal?.date || new Date().toISOString(),
      mealType,
      title: cleanTitle,
      calories: cal,
      protein: pro,
      carbs: carb,
      fats: fat,
      description: description.trim() || undefined,
      imageUrl: initialMeal?.imageUrl
    };

    onSave(mealPayload as any);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="card"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 26, 0.99))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(16, 185, 129, 0.2)',
            padding: '1.5rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Utensils size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  {initialMeal 
                    ? (isRTL ? 'تعديل بيانات الوجبة' : 'Edit Meal') 
                    : (isRTL ? 'تسجيل وجبة يدوياً' : 'Log Meal Manually')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isRTL ? 'أدخل السعرات والماكروز مباشرة دون الحاجة للذكاء الاصطناعي' : 'Direct manual entry for instant logging'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Meal Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {isRTL ? 'اسم الوجبة' : 'Meal Name'} *
              </label>
              <input
                type="text"
                className="input"
                placeholder={isRTL ? 'مثال: أرز مع صدور دجاج مشوية' : 'e.g., Grilled Chicken & Rice'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                style={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}
              />
            </div>

            {/* Meal Type Tabs */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {t('mealType')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {MEAL_TYPES.map(m => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMealType(m.type)}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '10px',
                      border: mealType === m.type ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: mealType === m.type ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      color: mealType === m.type ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: mealType === m.type ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '1.05rem' }}>{m.icon}</span>
                    <span>{t(m.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calories (with auto-calc badge) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Flame size={15} />
                  <span>{isRTL ? 'السعرات الحرارية (kcal)' : 'Calories (kcal)'}</span>
                </label>
                {(protein || carbs || fats) && (
                  <button
                    type="button"
                    onClick={handleAutoCalcCalories}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Estimate from macros"
                  >
                    <Sparkles size={11} />
                    <span>{isRTL ? 'احسب من الماكروز' : 'Auto-calc from macros'}</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                placeholder="450"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                style={{ width: '100%', borderRadius: '12px', fontWeight: 800, fontSize: '1.05rem' }}
              />
            </div>

            {/* 3-Macro Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {/* Protein */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', marginBottom: '0.25rem' }}>
                  🥩 {t('protein')} (g)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  placeholder="35"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  style={{ width: '100%', borderRadius: '10px', textAlign: 'center', fontWeight: 700, color: '#06b6d4' }}
                />
              </div>

              {/* Carbs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' }}>
                  ⚡ {t('carbs')} (g)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  placeholder="50"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  style={{ width: '100%', borderRadius: '10px', textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}
                />
              </div>

              {/* Fats */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', marginBottom: '0.25rem' }}>
                  🥑 {t('fats')} (g)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  placeholder="12"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  style={{ width: '100%', borderRadius: '10px', textAlign: 'center', fontWeight: 700, color: '#ec4899' }}
                />
              </div>
            </div>

            {/* Notes / Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {isRTL ? 'ملاحظات أو مكونات الوجبة (اختياري)' : 'Ingredients or notes (optional)'}
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder={isRTL ? 'مثال: 200 جرام صدر دجاج، 150 جرام أرز بسمتي' : 'e.g., 200g chicken, 150g rice'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', resize: 'vertical' }}
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ flex: 1, borderRadius: '12px', padding: '0.75rem', fontWeight: 700 }}
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  flex: 2,
                  borderRadius: '12px',
                  padding: '0.75rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#041316',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check size={18} />
                <span>{initialMeal ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'تسجيل الوجبة' : 'Log Meal')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
