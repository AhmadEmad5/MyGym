import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Utensils, Camera, Sparkles, Trash2, CheckCircle2,
  Clock, Calculator, Plus, Edit3, Barcode, Copy, CopyPlus,
  ChevronDown, Wand2
} from 'lucide-react';
import { isSameDay, format, parse } from 'date-fns';
import { useData } from '../hooks/useData';
import { MealRecord, MealType, estimateWorkoutCalories, DEFAULT_NUTRITION_GOALS } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { Button, Badge, Hint, PageSkeleton } from '../components/ui';
import { TDEECalculatorModal } from '../components/TDEECalculatorModal';
import { AIMealVisionModal, InlineNumberField, UnitToggle, FieldError, PrimaryAction, SecondaryAction, massToGrams, gramsToMass, energyToKcal, kcalToEnergy, type MassUnit, type EnergyUnit } from '../components/AIMealVisionModal';
import { BarcodeFoodScannerModal } from '../components/BarcodeFoodScannerModal';
import { ManualMealModal } from '../components/ManualMealModal';
import { InteractiveHydrationWaveCard } from '../components/InteractiveHydrationWaveCard';
import { DailyNutritionTargetsCard } from '../components/DailyNutritionTargetsCard';
import { notify } from '../lib/feedback';
import { gymAudio } from '../lib/audio';

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: '🍳' },
  { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
  { type: 'dinner', labelKey: 'dinner', icon: '🥩' },
  { type: 'snack', labelKey: 'snack', icon: '🍎' }
];

const QUICK_MEALS = [
  { title: 'Greek Yogurt & Berries', titleAr: 'زبادي يوناني مع توت', icon: '🫐', mealType: 'breakfast' as MealType, calories: 260, protein: 22, carbs: 28, fats: 7 },
  { title: 'Chicken Rice Bowl', titleAr: 'طبق دجاج مع أرز', icon: '🍗', mealType: 'lunch' as MealType, calories: 610, protein: 46, carbs: 68, fats: 16 },
  { title: 'Oatmeal & Peanut Butter', titleAr: 'شوفان مع زبدة فول', icon: '🥣', mealType: 'breakfast' as MealType, calories: 420, protein: 18, carbs: 54, fats: 14 },
  { title: 'Protein Shake', titleAr: 'شيك بروتين', icon: '🥤', mealType: 'snack' as MealType, calories: 190, protein: 30, carbs: 10, fats: 4 },
  { title: 'Tuna Salad', titleAr: 'سلطة تونة صحية', icon: '🥗', mealType: 'dinner' as MealType, calories: 310, protein: 38, carbs: 12, fats: 9 }
];

const MACRO_COLORS = { protein: '#06b6d4', carbs: '#f59e0b', fats: '#ec4899' };

interface MealDraft {
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  time: string;
}

function toTimeInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'HH:mm');
}

function withTimeFrom(iso: string, time: string) {
  const date = new Date(iso);
  const base = Number.isNaN(date.getTime()) ? new Date() : date;
  if (!time) return base.toISOString();
  const parsed = parse(time, 'HH:mm', base);
  if (Number.isNaN(parsed.getTime())) return base.toISOString();
  return parsed.toISOString();
}

