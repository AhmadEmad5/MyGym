import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, Camera, Upload, Sparkles, Trash2, CheckCircle2, 
  Flame, HeartPulse, Scale, RefreshCw, X, AlertCircle, Clock, Zap
} from 'lucide-react';
import { isSameDay } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../hooks/useData';
import { MealRecord, MealType, estimateWorkoutCalories } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: '🍳' },
  { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
  { type: 'dinner', labelKey: 'dinner', icon: '🥩' },
  { type: 'snack', labelKey: 'snack', icon: '🍎' },
];

export function NutritionView() {
  const { data, saveMeal, deleteMeal } = useData();
  const { t, formatDate } = useTranslation();

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const today = new Date();
  const todayMeals = useMemo(() => {
    if (!data?.meals) return [];
    return data.meals.filter(m => isSameDay(new Date(m.date), today));
  }, [data?.meals, today]);

  // Daily totals
  const totalCaloriesConsumed = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  }, [todayMeals]);

  const totalProtein = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  }, [todayMeals]);

  const totalCarbs = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  }, [todayMeals]);

  const totalFats = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);
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
  }, [data?.sessions, data?.history, today]);

  const netBalance = totalCaloriesConsumed - todayBurnedCalories;

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
      processImageFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !description.trim()) {
      setAnalysisError('Please take a photo or enter a meal description to analyze.');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAnalysisError('Gemini API key is not configured in environment variables.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const aiClient = new GoogleGenAI({ apiKey });

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

      const contentsParts: any[] = [];
      if (base64Data) {
        contentsParts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
      contentsParts.push({ text: prompt });

      let response;
      try {
        response = await aiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: contentsParts,
            },
          ],
        });
      } catch (firstErr) {
        console.warn('Primary model gemini-3.6-flash failed, falling back to gemini-flash-latest:', firstErr);
        response = await aiClient.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              role: 'user',
              parts: contentsParts,
            },
          ],
        });
      }

      let rawText = response.text || '';
      // Clean possible markdown code fence ```json ... ```
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(rawText);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="nutrition-page flex-col h-full"
      style={{ paddingBottom: '4rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
          }}>
            <Utensils size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>{t('nutritionTitle')}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {t('nutritionSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Energy Balance & Daily Macro Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2rem' 
      }}>
        {/* Calories Consumed */}
        <div className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('caloriesIn')}
            </span>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', color: '#10b981' }}>
              <Utensils size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalCaloriesConsumed} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('fromLoggedMeals')} ({todayMeals.length})
          </div>
        </div>

        {/* Calories Burned */}
        <div className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('caloriesOut')}
            </span>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '8px', color: '#f59e0b' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
            {todayBurnedCalories} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('burnedFromGym')}
          </div>
        </div>

        {/* Net Balance */}
        <div className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('netBalance')}
            </span>
            <div style={{ padding: '0.5rem', background: 'rgba(6, 182, 212, 0.12)', borderRadius: '8px', color: '#06b6d4' }}>
              <Scale size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: netBalance > 0 ? 'var(--text-primary)' : '#10b981' }}>
            {netBalance > 0 ? `+${netBalance}` : netBalance} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {netBalance <= 0 ? t('calorieDeficitZone') : t('calorieSurplusZone')}
          </div>
        </div>

        {/* Daily Macros */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('dailyMacros')}
            </span>
            <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', color: '#8b5cf6' }}>
              <HeartPulse size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '1.1rem' }}>{totalProtein}g</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('protein')}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>{totalCarbs}g</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('carbs')}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ color: '#ec4899', fontWeight: 700, fontSize: '1.1rem' }}>{totalFats}g</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('fats')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Logger on Left/Top, Logged Meals on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Meal Logger Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#46d9ff' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('logMealWithAI')}</h2>
          </div>

          {/* Meal Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {t('mealType')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!selectedImage && !description.trim())}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.6rem',
              opacity: isAnalyzing || (!selectedImage && !description.trim()) ? 0.6 : 1
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                {t('analyzingText')}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {t('analyzeDishBtn')}
              </>
            )}
          </button>

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
                  <button
                    type="button"
                    className="btn btn-primary"
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
                    {t('saveToMeals')}
                  </button>
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
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ 
                width: '54px', height: '54px', borderRadius: '50%', 
                background: 'var(--bg-tertiary)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' 
              }}>
                <Utensils size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                {t('noMealsLoggedToday')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {t('noMealsLoggedDesc')}
              </p>
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
                            <span style={{ 
                              fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                              background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '6px'
                            }}>
                              {typeObj.icon} {meal.mealType}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> {timeLabel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteMeal(meal.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Delete meal"
                          >
                            <Trash2 size={16} />
                          </button>
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
    </motion.div>
  );
}

export default NutritionView;
