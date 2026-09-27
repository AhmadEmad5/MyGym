import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, Camera, Upload, Sparkles, Trash2, CheckCircle2, 
  Flame, X, AlertCircle, Clock, Zap,
  Calculator, Plus, Edit3, Barcode
} from 'lucide-react';
import { isSameDay, format } from 'date-fns';
import { generateGeminiJson } from '../lib/gemini';
import { useData } from '../hooks/useData';
import { MealRecord, MealType, estimateWorkoutCalories, DEFAULT_NUTRITION_GOALS } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { Button, Badge, EmptyState } from '../components/ui';
import { TDEECalculatorModal } from '../components/TDEECalculatorModal';
import { AIMealVisionModal } from '../components/AIMealVisionModal';
import { BarcodeFoodScannerModal } from '../components/BarcodeFoodScannerModal';
import { ManualMealModal } from '../components/ManualMealModal';
import { InteractiveHydrationWaveCard } from '../components/InteractiveHydrationWaveCard';
import { SegmentedMacroPill } from '../components/SegmentedMacroPill';
import { validateClientFile, MAX_IMAGE_UPLOAD_BYTES, ALLOWED_IMAGE_MIME_TYPES } from '../lib/fileValidation';
import { notify } from '../lib/feedback';
import { gymAudio } from '../lib/audio';

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: '🍳' },
  { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
  { type: 'dinner', labelKey: 'dinner', icon: '🥩' },
  { type: 'snack', labelKey: 'snack', icon: '🍎' },
];
const QUICK_MEALS = [
  { title: 'Greek Yogurt & Berries', titleAr: 'زبادي يوناني مع توت', icon: '🫐', mealType: 'breakfast' as MealType, calories: 260, protein: 22, carbs: 28, fats: 7 },
  { title: 'Chicken Rice Bowl', titleAr: 'طبق دجاج مع أرز', icon: '🍗', mealType: 'lunch' as MealType, calories: 610, protein: 46, carbs: 68, fats: 16 },
  { title: 'Oatmeal & Peanut Butter', titleAr: 'شوفان مع زبدة فول', icon: '🥣', mealType: 'breakfast' as MealType, calories: 420, protein: 18, carbs: 54, fats: 14 },
  { title: 'Protein Shake', titleAr: 'شيك بروتين', icon: '🥤', mealType: 'snack' as MealType, calories: 190, protein: 30, carbs: 10, fats: 4 },
  { title: 'Tuna Salad', titleAr: 'سلطة تونة صحية', icon: '🥗', mealType: 'dinner' as MealType, calories: 310, protein: 38, carbs: 12, fats: 9 },
];