export function NutritionView() {
  const { data, saveMeal, deleteMeal, logWater, resetWater } = useData();
  const { t, isRTL, formatDate } = useTranslation();

  const [isTDEEModalOpen, setIsTDEEModalOpen] = useState(false);
  const [isAIMealVisionOpen, setIsAIMealVisionOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isManualMealModalOpen, setIsManualMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [quickMealSearch, setQuickMealSearch] = useState('');

  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraft>({ calories: '', protein: '', carbs: '', fats: '', time: '' });
  const [draftErrors, setDraftErrors] = useState<{ calories?: string; macros?: string; time?: string }>({});
  const [draftMassUnit, setDraftMassUnit] = useState<MassUnit>('g');
  const [draftEnergyUnit, setDraftEnergyUnit] = useState<EnergyUnit>('kcal');
  const [savingMealId, setSavingMealId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const todayMeals = useMemo(() => {
    if (!data?.meals) return [];
    return data.meals
      .filter(m => isSameDay(new Date(m.date), today))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data?.meals, todayKey]);

  const { totalCaloriesConsumed, totalProtein, totalCarbs, totalFats } = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    for (const m of todayMeals) {
      cal += m.calories || 0;
      pro += m.protein || 0;
      carb += m.carbs || 0;
      fat += m.fats || 0;
    }
    return { totalCaloriesConsumed: cal, totalProtein: pro, totalCarbs: carb, totalFats: fat };
  }, [todayMeals]);

  const todayBurnedCalories = useMemo(() => {
    let burned = 0;
    const countedSessionIds = new Set<string>();

    if (data?.sessions) {
      const completedToday = data.sessions.filter(s => s.isCompleted && isSameDay(new Date(s.date), today));
      for (const s of completedToday) {
        burned += estimateWorkoutCalories(s);
        countedSessionIds.add(s.id);
      }
    }

    if (data?.history) {
      const historyToday = data.history.filter(h => isSameDay(new Date(h.date), today));
      for (const h of historyToday) {
        if (!h.sessionId || !countedSessionIds.has(h.sessionId)) {
          if (!h.sessionId?.startsWith('day-') || countedSessionIds.size === 0) {
            burned += h.burnedCalories || estimateWorkoutCalories(h.snapshot);
          }
        }
      }
    }
    return burned;
  }, [data?.sessions, data?.history, todayKey]);

  const nutritionGoals = data?.nutritionGoals || DEFAULT_NUTRITION_GOALS;
  const todayWater = data?.waterLogs?.[todayKey] || 0;
  const waterGoal = nutritionGoals.dailyWaterMl || 2500;

  const filteredQuickMeals = useMemo(() => {
    const q = quickMealSearch.trim().toLowerCase();
    if (!q) return QUICK_MEALS;
    return QUICK_MEALS.filter(meal =>
      meal.title.toLowerCase().includes(q) || (meal.titleAr && meal.titleAr.includes(q))
    );
  }, [quickMealSearch]);

  const addQuickMeal = async (meal: typeof QUICK_MEALS[number]) => {
    gymAudio.triggerSubtleHaptic([15]);
    await saveMeal({
      ...meal,
      title: isRTL ? meal.titleAr : meal.title,
      id: `quick-${Date.now()}-${meal.title.replace(/ /g, '-').toLowerCase()}`,
      date: new Date().toISOString(),
      description: isRTL ? 'إضافة سريعة' : 'Quick-added meal'
    });
    notify(isRTL ? `تمت إضافة ${meal.titleAr} بنجاح` : `Added ${meal.title}`, 'success');
  };

  const duplicateMeal = useCallback(async (meal: MealRecord) => {
    gymAudio.triggerSubtleHaptic([15, 30]);
    const now = new Date();
    const original = new Date(meal.date);
    const duplicated: MealRecord = {
      ...meal,
      id: `dup-${now.getTime()}-${meal.id}`,
      date: now.toISOString(),
      title: meal.title,
      aiNotes: meal.aiNotes
    };
    if (!Number.isNaN(original.getTime())) {
      const sameTime = format(original, 'HH:mm');
      duplicated.date = withTimeFrom(now.toISOString(), sameTime);
    }
    await saveMeal(duplicated);
    notify(isRTL ? `تم تكرار "${meal.title}"` : `Duplicated “${meal.title}”`, 'success');
  }, [isRTL, saveMeal]);

  const openEditor = (meal: MealRecord) => {
    setExpandedMealId(meal.id);
    setDraftMassUnit('g');
    setDraftEnergyUnit('kcal');
    setDraft({
      calories: String(Math.round(meal.calories || 0)),
      protein: String(Math.round((meal.protein || 0) * 10) / 10),
      carbs: String(Math.round((meal.carbs || 0) * 10) / 10),
      fats: String(Math.round((meal.fats || 0) * 10) / 10),
      time: toTimeInput(meal.date)
    });
    setDraftErrors({});
  };

  const closeEditor = () => {
    setExpandedMealId(null);
    setDraftErrors({});
  };

  const saveInlineEdits = async (meal: MealRecord) => {
    const next: typeof draftErrors = {};
    const calories = Number(draft.calories);
    if (!draft.calories || Number.isNaN(calories) || calories < 0) {
      next.calories = isRTL ? 'أدخل سعرات صحيحة' : 'Enter valid calories';
    }
    const macros = [draft.protein, draft.carbs, draft.fats].map(v => Number(v || 0));
    if (macros.some(v => Number.isNaN(v) || v < 0)) {
      next.macros = isRTL ? 'قيم الماكروز غير صالحة' : 'Invalid macro values';
    }
    if (draft.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
      next.time = isRTL ? 'وقت غير صالح' : 'Invalid time';
    }
    setDraftErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingMealId(meal.id);
    try {
      await saveMeal({
        ...meal,
        date: withTimeFrom(meal.date, draft.time),
        calories: Math.max(0, Math.round(energyToKcal(calories, draftEnergyUnit))),
        protein: Math.max(0, Math.round(massToGrams(macros[0], draftMassUnit) * 10) / 10),
        carbs: Math.max(0, Math.round(massToGrams(macros[1], draftMassUnit) * 10) / 10),
        fats: Math.max(0, Math.round(massToGrams(macros[2], draftMassUnit) * 10) / 10)
      });
      gymAudio.triggerSubtleHaptic([20]);
      notify(isRTL ? 'تم تحديث الوجبة' : 'Meal updated', 'success');
      closeEditor();
    } catch {
      notify(isRTL ? 'تعذّر حفظ التعديلات' : 'Could not save the changes', 'error');
    } finally {
      setSavingMealId(null);
    }
  };

  const convertDraftMass = (next: MassUnit) => {
    if (next === draftMassUnit) return;
    const convert = (raw: string) => {
      const grams = massToGrams(Number(raw) || 0, draftMassUnit);
      return String(Math.round(gramsToMass(grams, next) * 10) / 10);
    };
    setDraftMassUnit(next);
    setDraft(prev => ({
      ...prev,
      protein: convert(prev.protein),
      carbs: convert(prev.carbs),
      fats: convert(prev.fats)
    }));
  };

  const convertDraftEnergy = (next: EnergyUnit) => {
    if (next === draftEnergyUnit) return;
    const kcal = energyToKcal(Number(draft.calories) || 0, draftEnergyUnit);
    setDraftEnergyUnit(next);
    setDraft(prev => ({ ...prev, calories: String(Math.round(kcalToEnergy(kcal, next))) }));
  };

  if (!data) {
    return (
      <div className="zen-page-container nutrition-page">
        <span className="sr-only" role="status">{t('loadingNutrition')}</span>
        <PageSkeleton variant="nutrition" rows={4} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="zen-page-container nutrition-page"
    >
      <div className="zen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)'
          }}>
            <Utensils size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{t('nutritionTitle')}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('nutritionSubtitle')}</p>
          </div>
        </div>

        <div className="nutrition-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAIMealVisionOpen(true)}
            className="zen-pill-btn nutrition-scan-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.25))',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#10b981',
              padding: '0.6rem 0.95rem',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', minHeight: 44
            }}
          >
            <Camera size={16} />
            <span>{isRTL ? 'مسح بالكاميرا (AI)' : 'AI Camera'}</span>
            <Sparkles size={13} style={{ color: '#06b6d4' }} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMeal(null);
              setIsManualMealModalOpen(true);
            }}
            className="zen-pill-btn"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10b981',
              padding: '0.6rem 0.95rem',
              fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', minHeight: 44
            }}
          >
            <Plus size={16} />
            <span>{isRTL ? 'إدخال وجبة' : 'Log Meal'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTDEEModalOpen(true)}
            className="zen-pill-btn"
            style={{
              background: 'rgba(70, 217, 255, 0.08)',
              border: '1px solid rgba(70, 217, 255, 0.25)',
              color: '#46d9ff',
              padding: '0.6rem 0.9rem',
              fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', minHeight: 44
            }}
          >
            <Calculator size={15} />
            <span>{isRTL ? 'حاسبة TDEE' : 'TDEE'}</span>
          </button>
        </div>
      </div>

      <div
        className="mobile-stack-grid nutrition-overview-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        <DailyNutritionTargetsCard
          todayCalories={totalCaloriesConsumed}
          todayBurnedCalories={todayBurnedCalories}
          dailyCaloriesTarget={nutritionGoals.dailyCalories || 2200}
          todayProtein={totalProtein}
          dailyProteinTarget={nutritionGoals.dailyProtein}
          todayCarbs={totalCarbs}
          dailyCarbsTarget={nutritionGoals.dailyCarbs}
          todayFats={totalFats}
          dailyFatsTarget={nutritionGoals.dailyFats}
          onEdit={() => setIsTDEEModalOpen(true)}
          onLogMeal={() => {
            setEditingMeal(null);
            setIsManualMealModalOpen(true);
          }}
        />

        <InteractiveHydrationWaveCard
          todayWater={todayWater}
          waterGoal={waterGoal}
          onLogWater={amount => void logWater(amount, todayKey)}
          onResetWater={() => void resetWater(todayKey)}
        />
      </div>

      <section className="card nutrition-quick-add-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }} aria-label={isRTL ? 'إضافة سريعة' : 'Quick add'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.65rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>{isRTL ? 'إضافة سريعة' : 'Quick add'}</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>
              {isRTL ? 'وجبات محفوظة شائعة — تُسجل فوراً.' : 'Saved staples — logged instantly.'}
            </span>
          </div>
          <input
            className="input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={quickMealSearch}
            onChange={event => setQuickMealSearch(event.target.value)}
            aria-label={isRTL ? 'بحث في الوجبات السريعة' : 'Search quick meals'}
            placeholder={isRTL ? 'ابحث عن وجبة…' : 'Search meals…'}
            style={{ maxWidth: '220px', minHeight: '44px', fontSize: '1rem' }}
          />
        </div>
        {filteredQuickMeals.length === 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
            <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-secondary)' }}>
              {isRTL ? 'لا توجد نتائج — جرّب اسماً آخر.' : 'No matches — try another name.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setQuickMealSearch('')}>
              {t('quickAddNoMatchAction')}
            </Button>
          </div>
        ) : (
          <div className="nutrition-quick-meals-track" style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {filteredQuickMeals.map(meal => (
              <Button
                key={meal.title}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void addQuickMeal(meal)}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <span style={{ marginInlineEnd: '0.25rem' }}>＋</span>
                <span>{isRTL ? (meal.titleAr || meal.title) : meal.title}</span>
                <small style={{ color: 'var(--text-muted)', marginInlineStart: '0.35rem' }}>{meal.calories} kcal</small>
              </Button>
            ))}
          </div>
        )}
      </section>

      <section aria-label={isRTL ? 'نصائح التغذية' : 'Nutrition coaching'}>
        <div className="gym-lifestyle-advice-grid">
          <div className="gym-advice-card">
            <div className="gym-advice-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>⚡</div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isRTL ? 'وجبة ما قبل التمرين' : 'Pre-Workout Fuel'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isRTL
                  ? 'تناول كربوهيدرات معقدة مع مصدر بروتين خفيف قبل التمرين بـ 60-90 دقيقة لتغذية الجليكوجين العضلي وضمان طاقة انفجارية أثناء الرفع.'
                  : 'Consume complex carbs and lean protein 60-90 minutes prior to training to fuel glycogen stores and muscular pumps.'}
              </p>
            </div>
          </div>

          <div className="gym-advice-card">
            <div className="gym-advice-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>🛡️</div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isRTL ? 'استشفاء ما بعد التمرين' : 'Post-Workout Anabolism'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isRTL
                  ? 'احرص على 25-35 جم من البروتين عالي الجودة مع كارب سريع بعد التمرين لإيقاف الهدم العضلي وتنشيط التخليق البروتيني.'
                  : 'Aim for 25-35g of high-bioavailability protein plus fast carbs post-workout to arrest catabolism and trigger muscle protein synthesis.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="nutrition-form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <Wand2 size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{isRTL ? 'سجّل بسرعة' : 'Log it fast'}</h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'صوّر الصحن أو امسح الباركود أو اكتب الأرقام.' : 'Snap the plate, scan the barcode, or type the numbers.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <PrimaryAction onClick={() => setIsAIMealVisionOpen(true)} fullWidth icon={<Camera size={18} />}>
              {isRTL ? 'مسح الوجبة بالذكاء الاصطناعي' : 'AI plate scan'}
            </PrimaryAction>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <SecondaryAction onClick={() => setIsBarcodeScannerOpen(true)} icon={<Barcode size={16} />}>
                {isRTL ? 'باركود' : 'Barcode'}
              </SecondaryAction>
              <SecondaryAction onClick={() => { setEditingMeal(null); setIsManualMealModalOpen(true); }} icon={<Edit3 size={16} />}>
                {isRTL ? 'إدخال يدوي' : 'Manual'}
              </SecondaryAction>
              {todayMeals[0] && (
                <SecondaryAction onClick={() => void duplicateMeal(todayMeals[0])} icon={<CopyPlus size={16} />}>
                  {isRTL ? 'كرر آخر وجبة' : 'Repeat last'}
                </SecondaryAction>
              )}
            </div>
          </div>

        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 id="nutrition-meals-heading" style={{ margin: 0, fontSize: '1.25rem' }}>{t('todaysLoggedMeals')}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>
                {todayMeals.length} {todayMeals.length === 1 ? t('mealWord') : t('mealsWord')}
              </span>
              {todayMeals.length > 0 && (
                <Hint
                  content={t('duplicateGestureHint')}
                  label={t('nutritionSwipeHintLabel')}
                  placement="bottom-end"
                />
              )}
            </span>
          </div>

          {todayMeals.length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.32)', color: '#10b981' }}>
                  <Camera size={22} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isRTL ? 'ابدأ بأول وجبة' : 'Log your first meal'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {isRTL
                      ? 'ثلاث طرق سريعة، كلها في ثوانٍ. اختر الأقرب لك:'
                      : 'Three fast routes, all in seconds. Pick whichever fits the moment:'}
                  </p>
                </div>
              </div>

              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {([
                  { icon: <Camera size={16} />, title: isRTL ? 'صوّر الصحن' : 'Photograph the plate', body: isRTL ? 'صوّر كل المكوّنات في إضاءة جيدة، وراجع الأرقام قبل الحفظ.' : 'Frame every component in good light, then check the numbers before saving.' },
                  { icon: <Barcode size={16} />, title: isRTL ? 'امسح الباركود' : 'Scan the barcode', body: isRTL ? 'للأغلفة والسوبرماركت والمكمّلات — مع حفظ المنتجات المتكررة.' : 'For packs, supermarket items and supplements — repeat foods get saved for you.' },
                  { icon: <Edit3 size={16} />, title: isRTL ? 'اكتب الأرقام' : 'Type the numbers', body: isRTL ? 'لا كاميرا؟ أدخل القيم من العبوة بوحدات ج أو أونصة.' : 'No camera? Type the label values in grams or ounces.' }
                ]).map((step, index) => (
                  <li key={step.title} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.14)', color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>
                      {index + 1}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{step.title}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => setIsAIMealVisionOpen(true)} leftIcon={<Camera size={16} />}>
                  {isRTL ? 'ماسح الكاميرا' : 'Camera scanner'}
                </Button>
                <Button variant="secondary" onClick={() => setIsBarcodeScannerOpen(true)} leftIcon={<Barcode size={16} />}>
                  {isRTL ? 'ماسح الباركود' : 'Barcode scanner'}
                </Button>
                <Button variant="ghost" onClick={() => { setEditingMeal(null); setIsManualMealModalOpen(true); }} leftIcon={<Edit3 size={16} />}>
                  {isRTL ? 'إدخال يدوي' : 'Manual entry'}
                </Button>
              </div>
            </div>
          ) : (
            <ul aria-labelledby="nutrition-meals-heading" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <AnimatePresence initial={false}>
                {todayMeals.map((meal) => {
                  const mealDate = new Date(meal.date);
                  const timeLabel = Number.isNaN(mealDate.getTime()) ? '' : formatDate(mealDate, 'h:mm a');
                  const typeObj = MEAL_TYPES.find(item => item.type === meal.mealType) || MEAL_TYPES[0];
                  const isOpen = expandedMealId === meal.id;
                  const macros = [
                    { key: 'protein' as const, value: meal.protein || 0, color: MACRO_COLORS.protein },
                    { key: 'carbs' as const, value: meal.carbs || 0, color: MACRO_COLORS.carbs },
                    { key: 'fats' as const, value: meal.fats || 0, color: MACRO_COLORS.fats }
                  ];
                  const totalMacroGrams = macros.reduce((acc, m) => acc + m.value, 0);

                  return (
                    <motion.li
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="card"
                      style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          insetBlock: 0,
                          insetInlineEnd: 0,
                          width: 96,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(6,182,212,0.3))',
                          color: '#a7f3d0',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          pointerEvents: 'none'
                        }}
                      >
                        <Copy size={14} />
                        <span>{isRTL ? 'تكرار' : 'Duplicate'}</span>
                      </span>

                      <motion.div
                        drag="x"
                        dragListener={!isOpen}
                        dragDirectionLock
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        onDragEnd={(_event, info) => {
                          const offset = info.offset.x * (isRTL ? -1 : 1);
                          if (offset > 96) void duplicateMeal(meal);
                        }}
                        style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '1rem', touchAction: 'pan-y' }}
                      >
                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        {meal.imageUrl && (
                          <img src={meal.imageUrl} alt="" style={{ width: '68px', height: '68px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
                              <Badge tone="cyan" size="sm">
                                <span style={{ marginInlineEnd: '0.25rem' }}>{typeObj.icon}</span>
                                <span style={{ textTransform: 'capitalize' }}>{t(typeObj.labelKey)}</span>
                              </Badge>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> {timeLabel}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => void duplicateMeal(meal)}
                                aria-label={`${isRTL ? 'تكرار' : 'Duplicate'} ${meal.title}`}
                                title={isRTL ? 'تكرار الوجبة' : 'Duplicate meal'}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.28)', color: '#10b981',
                                  cursor: 'pointer', width: 44, height: 44, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isOpen) closeEditor();
                                  else openEditor(meal);
                                }}
                                aria-expanded={isOpen}
                                aria-controls={`meal-editor-${meal.id}`}
                                aria-label={`${isRTL ? 'تعديل' : 'Edit'} ${meal.title}`}
                                title={isRTL ? 'تعديل سريع' : 'Quick edit'}
                                style={{
                                  background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#06b6d4',
                                  cursor: 'pointer', width: 44, height: 44, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه الوجبة؟' : 'Delete this meal?')) {
                                    gymAudio.triggerSubtleHaptic([20]);
                                    void deleteMeal(meal.id);
                                    notify(isRTL ? 'تم حذف الوجبة بنجاح' : 'Meal deleted successfully', 'success');
                                  }
                                }}
                                aria-label={`${isRTL ? 'حذف' : 'Delete'} ${meal.title}`}
                                title={isRTL ? 'حذف الوجبة' : 'Delete meal'}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
                                  cursor: 'pointer', width: 44, height: 44, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <h4 style={{ margin: '0.45rem 0 0.35rem 0', fontSize: '1rem', fontWeight: 700 }}>{meal.title}</h4>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 850, color: 'var(--text-primary)', fontSize: '1.05rem', fontVariantNumeric: 'tabular-nums' }}>
                              {Math.round(meal.calories || 0)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>kcal</span>
                            </span>
                            {macros.map(macro => (
                              <span key={macro.key} style={{ fontSize: '0.78rem', color: macro.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                {macro.key === 'protein' ? 'P' : macro.key === 'carbs' ? 'C' : 'F'}: {Math.round(macro.value * 10) / 10}g
                              </span>
                            ))}
                          </div>

                          {totalMacroGrams > 0 && (
                            <div
                              aria-hidden="true"
                              style={{ display: 'flex', height: 6, borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.07)', marginTop: '0.5rem' }}
                            >
                              {macros.map(macro => (
                                <span key={macro.key} style={{ display: 'block', height: '100%', background: macro.color, width: `${(macro.value / totalMacroGrams) * 100}%` }} />
                              ))}
                            </div>
                          )}

                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.45rem' }}>
                              {meal.ingredients.slice(0, 3).map((ing, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', background: 'var(--bg-input)', padding: '0.12rem 0.42rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                  {ing.name}
                                </span>
                              ))}
                              {meal.ingredients.length > 3 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  +{meal.ingredients.length - 3} {isRTL ? 'أخرى' : 'more'}
                                </span>
                              )}
                            </div>
                          )}

                          {isOpen && (
                            <div id={`meal-editor-${meal.id}`} style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <UnitToggle
                                  id={`draft-energy-${meal.id}`}
                                  label={isRTL ? 'طاقة' : 'Energy'}
                                  value={draftEnergyUnit}
                                  onChange={convertDraftEnergy}
                                  options={[{ value: 'kcal', label: 'kcal' }, { value: 'kJ', label: 'kJ' }]}
                                />
                                <UnitToggle
                                  id={`draft-mass-${meal.id}`}
                                  label={isRTL ? 'وزن' : 'Weight'}
                                  value={draftMassUnit}
                                  onChange={convertDraftMass}
                                  options={[{ value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }]}
                                />
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <InlineNumberField
                                  id={`draft-calories-${meal.id}`}
                                  label={isRTL ? 'سعرات' : 'Calories'}
                                  value={draft.calories}
                                  onChange={value => { setDraft(prev => ({ ...prev, calories: value })); setDraftErrors(prev => ({ ...prev, calories: undefined })); }}
                                  suffix={draftEnergyUnit}
                                  invalid={Boolean(draftErrors.calories)}
                                  describedBy={draftErrors.calories ? `draft-calories-error-${meal.id}` : undefined}
                                  dir="ltr"
                                  onEnter={() => document.getElementById(`draft-protein-${meal.id}`)?.focus()}
                                />
                                <InlineNumberField
                                  id={`draft-protein-${meal.id}`}
                                  label={isRTL ? 'بروتين' : 'Protein'}
                                  value={draft.protein}
                                  onChange={value => { setDraft(prev => ({ ...prev, protein: value })); setDraftErrors(prev => ({ ...prev, macros: undefined })); }}
                                  suffix={draftMassUnit}
                                  accent={MACRO_COLORS.protein}
                                  inputMode="decimal"
                                  invalid={Boolean(draftErrors.macros)}
                                  describedBy={draftErrors.macros ? `draft-macros-error-${meal.id}` : undefined}
                                  dir="ltr"
                                  onEnter={() => document.getElementById(`draft-carbs-${meal.id}`)?.focus()}
                                />
                                <InlineNumberField
                                  id={`draft-carbs-${meal.id}`}
                                  label={isRTL ? 'كارب' : 'Carbs'}
                                  value={draft.carbs}
                                  onChange={value => { setDraft(prev => ({ ...prev, carbs: value })); setDraftErrors(prev => ({ ...prev, macros: undefined })); }}
                                  suffix={draftMassUnit}
                                  accent={MACRO_COLORS.carbs}
                                  inputMode="decimal"
                                  invalid={Boolean(draftErrors.macros)}
                                  describedBy={draftErrors.macros ? `draft-macros-error-${meal.id}` : undefined}
                                  dir="ltr"
                                  onEnter={() => document.getElementById(`draft-fats-${meal.id}`)?.focus()}
                                />
                                <InlineNumberField
                                  id={`draft-fats-${meal.id}`}
                                  label={isRTL ? 'دهون' : 'Fats'}
                                  value={draft.fats}
                                  onChange={value => { setDraft(prev => ({ ...prev, fats: value })); setDraftErrors(prev => ({ ...prev, macros: undefined })); }}
                                  suffix={draftMassUnit}
                                  accent={MACRO_COLORS.fats}
                                  inputMode="decimal"
                                  invalid={Boolean(draftErrors.macros)}
                                  describedBy={draftErrors.macros ? `draft-macros-error-${meal.id}` : undefined}
                                  dir="ltr"
                                  onEnter={() => document.getElementById(`draft-time-${meal.id}`)?.focus()}
                                />
                              </div>
                              {draftErrors.macros && <FieldError id={`draft-macros-error-${meal.id}`} message={draftErrors.macros} />}
                              {draftErrors.calories && <FieldError id={`draft-calories-error-${meal.id}`} message={draftErrors.calories} />}

                              <div>
                                <label htmlFor={`draft-time-${meal.id}`} style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                  {isRTL ? 'وقت الوجبة' : 'Meal time'}
                                </label>
                                <input
                                  id={`draft-time-${meal.id}`}
                                  type="time"
                                  dir="ltr"
                                  value={draft.time}
                                  onChange={event => { setDraft(prev => ({ ...prev, time: event.target.value })); setDraftErrors(prev => ({ ...prev, time: undefined })); }}
                                  aria-invalid={draftErrors.time ? true : undefined}
                                  aria-describedby={draftErrors.time ? `draft-time-error-${meal.id}` : undefined}
                                  style={{ width: '100%', boxSizing: 'border-box', fontSize: '1rem', minHeight: 46, padding: '0.55rem 0.7rem', borderRadius: '11px', border: `1px solid ${draftErrors.time ? '#f87171' : 'var(--border-color)'}`, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                                {draftErrors.time && <FieldError id={`draft-time-error-${meal.id}`} message={draftErrors.time} />}
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <SecondaryAction onClick={closeEditor} fullWidth>{isRTL ? 'إلغاء' : 'Cancel'}</SecondaryAction>
                                <PrimaryAction onClick={() => void saveInlineEdits(meal)} loading={savingMealId === meal.id} fullWidth icon={<CheckCircle2 size={16} />}>
                                  {isRTL ? 'حفظ' : 'Save'}
                                </PrimaryAction>
                              </div>

                              <button
                                type="button"
                                onClick={() => { setEditingMeal(meal); setIsManualMealModalOpen(true); }}
                                style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', minHeight: 44 }}
                              >
                                <Edit3 size={12} />
                                {isRTL ? 'فتح المحرّر الكامل' : 'Open the full editor'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { if (isOpen) closeEditor(); else openEditor(meal); }}
                        aria-expanded={isOpen}
                        aria-controls={`meal-editor-${meal.id}`}
                        style={{ marginTop: '0.6rem', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: 44 }}
                      >
                        <span>{isRTL ? (isOpen ? 'إخفاء التعديل السريع' : 'تعديل سريع') : (isOpen ? 'Hide quick edit' : 'Quick edit')}</span>
                        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      </motion.div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {createPortal(
        <div className="mobile-page-actionbar" role="group" aria-label={t('nutritionActionBarLabel')}>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsAIMealVisionOpen(true)}
            leftIcon={<Camera width={18} height={18} />}
          >
            {t('nutritionActionBarScan')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { setEditingMeal(null); setIsManualMealModalOpen(true); }}
            leftIcon={<Plus width={18} height={18} />}
          >
            {t('nutritionActionBarLog')}
          </Button>
        </div>,
        document.body
      )}

      <TDEECalculatorModal isOpen={isTDEEModalOpen} onClose={() => setIsTDEEModalOpen(false)} />

      <AIMealVisionModal
        isOpen={isAIMealVisionOpen}
        onClose={() => setIsAIMealVisionOpen(false)}
        onManualEntry={() => {
          setIsAIMealVisionOpen(false);
          setEditingMeal(null);
          setIsManualMealModalOpen(true);
        }}
        onSaveMeal={meal => {
          void saveMeal({ ...meal, id: `meal-${Date.now()}` });
        }}
      />

      <BarcodeFoodScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onManualEntry={() => {
          setIsBarcodeScannerOpen(false);
          setEditingMeal(null);
          setIsManualMealModalOpen(true);
        }}
        onSaveMeal={meal => {
          void saveMeal({ ...meal, id: `meal-${Date.now()}` });
        }}
      />

      <ManualMealModal
        isOpen={isManualMealModalOpen}
        onClose={() => {
          setIsManualMealModalOpen(false);
          setEditingMeal(null);
        }}
        initialMeal={editingMeal}
        onSave={async meal => {
          const finalMeal: MealRecord = {
            ...meal,
            id: 'id' in meal && meal.id ? meal.id : `meal-${Date.now()}`
          } as MealRecord;
          await saveMeal(finalMeal);
          setIsManualMealModalOpen(false);
          setEditingMeal(null);
        }}
      />
    </motion.div>
  );
}

export default NutritionView;
