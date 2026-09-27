import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Sparkles, Activity, Timer, Camera, Barcode, 
  Flame, Palette, Globe, Check, ArrowRight, ArrowLeft, X, 
  Zap, HeartPulse, Smartphone, Layers
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface OnboardingTourProps {
  onFinish: () => void;
}

const THEME_OPTIONS = [
  { id: 'dark', label: 'Obsidian', color: '#38bdf8' },
  { id: 'midnight', label: 'Midnight', color: '#60a5fa' },
  { id: 'ocean', label: 'Ocean', color: '#14b8a6' },
  { id: 'neon', label: 'Neon', color: '#e879f9' },
  { id: 'forest', label: 'Forest', color: '#10b981' },
  { id: 'sunset', label: 'Sunset', color: '#f97316' },
];

export function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const { data, updateSettings, theme, setTheme } = useData();
  const { isRTL, language, setLanguage } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const settings = data?.settings;

  const totalSteps = 5;

  const saveSettingsPatch = async (patch: Partial<NonNullable<typeof settings>>) => {
    try {
      await updateSettings({
        weightUnit: settings?.weightUnit || 'kg',
        theme: settings?.theme || 'midnight',
        ...settings,
        ...patch,
      }, data?.user);
      gymAudio.triggerSubtleHaptic([15]);
    } catch {
      // fallback smoothly
    }
  };

  const handleNext = () => {
    gymAudio.triggerSubtleHaptic([20, 25]);
    if (currentStep === totalSteps - 1) {
      gymAudio.triggerDualPulseHaptic();
      onFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    gymAudio.triggerSubtleHaptic([15]);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="forma-onboarding-backdrop" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.section
        className="forma-onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forma-onboarding-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        {/* Glow Halo */}
        <div className="forma-onboarding-glow" />

        {/* Topline Bar */}
        <div className="forma-onboarding-topline">
          <div className="forma-onboarding-step-tag">
            <Sparkles size={13} />
            <span>{isRTL ? `الخطوة ${currentStep + 1} من ${totalSteps}` : `STEP ${currentStep + 1} OF ${totalSteps}`}</span>
          </div>

          <button
            type="button"
            className="forma-onboarding-close-btn"
            onClick={() => {
              gymAudio.triggerSubtleHaptic([15]);
              onFinish();
            }}
            aria-label={isRTL ? 'تخطي الشرح' : 'Skip Tour'}
            title={isRTL ? 'تخطي الشرح' : 'Skip Tour'}
          >
            <X size={16} />
          </button>
        </div>

        {/* 5-Step Progress Indicators */}
        <div className="forma-onboarding-route" aria-label="Tour progress">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`forma-onboarding-route-bar ${index <= currentStep ? 'is-active' : ''}`}
            />
          ))}
        </div>

        {/* Animated Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="forma-onboarding-content"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* ── STEP 1: WELCOME & PILLARS ────────────────────────────── */}
            {currentStep === 0 && (
              <>
                <div className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem">
                    <Dumbbell size={30} />
                  </div>
                  <h2 id="forma-onboarding-title" className="forma-onboarding-title">
                    {isRTL ? 'مرحباً بك في FORMA PRO' : 'Welcome to FORMA PRO'}
                  </h2>
                  <p className="forma-onboarding-desc">
                    {isRTL
                      ? 'مساعدك الرياضي الهندسي المتكامل — مصمم لرفع مستواك البدني عبر التتبع الدقيق والذكاء الاصطناعي.'
                      : 'Your elite athletic ecosystem — engineered for precision performance, 3D anatomy, and AI intelligence.'}
                  </p>
                </div>

                <div className="forma-showcase-box">
                  <div className="forma-showcase-pills-row">
                    <div className="forma-showcase-pill">
                      <Layers size={18} />
                      <span>{isRTL ? 'تتبع فوري للأوزان والجولات' : 'Live Sets & PR Tracking'}</span>
                    </div>
                    <div className="forma-showcase-pill">
                      <HeartPulse size={18} />
                      <span>{isRTL ? 'هولوغرام العضلات 3D' : '3D Muscle Anatomy'}</span>
                    </div>
                    <div className="forma-showcase-pill">
                      <Barcode size={18} />
                      <span>{isRTL ? 'ماسح الوجبات والباركود' : 'AI Meals & Barcode Scan'}</span>
                    </div>
                    <div className="forma-showcase-pill">
                      <Smartphone size={18} />
                      <span>{isRTL ? 'مؤقت شاشة القفل Live HUD' : 'Lock Screen Live HUD'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Language Selection */}
                <div className="forma-choice-group">
                  <div className="forma-choice-label">
                    <Globe size={14} />
                    <span>{isRTL ? 'اختر لغة الواجهة الأساسية' : 'Select your primary language'}</span>
                  </div>
                  <div className="forma-choice-grid">
                    <button
                      type="button"
                      className={`forma-choice-card ${language === 'ar' ? 'is-active' : ''}`}
                      onClick={() => {
                        setLanguage('ar');
                        void saveSettingsPatch({ language: 'ar' });
                      }}
                    >
                      <strong className="forma-choice-title">العربية</strong>
                      <span className="forma-choice-sub">الواجهة العربية الافتراضية</span>
                    </button>

                    <button
                      type="button"
                      className={`forma-choice-card ${language === 'en' ? 'is-active' : ''}`}
                      onClick={() => {
                        setLanguage('en');
                        void saveSettingsPatch({ language: 'en' });
                      }}
                    >
                      <strong className="forma-choice-title">English</strong>
                      <span className="forma-choice-sub">Global Standard LTR</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: 3D HOLOGRAM & DUAL-PULSE REST ───────────────── */}
            {currentStep === 1 && (
              <>
                <div className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    <Activity size={30} />
                  </div>
                  <h2 className="forma-onboarding-title">
                    {isRTL ? 'الهولوغرام العضلي 3D ومؤقت الراحة' : '3D Anatomy & Smart Rest Timer'}
                  </h2>
                  <p className="forma-onboarding-desc">
                    {isRTL
                      ? 'شاهد العضلات المستهدفة مباشرة في مجسم ثلاثي الأبعاد، واستقبل تنبيهات اهتزازية مزدوجة عند انتهاء الراحة تخترق صخب الصالة.'
                      : 'Visualize activated muscles in real-time 3D, and receive piercing dual-pulse haptics through gym noise.'}
                  </p>
                </div>

                <div className="forma-muscle-mock">
                  <div className="forma-muscle-radar-icon">
                    <Zap size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                      {isRTL ? 'نظام الاهتزاز المزدوج (Dual-Pulse)' : 'Dual-Pulse Haptics Active'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {isRTL ? 'اهتزاز قوي ونغمة ترددية عند 3 .. 2 .. 1 في جيبك' : 'Distinct vibration bursts & high-pitch chime at 3..2..1'}
                    </div>
                  </div>
                </div>

                {/* Weight Unit Setup */}
                <div className="forma-choice-group">
                  <div className="forma-choice-label">
                    <Dumbbell size={14} />
                    <span>{isRTL ? 'وحدة قياس الأوزان المعتمدة' : 'Preferred Weight Unit'}</span>
                  </div>
                  <div className="forma-choice-grid">
                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.weightUnit === 'kg' ? 'is-active' : ''}`}
                      onClick={() => void saveSettingsPatch({ weightUnit: 'kg' })}
                    >
                      <strong className="forma-choice-title">KG</strong>
                      <span className="forma-choice-sub">{isRTL ? 'كيلوغرام (متري)' : 'Kilograms'}</span>
                      {settings?.weightUnit === 'kg' && <Check size={14} style={{ color: '#38bdf8' }} />}
                    </button>

                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.weightUnit === 'lb' ? 'is-active' : ''}`}
                      onClick={() => void saveSettingsPatch({ weightUnit: 'lb' })}
                    >
                      <strong className="forma-choice-title">LB</strong>
                      <span className="forma-choice-sub">{isRTL ? 'رطل (إمبريالي)' : 'Pounds'}</span>
                      {settings?.weightUnit === 'lb' && <Check size={14} style={{ color: '#38bdf8' }} />}
                    </button>
                  </div>
                </div>

                {/* Default Rest Timer Setup */}
                <div className="forma-choice-group">
                  <div className="forma-choice-label">
                    <Timer size={14} />
                    <span>{isRTL ? 'فترة الراحة الافتراضية بين الجولات' : 'Default Rest Timer'}</span>
                  </div>
                  <div className="forma-choice-grid">
                    {[60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`forma-choice-card ${settings?.restTimerSeconds === sec ? 'is-active' : ''}`}
                        onClick={() => void saveSettingsPatch({ restTimerSeconds: sec })}
                      >
                        <strong className="forma-choice-title">{sec}s</strong>
                        <span className="forma-choice-sub">
                          {sec === 60 ? (isRTL ? 'تضخيم سريع' : 'Fast') : sec === 90 ? (isRTL ? 'قياسي موصى به' : 'Optimal') : (isRTL ? 'قوة عضلية' : 'Heavy')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: NUTRITION & BARCODE VISION ───────────────────── */}
            {currentStep === 2 && (
              <>
                <div className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                    <Camera size={30} />
                  </div>
                  <h2 className="forma-onboarding-title">
                    {isRTL ? 'التغذية الذكية وماسح الباركود' : 'AI Nutrition & Barcode Scanner'}
                  </h2>
                  <p className="forma-onboarding-desc">
                    {isRTL
                      ? 'صوّر طبق طعامك لتحليله بالذكاء الاصطناعي، أو امسح باركود المكملات والأغذية بكاميرا الهاتف للحصول على الماكروز فوراً.'
                      : 'Snap your meal plate for instant AI analysis, or scan food barcodes directly to log exact calories & macros.'}
                  </p>
                </div>

                <div className="forma-showcase-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>
                      {isRTL ? 'الماكروز اليومية المتزامنة' : 'Daily Macro Tracking'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                      {isRTL ? 'حاسبة TDEE دقيقة' : 'TDEE Engine'}
                    </span>
                  </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.45rem', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{isRTL ? 'السعرات' : 'Cals'}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b' }}>{data?.nutritionGoals?.dailyCalories ?? 2200}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{isRTL ? 'بروتين' : 'Protein'}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>{data?.nutritionGoals?.dailyProtein ?? 150}g</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{isRTL ? 'كارب' : 'Carbs'}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>{data?.nutritionGoals?.dailyCarbs ?? 220}g</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{isRTL ? 'دهون' : 'Fats'}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ec4899' }}>{data?.nutritionGoals?.dailyFats ?? 65}g</div>
                    </div>
                  </div>
                </div>

                {/* Training Week Start */}
                <div className="forma-choice-group">
                  <div className="forma-choice-label">
                    <Flame size={14} />
                    <span>{isRTL ? 'بداية أسبوع التمرين المفضل لديك' : 'First Day of Training Week'}</span>
                  </div>
                  <div className="forma-choice-grid">
                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.weekStartsOn === 'sunday' ? 'is-active' : ''}`}
                      onClick={() => void saveSettingsPatch({ weekStartsOn: 'sunday' })}
                    >
                      <strong className="forma-choice-title">{isRTL ? 'الأحد' : 'Sunday'}</strong>
                      <span className="forma-choice-sub">{isRTL ? 'مناسب للشرق الأوسط' : 'Regional Default'}</span>
                      {settings?.weekStartsOn === 'sunday' && <Check size={14} style={{ color: '#38bdf8' }} />}
                    </button>

                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.weekStartsOn === 'monday' ? 'is-active' : ''}`}
                      onClick={() => void saveSettingsPatch({ weekStartsOn: 'monday' })}
                    >
                      <strong className="forma-choice-title">{isRTL ? 'الاثنين' : 'Monday'}</strong>
                      <span className="forma-choice-sub">{isRTL ? 'التقويم الدولي' : 'International'}</span>
                      {settings?.weekStartsOn === 'monday' && <Check size={14} style={{ color: '#38bdf8' }} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 4: LOCK SCREEN & THEMES ─────────────────────────── */}
            {currentStep === 3 && (
              <>
                <div className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#e879f9', borderColor: 'rgba(232, 121, 249, 0.4)' }}>
                    <Palette size={30} />
                  </div>
                  <h2 className="forma-onboarding-title">
                    {isRTL ? 'شاشة القفل والمظهر الشخصي' : 'Lock Screen Live HUD & Themes'}
                  </h2>
                  <p className="forma-onboarding-desc">
                    {isRTL
                      ? 'تحكم بفترة الراحة وتخطّ الجولات مباشرة من شاشة القفل دون لمس قفل الهاتف، واختر المظهر اللوني الذي يعكس طاقتك.'
                      : 'Control rest sets right from your device lock screen, and personalize your high-performance theme.'}
                  </p>
                </div>

                {/* Simulated Lock Screen Live HUD */}
                <div className="forma-lockscreen-mock">
                  <div className="forma-lockscreen-header">
                    <span className="forma-lockscreen-title">
                      {isRTL ? '🔥 جولة راحة — ضغط صدر بالبار' : '🔥 Rest Timer — Bench Press'}
                    </span>
                    <span className="forma-lockscreen-time">00:45</span>
                  </div>
                  <div className="forma-lockscreen-bar">
                    <div className="forma-lockscreen-fill" />
                  </div>
                  <div className="forma-lockscreen-actions">
                    <span className="forma-lockscreen-btn">{isRTL ? '+30 ثانية' : '+30s'}</span>
                    <span className="forma-lockscreen-btn" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      {isRTL ? 'تخطي الراحة ⏭' : 'Skip Rest ⏭'}
                    </span>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="forma-choice-group">
                  <div className="forma-choice-label">
                    <Palette size={14} />
                    <span>{isRTL ? 'اختر مظهرك المفضل (يمكنك تغييره متى شئت)' : 'Select your favorite theme'}</span>
                  </div>

                  <div className="forma-themes-swatches">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`forma-theme-swatch-card ${theme === t.id ? 'is-active' : ''}`}
                        onClick={() => {
                          setTheme(t.id);
                          void saveSettingsPatch({ theme: t.id });
                        }}
                      >
                        <span className="forma-theme-dot" style={{ backgroundColor: t.color, color: t.color }} />
                        <span className="forma-theme-name">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 5: READY TO DOMINATE ────────────────────────────── */}
            {currentStep === 4 && (
              <>
                <div className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Flame size={32} />
                  </div>
                  <h2 className="forma-onboarding-title">
                    {isRTL ? 'أنت الآن جاهز لصنع الفارق!' : 'Ready to Dominate Your Training!'}
                  </h2>
                  <p className="forma-onboarding-desc">
                    {isRTL
                      ? 'تم ضبط كافة تفضيلاتك بنجاح. خطط لتمارينك، تتبع أوزانك، واستعن بالمساعد الذكي AI متى احتجت لاستشارة.'
                      : 'All your preferences are synchronized. Log your workouts, beat personal records, and achieve your peak shape.'}
                  </p>
                </div>

                <div className="forma-showcase-box" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(16, 185, 129, 0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Check size={16} style={{ color: '#10b981' }} />
                    <span>{isRTL ? 'ملخص إعداداتك الجاهزة' : 'Your Ready Profile'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.76rem', color: '#cbd5e1' }}>
                    <div>• {isRTL ? 'الوحدة:' : 'Unit:'} <strong>{settings?.weightUnit?.toUpperCase() || 'KG'}</strong></div>
                    <div>• {isRTL ? 'المؤقت:' : 'Rest:'} <strong>{settings?.restTimerSeconds || 90}s</strong></div>
                    <div>• {isRTL ? 'المظهر:' : 'Theme:'} <strong>{theme?.toUpperCase()}</strong></div>
                    <div>• {isRTL ? 'الأسبوع يبدأ:' : 'Starts:'} <strong>{settings?.weekStartsOn === 'monday' ? (isRTL ? 'الاثنين' : 'Monday') : (isRTL ? 'الأحد' : 'Sunday')}</strong></div>
                  </div>
                </div>

                <div style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center' }}>
                  {isRTL
                    ? '💡 يمكنك في أي وقت إعادة تشغيل هذه الجولة أو تعديل الإعدادات من شاشة الإعدادات (Settings).'
                    : '💡 You can replay this tour or tweak preferences anytime in Settings.'}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="forma-onboarding-footer">
          {currentStep > 0 ? (
            <button
              type="button"
              className="forma-onboarding-back-btn"
              onClick={handlePrev}
            >
              {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              <span>{isRTL ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="forma-onboarding-primary-btn"
            onClick={handleNext}
          >
            <span>
              {currentStep === totalSteps - 1
                ? (isRTL ? 'ابدأ تمرينك الآن 🚀' : 'Start Training Now 🚀')
                : (isRTL ? 'المتابعة' : 'Continue')}
            </span>
            {currentStep === totalSteps - 1 ? (
              <Check size={16} />
            ) : (
              isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />
            )}
          </button>
        </div>
      </motion.section>
    </div>
  );
}

export default OnboardingTour;