export function NutritionView() {
  const { data, saveMeal, deleteMeal, logWater, resetWater } = useData();
  const { t, isRTL, formatDate } = useTranslation();

  const [isTDEEModalOpen, setIsTDEEModalOpen] = useState(false);
  const [isAIMealVisionOpen, setIsAIMealVisionOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isManualMealModalOpen, setIsManualMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickMealSearch, setQuickMealSearch] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients: { name: string; portion?: string; calories?: number }[];
    healthScore?: number;
    aiNotes?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayMeals = useMemo(() => {
    if (!data?.meals) return [];
    return data.meals.filter(m => isSameDay(new Date(m.date), today));
  }, [data?.meals, todayKey]);

  // Combined single-pass daily totals computation
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

  // Workouts burned calories today
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

  const netBalance = totalCaloriesConsumed - todayBurnedCalories;

  const nutritionGoals = data?.nutritionGoals || DEFAULT_NUTRITION_GOALS;
  const todayWater = data?.waterLogs?.[todayKey] || 0;
  const waterGoal = nutritionGoals.dailyWaterMl || 2500;

  const calPercent = Math.min(150, Math.round((totalCaloriesConsumed / (nutritionGoals.dailyCalories || 2200)) * 100));

  // Compress image to fast base64 via canvas
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setSelectedImage(compressed);
          setAnalysisError(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateClientFile(file, {
        maxSizeBytes: MAX_IMAGE_UPLOAD_BYTES,
        allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES
      });
      if (!validation.valid) {
        setAnalysisError(validation.error || 'Invalid file format or size.');
        return;
      }
      processImageFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !description.trim()) {
      setAnalysisError('Please take a photo or enter a meal description to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let base64Data = '';
      let mimeType = 'image/jpeg';
      if (selectedImage) {
        const parts = selectedImage.split(',');
        base64Data = parts[1] || '';
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
      }

      const prompt = `You are a professional sports nutritionist and registered dietitian AI.
Analyze this meal based on the provided photo and/or description.
User description: "${description || 'No description provided'}"
Meal type: "${mealType}"

Please evaluate:
1. Dish title (concise, clear, in Arabic or English matching the user's input style).
2. Estimated total calories (integer, in kcal).
3. Macronutrients in grams:
   - protein (integer)
   - carbs (integer)
   - fats (integer)
4. Detected ingredients list with portion size and calories.
5. Overall health score (1 to 10).
6. Concise nutritional guidance (1-2 sentences on suitability for workout goals, muscle recovery, or energy).

Respond ONLY with valid JSON with NO markdown fences, matching this schema:
{
  "title": "Dish Title",
  "calories": 550,
  "protein": 38,
  "carbs": 60,
  "fats": 16,
  "ingredients": [
    {"name": "Ingredient Name", "portion": "e.g. 150g", "calories": 250}
  ],
  "healthScore": 8,
  "aiNotes": "High in lean protein, excellent for post-workout recovery."
}`;

      const parsed = await generateGeminiJson({
        prompt,
        imageBase64: base64Data || undefined,
        mimeType
      });

      setAnalysisResult({
        title: parsed.title || 'Nutritious Meal',
        calories: Number(parsed.calories) || 450,
        protein: Number(parsed.protein) || 25,
        carbs: Number(parsed.carbs) || 50,
        fats: Number(parsed.fats) || 15,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        healthScore: parsed.healthScore || 8,
        aiNotes: parsed.aiNotes || 'Balanced nutritional profile.',
      });
    } catch (err: any) {

      console.error('Gemini meal analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze meal with AI. Please check your connection or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!analysisResult) return;

    const newMeal: MealRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mealType,
      title: analysisResult.title,
      description: description.trim() || undefined,
      imageUrl: selectedImage || undefined,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fats: analysisResult.fats,
      ingredients: analysisResult.ingredients,
      healthScore: analysisResult.healthScore,
      aiNotes: analysisResult.aiNotes,
    };

    await saveMeal(newMeal);

    // Reset form
    setSelectedImage(null);
    setDescription('');
    setAnalysisResult(null);
  };


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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="zen-page-container nutrition-page"
    >
      {/* Header */}
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
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {t('nutritionSubtitle')}
            </p>
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Calculator size={15} />
            <span>{isRTL ? 'حاسبة TDEE' : 'TDEE'}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Section (Restored to top) */}
      <section className="card nutrition-quick-add-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
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
            value={quickMealSearch} 
            onChange={event => setQuickMealSearch(event.target.value)} 
            aria-label={isRTL ? 'بحث في الوجبات السريعة' : 'Search quick meals'} 
            placeholder={isRTL ? 'ابحث عن وجبة…' : 'Search meals…'} 
            style={{ maxWidth: '220px', minHeight: '38px' }} 
          />
        </div>
        <div 
          className="nutrition-quick-meals-track" 
          style={{ 
            display: 'flex', 
            gap: '.5rem', 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch', 
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {filteredQuickMeals.map(meal => (
            <Button 
              key={meal.title} 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={() => addQuickMeal(meal)}
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              <span style={{ marginRight: '0.25rem', marginLeft: '0.25rem' }}>＋</span>
              <span>{isRTL ? (meal.titleAr || meal.title) : meal.title}</span>
              <small style={{ color: 'var(--text-muted)', marginLeft: '0.35rem', marginRight: '0.35rem' }}>
                {meal.calories} kcal
              </small>
            </Button>
          ))}
        </div>
      </section>

      {/* Top Overview: Unified Energy & Macros + Hydration */}
      <div 
        className="mobile-stack-grid nutrition-overview-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', 
          gap: '1.25rem', 
          marginBottom: '1.25rem' 
        }}
      >
        {/* Unified Energy & Macros Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#10b981' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{t('dailyGoals')}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {t('caloriesIn')}: {totalCaloriesConsumed} kcal · {t('caloriesOut')}: {todayBurnedCalories} kcal
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTDEEModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('edit')}
              </button>
            </div>

            {/* Calories Progress Bar */}
            <div style={{ marginBottom: '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('calories')}</span>
                <span style={{ fontWeight: 700 }}>
                  <span style={{ color: totalCaloriesConsumed > nutritionGoals.dailyCalories ? '#f43f5e' : 'var(--text-primary)' }}>
                    {totalCaloriesConsumed}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}> / {nutritionGoals.dailyCalories} kcal</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>({calPercent}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, calPercent)}%`, 
                    height: '100%', 
                    background: totalCaloriesConsumed > nutritionGoals.dailyCalories ? '#f43f5e' : 'linear-gradient(90deg, #10b981, #06b6d4)', 
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>

            {/* Interactive Segmented Macro Pill & Dynamic Targets */}
            <SegmentedMacroPill
              protein={totalProtein}
              targetProtein={nutritionGoals.dailyProtein}
              carbs={totalCarbs}
              targetCarbs={nutritionGoals.dailyCarbs}
              fats={totalFats}
              targetFats={nutritionGoals.dailyFats}
              totalCalories={totalCaloriesConsumed}
              targetCalories={nutritionGoals.dailyCalories}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>{t('netBalance')}: <strong style={{ color: netBalance <= 0 ? '#10b981' : 'var(--text-primary)' }}>{netBalance > 0 ? `+${netBalance}` : netBalance} kcal</strong></span>
            <span>{netBalance <= 0 ? t('calorieDeficitZone') : t('calorieSurplusZone')}</span>
          </div>
        </div>

        {/* Interactive 3D Hydration Wave Chamber */}
        <InteractiveHydrationWaveCard
          todayWater={todayWater}
          waterGoal={waterGoal}
          onLogWater={(amount) => void logWater(amount, todayKey)}
          onResetWater={() => void resetWater(todayKey)}
        />
      </div>

      {/* Gym Lifestyle Nutrition Coaching Pillars */}
      <div className="gym-lifestyle-advice-grid">
        <div className="gym-advice-card">
          <div className="gym-advice-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            ⚡
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRTL ? 'وجبة ما قبل التمرين (Pre-Workout Fuel)' : 'Pre-Workout Fuel'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isRTL 
                ? 'تناول كربوهيدرات معقدة مع مصدر بروتين خفيف قبل التمرين بـ 60-90 دقيقة لتغذية الجليكوجين العضلي وضمان طاقة انفجارية وضخ دموي قوي أثناء الرفع.' 
                : 'Consume complex carbs and lean protein 60-90 minutes prior to training to fuel glycogen stores, endurance, and muscular pumps.'}
            </p>
          </div>
        </div>

        <div className="gym-advice-card">
          <div className="gym-advice-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            🛡️
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRTL ? 'استشفاء ما بعد التمرين (Post-Workout Anabolism)' : 'Post-Workout Anabolism'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isRTL 
                ? 'احرص على 25-35 جم من البروتين عالي الجودة مع كارب سريع بعد التمرين لإيقاف الهدم العضلي وتنشيط عملية التخليق البروتيني (Muscle Protein Synthesis).' 
                : 'Aim for 25-35g of high-bioavailability protein plus fast carbs post-workout to arrest catabolism and trigger muscle protein synthesis.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Logger on Left/Top, Logged Meals on Right */}
      <div className="nutrition-form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
        {/* Meal Logger Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          {/* AI Macro Vision Scanner Hero Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.15))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '16px',
            padding: '1rem 1.15rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <Camera size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  {isRTL ? 'ماسح الوجبات الذكي بالكاميرا (AI Vision)' : 'AI Macro Vision Scanner'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {isRTL ? 'صوّر صحنك ⬅️ تحليل فوري للسعرات والماكروز والتسجيل بنقرة' : 'Snap your plate ⬅️ Instant calories & macros estimation'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAIMealVisionOpen(true)}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#041316',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} />
                <span>{isRTL ? 'ماسح الوجبة بالذكاء الاصطناعي' : 'AI Plate Scan'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '11px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Barcode size={16} style={{ color: '#10b981' }} />
                <span>{isRTL ? 'مسح الباركود' : 'Barcode Scan'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#46d9ff' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('logMealWithAI')}</h2>
          </div>

          {/* Meal Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('mealType')}
            </label>
            <div className="meal-type-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {MEAL_TYPES.map(m => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setMealType(m.type)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '10px',
                    border: mealType === m.type ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: mealType === m.type ? 'rgba(70, 217, 255, 0.12)' : 'var(--bg-tertiary)',
                    color: mealType === m.type ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: mealType === m.type ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{m.icon}</span>
                  <span>{t(m.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload / Camera Area */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('dishPhoto')}
            </label>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />

            {!selectedImage ? (
              <div 
                style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: '14px',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                  >
                    <Camera size={18} style={{ color: 'var(--accent-primary)' }} />
                    {t('takePhoto')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={18} />
                    {t('uploadImage')}
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('photoHint')}
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', maxHeight: '260px' }}>
                <img 
                  src={selectedImage} 
                  alt="Meal preview" 
                  style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} 
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={t('removePhoto')}
                >
                  <X size={18} />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  left: '0.75rem',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(6px)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                  {t('photoReadyForAnalysis')}
                </div>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('descriptionLabel')}
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical', borderRadius: '10px' }}
            />
          </div>

          {/* Error display */}
          {analysisError && (
            <div style={{ 
              marginBottom: '1rem', padding: '0.75rem 1rem', 
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem' 
            }}>
              <AlertCircle size={16} />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            type="button"
            variant="primary"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={isAnalyzing || (!selectedImage && !description.trim())}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.6rem'
            }}
          >
            <Sparkles size={18} />
            <span>{t('analyzeDishBtn')}</span>
          </Button>

          {/* AI Analysis Result Card */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '1.5rem', overflow: 'hidden' }}
              >
                <div style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-highlight)', 
                  borderRadius: '14px', 
                  padding: '1.25rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', 
                      letterSpacing: '0.05em', color: 'var(--accent-primary)',
                      background: 'rgba(70, 217, 255, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' 
                    }}>
                      {t('analysisResult')}
                    </span>
                    {analysisResult.healthScore && (
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        ★ {analysisResult.healthScore}/10 {t('healthScore')}
                      </span>
                    )}
                  </div>

                  {/* Editable Title */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      {t('dishName')}
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      value={analysisResult.title}
                      onChange={(e) => setAnalysisResult({ ...analysisResult, title: e.target.value })}
                      style={{ fontWeight: 700, fontSize: '1.1rem' }}
                    />
                  </div>

                  {/* Macros & Calories Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('estCalories')}</div>
                      <input 
                        type="number"
                        inputMode="numeric"
                        className="input"
                        value={analysisResult.calories}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, calories: Number(e.target.value) || 0 })}
                        style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 800, fontSize: '1rem', border: 'none', background: 'transparent' }}
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</div>
                    </div>

                    <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{t('protein')}</div>
                      <input 
                        type="number"
                        inputMode="numeric"
                        className="input"
                        value={analysisResult.protein}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, protein: Number(e.target.value) || 0 })}
                        style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem', border: 'none', background: 'transparent', color: '#06b6d4' }}
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>g</div>
                    </div>

                    <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>{t('carbs')}</div>
                      <input 
                        type="number"
                        inputMode="numeric"
                        className="input"
                        value={analysisResult.carbs}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, carbs: Number(e.target.value) || 0 })}
                        style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem', border: 'none', background: 'transparent', color: '#f59e0b' }}
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>g</div>
                    </div>

                    <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#ec4899' }}>{t('fats')}</div>
                      <input 
                        type="number"
                        inputMode="numeric"
                        className="input"
                        value={analysisResult.fats}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, fats: Number(e.target.value) || 0 })}
                        style={{ padding: '0.2rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem', border: 'none', background: 'transparent', color: '#ec4899' }}
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>g</div>
                    </div>
                  </div>

                  {/* Detected Ingredients */}
                  {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                        {t('detectedIngredients')}:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {analysisResult.ingredients.map((ing, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              fontSize: '0.78rem', 
                              background: 'rgba(255,255,255,0.06)', 
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '6px',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {ing.name} {ing.portion ? `(${ing.portion})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Dietitian Notes */}
                  {analysisResult.aiNotes && (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(70, 217, 255, 0.08)', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      💡 <strong>{t('aiNutritionalAdvice')}:</strong> {analysisResult.aiNotes}
                    </div>
                  )}

                  {/* Burn Equivalence */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '1.25rem'
                  }}>
                    <Zap size={15} style={{ color: '#f59e0b' }} />
                    <span>
                      {t('takesApproxToBurn')} <strong>{Math.round(analysisResult.calories / 10.5)} {t('burnCardioNotice')}</strong> <strong>{Math.round(analysisResult.calories / 7.2)} {t('burnGymNotice')}</strong>
                    </span>
                  </div>

                  {/* Save to Log Button */}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveMeal}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem' 
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{t('saveToMeals')}</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Today's Logged Meals */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('todaysLoggedMeals')}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {todayMeals.length} {todayMeals.length === 1 ? t('mealWord') : t('mealsWord')}
            </span>
          </div>

          {todayMeals.length === 0 ? (
            <div className="card" style={{ padding: '2rem 1.5rem' }}>
              <EmptyState
                icon={<Utensils size={32} />}
                title={t('noMealsLoggedToday')}
                description={t('noMealsLoggedDesc')}
                action={
                  <Button
                    variant="primary"
                    onClick={() => setIsAIMealVisionOpen(true)}
                  >
                    <span>{isRTL ? '📷 فتح الماسح بالكاميرا' : '📷 Scan with Camera'}</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayMeals.map((meal) => {
                const mealDate = new Date(meal.date);
                const timeLabel = isNaN(mealDate.getTime()) ? '' : formatDate(mealDate, 'h:mm a');
                const typeObj = MEAL_TYPES.find(t => t.type === meal.mealType) || MEAL_TYPES[0];

                return (
                  <motion.div
                    key={meal.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card"
                    style={{ padding: '1.25rem' }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {meal.imageUrl && (
                        <img 
                          src={meal.imageUrl} 
                          alt={meal.title}
                          style={{ 
                            width: '74px', height: '74px', borderRadius: '10px', 
                            objectFit: 'cover', flexShrink: 0 
                          }}
                        />
                      )}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Badge tone="cyan" size="sm">
                              <span style={{ marginRight: '0.25rem', marginLeft: '0.25rem' }}>{typeObj.icon}</span>
                              <span style={{ textTransform: 'capitalize' }}>{meal.mealType}</span>
                            </Badge>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> {timeLabel}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                gymAudio.triggerSubtleHaptic([15]);
                                setEditingMeal(meal);
                                setIsManualMealModalOpen(true);
                              }}
                              style={{
                                background: 'rgba(6, 182, 212, 0.08)',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                color: '#06b6d4',
                                cursor: 'pointer',
                                width: '38px',
                                height: '38px',
                                minWidth: '38px',
                                minHeight: '38px',
                                borderRadius: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              title={isRTL ? 'تعديل الوجبة' : 'Edit meal'}
                              aria-label={isRTL ? 'تعديل الوجبة' : 'Edit meal'}
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه الوجبة؟' : 'Delete this meal?')) {
                                  gymAudio.triggerSubtleHaptic([20]);
                                  deleteMeal(meal.id);
                                  notify(isRTL ? 'تم حذف الوجبة بنجاح' : 'Meal deleted successfully', 'success');
                                }
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                width: '38px',
                                height: '38px',
                                minWidth: '38px',
                                minHeight: '38px',
                                borderRadius: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              title={isRTL ? 'حذف الوجبة' : 'Delete meal'}
                              aria-label={isRTL ? 'حذف الوجبة' : 'Delete meal'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
                          {meal.title}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {meal.calories} kcal
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600 }}>
                            P: {meal.protein}g
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                            C: {meal.carbs}g
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 600 }}>
                            F: {meal.fats}g
                          </span>
                        </div>

                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                            {meal.ingredients.slice(0, 3).map((ing, i) => (
                              <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-input)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                {ing.name}
                              </span>
                            ))}
                            {meal.ingredients.length > 3 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                +{meal.ingredients.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TDEE & Macro Goals Calculator Modal */}
      <TDEECalculatorModal 
        isOpen={isTDEEModalOpen} 
        onClose={() => setIsTDEEModalOpen(false)} 
      />

      {/* AI Meal Vision Scanner Modal */}
      <AIMealVisionModal
        isOpen={isAIMealVisionOpen}
        onClose={() => setIsAIMealVisionOpen(false)}
        onSaveMeal={(meal) => {
          saveMeal({
            ...meal,
            id: `meal-${Date.now()}`
          });
        }}
      />

      {/* Barcode Food Scanner Modal */}
      <BarcodeFoodScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onSaveMeal={(meal) => {
          saveMeal({
            ...meal,
            id: `meal-${Date.now()}`
          });
        }}
      />

      {/* Manual Meal Entry & Edit Modal */}
      <ManualMealModal
        isOpen={isManualMealModalOpen}
        onClose={() => {
          setIsManualMealModalOpen(false);
          setEditingMeal(null);
        }}
        initialMeal={editingMeal}
        onSave={async (meal: Omit<MealRecord, 'id'> | MealRecord) => {
          const finalMeal: MealRecord = {
            ...meal,
            id: 'id' in meal && meal.id ? meal.id : `meal-${Date.now()}`
          };
          await saveMeal(finalMeal);
          setIsManualMealModalOpen(false);
          setEditingMeal(null);
        }}
      />
    </motion.div>
  );
}

export default NutritionView;
