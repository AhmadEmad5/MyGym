import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Camera, Upload, Sparkles, Check, 
  RefreshCw, AlertCircle, ChefHat, Loader2
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { MealRecord, MealType } from '../lib/api';
import { useTranslation, TranslationKey } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface AIMealVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealRecord, 'id'>) => void;
}

const MEAL_TYPES: { type: MealType; labelKey: TranslationKey; icon: string }[] = [
  { type: 'breakfast', labelKey: 'breakfast', icon: '🍳' },
  { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
  { type: 'dinner', labelKey: 'dinner', icon: '🥩' },
  { type: 'snack', labelKey: 'snack', icon: '🍎' },
];

export function AIMealVisionModal({
  isOpen,
  onClose,
  onSaveMeal
}: AIMealVisionModalProps) {
  const { t, isRTL } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');

  // Editable parsed values
  const [dishTitle, setDishTitle] = useState('');
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fats, setFats] = useState<number>(0);
  const [ingredients, setIngredients] = useState<{ name: string; portion?: string; calories?: number }[]>([]);
  const [healthScore, setHealthScore] = useState<number | undefined>(undefined);
  const [aiNotes, setAiNotes] = useState<string>('');
  const [hasResult, setHasResult] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedImage(null);
    setIsScanning(false);
    setScanError(null);
    setHasResult(false);
    setDishTitle('');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFats(0);
    setIngredients([]);
    setHealthScore(undefined);
    setAiNotes('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processImageFile = (file: File) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const maxDim = 800; // Optimal 800px dimension for fast cellular upload & high AI accuracy
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
          // 0.72 quality provides ~35-50KB payload (65% bandwidth saving) with identical OCR accuracy
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setSelectedImage(compressed);
          setScanError(null);
          analyzeImageWithGemini(compressed);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setScanError(isRTL ? 'تعذر قراءة ملف الصورة' : 'Could not read image file');
      };
      img.src = objectUrl;
    } catch {
      // Fallback for environments where createObjectURL is restricted
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
            const compressed = canvas.toDataURL('image/jpeg', 0.72);
            setSelectedImage(compressed);
            setScanError(null);
            analyzeImageWithGemini(compressed);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const analyzeImageWithGemini = async (imageDataUrl: string) => {
    setIsScanning(true);
    setScanError(null);
    setHasResult(false);

    try {
      const parts = imageDataUrl.split(',');
      const base64Data = parts[1] || '';
      let mimeType = 'image/jpeg';
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];

      const prompt = `You are a certified sports nutritionist, dietitian, and computer vision meal analyst.
Analyze the meal shown in this photo with high precision for an athletic trainee.
Please estimate:
1. Dish Title: in Arabic (or English if international), concise & appetizing.
2. Estimated Total Calories (kcal, integer).
3. Macronutrients in grams:
   - protein (integer)
   - carbs (integer)
   - fats (integer)
4. List of detected ingredients with portion and calorie estimates.
5. Overall health & recovery score (1-10).
6. Brief 1-2 sentence fitness advice for muscle building/recovery.

Respond ONLY with valid JSON with NO markdown fences:
{
  "title": "طبق أرز بسمتي مع صدور دجاج مشوية وسلطة",
  "calories": 540,
  "protein": 42,
  "carbs": 58,
  "fats": 12,
  "ingredients": [
    {"name": "صدر دجاج مشوي", "portion": "150g", "calories": 250},
    {"name": "أرز بسمتي مطبوخ", "portion": "200g", "calories": 240},
    {"name": "سلطة خضراء وزيت زيتون", "portion": "100g", "calories": 50}
  ],
  "healthScore": 9,
  "aiNotes": "وجبة مثالية بعد التمرين، غنية بالبروتين الصافي والكاربوهيدرات المعقدة لإعادة ملء مخازن الجليكوجين وتسريع الاستشفاء."
}`;

      const parsed = await generateGeminiJson<any>({
        prompt,
        imageBase64: base64Data,
        mimeType
      });

      setDishTitle(parsed.title || (isRTL ? 'وجبة صحية متكاملة' : 'Nutritious Meal'));
      setCalories(Number(parsed.calories) || 500);
      setProtein(Number(parsed.protein) || 30);
      setCarbs(Number(parsed.carbs) || 55);
      setFats(Number(parsed.fats) || 15);
      setIngredients(Array.isArray(parsed.ingredients) ? parsed.ingredients : []);
      setHealthScore(parsed.healthScore || 8);
      setAiNotes(parsed.aiNotes || '');
      setHasResult(true);

      gymAudio.playRestTimerChime();
      gymAudio.triggerSubtleHaptic([30, 40, 30]);
    } catch (err: any) {
      console.error('Gemini Vision Meal error:', err);
      setScanError(isRTL ? 'تعذر تحليل الطبق تلقائياً. تأكد من وضوح الصورة أو أدخل البيانات يدوياً.' : 'Could not analyze photo automatically. Please try again with better lighting.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveAndAdd = () => {
    if (!dishTitle) return;

    onSaveMeal({
      title: dishTitle,
      date: new Date().toISOString(),
      mealType,
      calories: Math.max(0, calories),
      protein: Math.max(0, protein),
      carbs: Math.max(0, carbs),
      fats: Math.max(0, fats),
      ingredients,
      healthScore,
      aiNotes,
      imageUrl: selectedImage || undefined
    });

    gymAudio.playCelebrationFanfare();
    gymAudio.triggerSubtleHaptic([50, 70, 50]);
    handleClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <motion.div
        className="card ai-meal-vision-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          borderRadius: '26px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
      >
        {/* Hidden File Inputs */}
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
            }}>
              <Camera size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {isRTL ? 'ماسح الوجبات بالذكاء الاصطناعي' : 'AI Meal Vision Scanner'}
                </h2>
                <span style={{
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  GEMINI
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'التقط صورة لطبقك لتقدير السعرات والماكروز فوراً' : 'Snap a food photo to instantly estimate calories and macros'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={handleClose}
            style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Capture Area if no image selected */}
          {!selectedImage && (
            <div
              style={{
                border: '2px dashed var(--border-highlight)',
                borderRadius: '18px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                cursor: 'pointer'
              }}
              onClick={() => cameraInputRef.current?.click()}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <ChefHat size={32} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  {isRTL ? 'التقط صورة لطبق الطعام الآن' : 'Snap a Meal Photo'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
                  {isRTL 
                    ? 'ضع طبقك أمام الكاميرا (أرز، دجاج، لحم، سلطة، مكملات...) وسيتكفل الذكاء الاصطناعي بتقدير المكونات والماكروز.'
                    : 'Place your plate in view (chicken, rice, salad, shakes) and let Gemini Vision estimate the ingredients and macros.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)'
                  }}
                >
                  <Camera size={18} />
                  <span>{isRTL ? 'فتح الكاميرا والتقاط صورة' : 'Open Camera'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Upload size={18} />
                  <span>{isRTL ? 'اختيار من المعرض' : 'Upload File'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview & Scanning Laser Overlay */}
          {selectedImage && (
            <div style={{
              position: 'relative',
              borderRadius: '18px',
              overflow: 'hidden',
              maxHeight: '220px',
              border: '1px solid var(--border-color)',
              background: '#000'
            }}>
              <img
                src={selectedImage}
                alt="Captured meal"
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: isScanning ? 0.7 : 1
                }}
              />

              {/* High-tech Scanning Laser Beam */}
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(2px)'
                }}>
                  {/* Moving scanning line */}
                  <motion.div
                    animate={{ y: [-90, 90, -90] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '3px',
                      background: 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
                      boxShadow: '0 0 16px #38bdf8'
                    }}
                  />

                  <div style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '999px',
                    background: 'rgba(11, 17, 30, 0.88)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}>
                    <Sparkles size={16} className="animate-spin text-cyan-400" style={{ color: '#38bdf8' }} />
                    <span>{isRTL ? 'جاري فحص الطبق وتقدير الماكروز...' : 'Scanning dish & estimating macros...'}</span>
                  </div>
                </div>
              )}

              {/* Reset Photo Button */}
              {!isScanning && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: isRTL ? '10px' : 'auto',
                    right: isRTL ? 'auto' : '10px',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.65)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>{isRTL ? 'صورة أخرى' : 'Retake'}</span>
                </button>
              )}
            </div>
          )}

          {/* Scan Error Message */}
          {scanError && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{scanError}</span>
            </div>
          )}

          {/* Optimistic Skeleton UI while Gemini Vision Analyzes */}
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              {/* Shimmering Meal Title Skeleton */}
              <div style={{
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, var(--bg-tertiary) 0%, rgba(56, 189, 248, 0.08) 50%, var(--bg-tertiary) 100%)',
                backgroundSize: '200% 100%',
                animation: 'pulse 1.8s infinite'
              }} />

              {/* Shimmering Macro Triad Skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {['سعرات', 'بروتين', 'كارب', 'دهون'].map((label, idx) => (
                  <div
                    key={idx}
                    style={{
                      height: '68px',
                      borderRadius: '12px',
                      background: 'linear-gradient(90deg, var(--bg-tertiary) 0%, rgba(16, 185, 129, 0.08) 50%, var(--bg-tertiary) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'pulse 1.8s infinite',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Processing Badge */}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRTL ? 'الذكاء الاصطناعي يستخرج المكونات ويحسب الماكروز والسعرات...' : 'AI Vision is extracting ingredients & calculating macros...'}</span>
              </div>
            </motion.div>
          )}

          {/* Parsed Result & 1-Tap Log Form */}
          {hasResult && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Dish Title Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  {isRTL ? 'اسم الوجبة المكتشف' : 'Detected Meal Title'}
                </label>
                <input
                  type="text"
                  value={dishTitle}
                  onChange={(e) => setDishTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Meal Type Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  {isRTL ? 'نوع الوجبة' : 'Meal Category'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
                  {MEAL_TYPES.map(m => (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setMealType(m.type)}
                      style={{
                        padding: '0.5rem 0.3rem',
                        borderRadius: '10px',
                        border: mealType === m.type ? '1px solid #10b981' : '1px solid var(--border-color)',
                        background: mealType === m.type ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                        color: mealType === m.type ? '#10b981' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: mealType === m.type ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <span>{m.icon}</span>
                      <span>{t(m.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Macro Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {/* Calories */}
                <div style={{
                  padding: '0.75rem 0.4rem',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {isRTL ? 'السعرات' : 'Calories'}
                  </div>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal</span>
                </div>

                {/* Protein */}
                <div style={{
                  padding: '0.75rem 0.4rem',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {isRTL ? 'البروتين' : 'Protein'}
                  </div>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</span>
                </div>

                {/* Carbs */}
                <div style={{
                  padding: '0.75rem 0.4rem',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {isRTL ? 'كارب' : 'Carbs'}
                  </div>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</span>
                </div>

                {/* Fats */}
                <div style={{
                  padding: '0.75rem 0.4rem',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {isRTL ? 'دهون' : 'Fats'}
                  </div>
                  <input
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(Number(e.target.value))}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</span>
                </div>
              </div>

              {/* Ingredients list if found */}
              {ingredients.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {isRTL ? 'المكونات المقدرة:' : 'Estimated Ingredients:'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {ingredients.map((ing, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)',
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
              {aiNotes && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.45rem'
                }}>
                  <Sparkles size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <span>{aiNotes}</span>
                </div>
              )}

              {/* Save / Log CTA Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAndAdd}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Check size={18} />
                <span>{isRTL ? 'إضافة لسجل اليوم بضغطة واحدة ✅' : 'Log to Today’s Meals ✅'}</span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
