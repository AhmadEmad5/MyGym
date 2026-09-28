import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Gauge,
  Palette,
  Sparkles,
  Timer,
  X,
  Zap
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { UserSettings } from '../lib/api';

interface OnboardingTourProps {
  onFinish: () => void;
}

type ThemeId = 'dark' | 'light' | 'midnight' | 'neon' | 'ocean' | 'forest' | 'sunset' | 'paper';

const THEME_OPTIONS: Array<{ id: ThemeId; label: string; color: string }> = [
  { id: 'dark', label: 'Obsidian', color: '#38bdf8' },
  { id: 'light', label: 'Cloud', color: '#facc15' },
  { id: 'midnight', label: 'Midnight', color: '#60a5fa' },
  { id: 'neon', label: 'Neon', color: '#e879f9' },
  { id: 'ocean', label: 'Ocean', color: '#2dd4bf' },
  { id: 'forest', label: 'Forest', color: '#10b981' },
  { id: 'sunset', label: 'Sunset', color: '#f97316' },
  { id: 'paper', label: 'Paper', color: '#a16207' }
];

const TOTAL_STEPS = 4;
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const { data, updateSettings, theme, setTheme } = useData();
  const { isRTL, language, setLanguage } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const settings = data?.settings;
  const isLast = currentStep === TOTAL_STEPS - 1;

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const labels = useMemo(
    () =>
      isRTL
        ? {
            step: (n: number) => `الخطوة ${n} من ${TOTAL_STEPS}`,
            skip: 'تخطي الجولة',
            close: 'إغلاق الجولة',
            back: 'السابق',
            next: 'التالي',
            finish: 'ابدأ تمرينك',
            progress: 'تقدّم الجولة',
            s1Title: 'اضبط مساحتك التدريبية',
            s1Desc: 'اختر اللغة ووحدة الأوزان مرة واحدة، وسيتبعك FORMA في كل شاشة وكل تقرير.',
            s1Lang: 'لغة الواجهة',
            s1Unit: 'وحدة قياس الأوزان',
            kg: 'كيلوغرام',
            lb: 'باوند',
            s2Title: 'أتقن إيقاع الراحة',
            s2Desc: 'اضبط المؤقت الافتراضي والتنبيهات، وستحصل على تنبيه حقيقي حتى مع ضجيج الصالة.',
            s2Rest: 'مدة الراحة الافتراضية',
            s2Alerts: 'تنبيهات انتهاء الراحة',
            s2Sound: 'صوت',
            s2Haptic: 'اهتزاز',
            fast: 'سريعة',
            standard: 'مثالية',
            heavy: 'قوية',
            s3Title: 'اجعل الواجهة لك',
            s3Desc: 'اختر المظهر، وقرار الكثافة والحركة، لتصل إلى تجربة مريحة في الجوال وسط الصالة.',
            s3Theme: 'المظهر',
            s3Density: 'كثافة العرض',
            s3Motion: 'الحركة',
            comfortable: 'مريحة',
            compact: 'مكثفة',
            full: 'كاملة',
            reduced: 'مخففة',
            s4Title: 'كل شيء جاهز',
            s4Desc: 'تم حفظ تفضيلاتك. ابدأ أول تمرين، وسنقيس كل جولة تضيفها.',
            s4Unit: 'الوحدة',
            s4Rest: 'الراحة',
            s4Theme: 'المظهر',
            s4Start: 'الإنجليزية',
            s4Week: 'بداية الأسبوع',
            sunday: 'الأحد',
            monday: 'الاثنين',
            s4Hint: 'يمكنك إعادة تشغيل الجولة أو تعديل أي إعداد في أي وقت.'
          }
        : {
            step: (n: number) => `Step ${n} of ${TOTAL_STEPS}`,
            skip: 'Skip tour',
            close: 'Close tour',
            back: 'Back',
            next: 'Continue',
            finish: 'Start training',
            progress: 'Tour progress',
            s1Title: 'Set up your training space',
            s1Desc: 'Pick your language and weight unit once — FORMA follows you on every screen and in every report.',
            s1Lang: 'Interface language',
            s1Unit: 'Weight unit',
            kg: 'Kilograms',
            lb: 'Pounds',
            s2Title: 'Own your rest rhythm',
            s2Desc: 'Set the default rest interval and alerts so you get a real signal even in the loudest gym.',
            s2Rest: 'Default rest timer',
            s2Alerts: 'Rest-complete alerts',
            s2Sound: 'Sound',
            s2Haptic: 'Vibration',
            fast: 'Fast',
            standard: 'Optimal',
            heavy: 'Heavy',
            s3Title: 'Make the interface yours',
            s3Desc: 'Choose a theme plus how dense and how animated the app should be on a phone in the gym.',
            s3Theme: 'Theme',
            s3Density: 'Layout density',
            s3Motion: 'Motion',
            comfortable: 'Comfortable',
            compact: 'Compact',
            full: 'Full',
            reduced: 'Reduced',
            s4Title: 'You are all set',
            s4Desc: 'Your preferences are saved. Start your first session and every set you log gets measured.',
            s4Unit: 'Unit',
            s4Rest: 'Rest',
            s4Theme: 'Theme',
            s4Start: 'Language',
            s4Week: 'Week starts',
            sunday: 'Sunday',
            monday: 'Monday',
            s4Hint: 'You can replay this tour or change any preference in Settings at any time.'
          },
    [isRTL]
  );

  const saveSettingsPatch = useCallback(
    async (patch: Partial<UserSettings>) => {
      try {
        await updateSettings(
          {
            weightUnit: settings?.weightUnit || 'kg',
            theme: settings?.theme || 'midnight',
            ...settings,
            ...patch
          },
          data?.user
        );
        gymAudio.triggerSubtleHaptic([15]);
      } catch {
        void 0;
      }
    },
    [data?.user, settings, updateSettings]
  );

  const goNext = useCallback(() => {
    gymAudio.triggerSubtleHaptic([20, 25]);
    if (currentStepRef.current >= TOTAL_STEPS - 1) {
      gymAudio.triggerDualPulseHaptic();
      onFinish();
      return;
    }
    setCurrentStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
  }, [onFinish]);

  const goPrev = useCallback(() => {
    gymAudio.triggerSubtleHaptic([15]);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const exit = useCallback(() => {
    gymAudio.triggerSubtleHaptic([15]);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    return () => {
      const target = restoreFocusRef.current;
      if (target && typeof target.focus === 'function' && document.contains(target)) {
        target.focus();
      }
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, [currentStep]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const forwardKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const backKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === 'Escape') {
      event.preventDefault();
      exit();
      return;
    }

    if (event.key === forwardKey || event.key === 'ArrowDown') {
      event.preventDefault();
      goNext();
      return;
    }

    if (event.key === backKey || event.key === 'ArrowUp') {
      event.preventDefault();
      goPrev();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setCurrentStep(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setCurrentStep(TOTAL_STEPS - 1);
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('button, a, input, select, textarea')) return;
      event.preventDefault();
      goNext();
      return;
    }

    if (event.key !== 'Tab') return;

    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (node) => node.offsetParent !== null || node === document.activeElement
    );
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    }
  };

  const activeTheme = (theme || settings?.theme || 'dark') as ThemeId;
  const activeWeek = settings?.weekStartsOn === 'monday' ? labels.monday : labels.sunday;

  return (
    <div className="forma-onboarding-backdrop" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        ref={dialogRef}
        className="forma-onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forma-onboarding-title"
        aria-describedby="forma-onboarding-desc"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="forma-onboarding-glow" aria-hidden="true" />

        <div className="forma-onboarding-topline">
          <div className="forma-onboarding-step-tag">
            <Sparkles size={13} aria-hidden="true" />
            <span>{labels.step(currentStep + 1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="forma-onboarding-skip-btn" onClick={exit}>
              {labels.skip}
            </button>
            <button
              type="button"
              className="forma-onboarding-close-btn"
              onClick={exit}
              aria-label={labels.close}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="forma-onboarding-route"
          role="progressbar"
          aria-label={labels.progress}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={currentStep + 1}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <span
              key={index}
              className={`forma-onboarding-route-bar ${index <= currentStep ? 'is-active' : ''}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            className="forma-onboarding-content"
            initial={{ opacity: 0, x: isRTL ? -18 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 18 : -18 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {currentStep === 0 && (
              <>
                <header className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                    <Zap size={28} aria-hidden="true" />
                  </div>
                  <h2 id="forma-onboarding-title" className="forma-onboarding-title">
                    {labels.s1Title}
                  </h2>
                  <p id="forma-onboarding-desc" className="forma-onboarding-desc">
                    {labels.s1Desc}
                  </p>
                </header>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-language">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>{labels.s1Lang}</span>
                  </div>
                  <div className="forma-choice-grid" role="group" aria-labelledby="forma-tour-language">
                    <button
                      type="button"
                      className={`forma-choice-card ${language === 'ar' ? 'is-active' : ''}`}
                      aria-pressed={language === 'ar'}
                      onClick={() => {
                        setLanguage('ar');
                        void saveSettingsPatch({ language: 'ar' });
                      }}
                    >
                      <strong className="forma-choice-title">العربية</strong>
                      <span className="forma-choice-sub">RTL</span>
                    </button>
                    <button
                      type="button"
                      className={`forma-choice-card ${language === 'en' ? 'is-active' : ''}`}
                      aria-pressed={language === 'en'}
                      onClick={() => {
                        setLanguage('en');
                        void saveSettingsPatch({ language: 'en' });
                      }}
                    >
                      <strong className="forma-choice-title">English</strong>
                      <span className="forma-choice-sub">LTR</span>
                    </button>
                  </div>
                </div>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-unit">
                    <Gauge size={14} aria-hidden="true" />
                    <span>{labels.s1Unit}</span>
                  </div>
                  <div className="forma-choice-grid" role="group" aria-labelledby="forma-tour-unit">
                    <button
                      type="button"
                      className={`forma-choice-card ${(settings?.weightUnit || 'kg') === 'kg' ? 'is-active' : ''}`}
                      aria-pressed={(settings?.weightUnit || 'kg') === 'kg'}
                      onClick={() => void saveSettingsPatch({ weightUnit: 'kg' })}
                    >
                      <strong className="forma-choice-title">KG</strong>
                      <span className="forma-choice-sub">{labels.kg}</span>
                    </button>
                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.weightUnit === 'lb' ? 'is-active' : ''}`}
                      aria-pressed={settings?.weightUnit === 'lb'}
                      onClick={() => void saveSettingsPatch({ weightUnit: 'lb' })}
                    >
                      <strong className="forma-choice-title">LB</strong>
                      <span className="forma-choice-sub">{labels.lb}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <header className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    <Timer size={28} aria-hidden="true" />
                  </div>
                  <h2 id="forma-onboarding-title" className="forma-onboarding-title">
                    {labels.s2Title}
                  </h2>
                  <p id="forma-onboarding-desc" className="forma-onboarding-desc">
                    {labels.s2Desc}
                  </p>
                </header>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-rest">
                    <Timer size={14} aria-hidden="true" />
                    <span>{labels.s2Rest}</span>
                  </div>
                  <div className="forma-choice-grid" role="group" aria-labelledby="forma-tour-rest">
                    {[60, 90, 120].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        className={`forma-choice-card ${(settings?.restTimerSeconds || 90) === seconds ? 'is-active' : ''}`}
                        aria-pressed={(settings?.restTimerSeconds || 90) === seconds}
                        onClick={() => void saveSettingsPatch({ restTimerSeconds: seconds })}
                      >
                        <strong className="forma-choice-title">{seconds}s</strong>
                        <span className="forma-choice-sub">
                          {seconds === 60 ? labels.fast : seconds === 90 ? labels.standard : labels.heavy}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-alerts">
                    <Zap size={14} aria-hidden="true" />
                    <span>{labels.s2Alerts}</span>
                  </div>
                  <div className="forma-alert-row">
                    <AlertToggle
                      legend={labels.s2Sound}
                      enabled={settings?.soundAlerts !== false}
                      onToggle={(next) => void saveSettingsPatch({ soundAlerts: next })}
                    />
                    <AlertToggle
                      legend={labels.s2Haptic}
                      enabled={settings?.vibrationAlerts !== false}
                      onToggle={(next) => void saveSettingsPatch({ vibrationAlerts: next })}
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <header className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#e879f9', borderColor: 'rgba(232, 121, 249, 0.4)' }}>
                    <Palette size={28} aria-hidden="true" />
                  </div>
                  <h2 id="forma-onboarding-title" className="forma-onboarding-title">
                    {labels.s3Title}
                  </h2>
                  <p id="forma-onboarding-desc" className="forma-onboarding-desc">
                    {labels.s3Desc}
                  </p>
                </header>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-theme">
                    <Palette size={14} aria-hidden="true" />
                    <span>{labels.s3Theme}</span>
                  </div>
                  <div className="forma-themes-swatches" role="group" aria-labelledby="forma-tour-theme">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`forma-theme-swatch-card ${activeTheme === option.id ? 'is-active' : ''}`}
                        aria-pressed={activeTheme === option.id}
                        onClick={() => {
                          setTheme(option.id);
                          void saveSettingsPatch({ theme: option.id });
                        }}
                      >
                        <span className="forma-theme-dot" style={{ backgroundColor: option.color, color: option.color }} />
                        <span className="forma-theme-name">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-density">
                    <Gauge size={14} aria-hidden="true" />
                    <span>{labels.s3Density}</span>
                  </div>
                  <div className="forma-choice-grid is-two" role="group" aria-labelledby="forma-tour-density">
                    <button
                      type="button"
                      className={`forma-choice-card ${(settings?.density || 'comfortable') === 'comfortable' ? 'is-active' : ''}`}
                      aria-pressed={(settings?.density || 'comfortable') === 'comfortable'}
                      onClick={() => void saveSettingsPatch({ density: 'comfortable' })}
                    >
                      <strong className="forma-choice-title">{labels.comfortable}</strong>
                    </button>
                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.density === 'compact' ? 'is-active' : ''}`}
                      aria-pressed={settings?.density === 'compact'}
                      onClick={() => void saveSettingsPatch({ density: 'compact' })}
                    >
                      <strong className="forma-choice-title">{labels.compact}</strong>
                    </button>
                  </div>
                </div>

                <div className="forma-choice-group">
                  <div className="forma-choice-label" id="forma-tour-motion">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>{labels.s3Motion}</span>
                  </div>
                  <div className="forma-choice-grid is-two" role="group" aria-labelledby="forma-tour-motion">
                    <button
                      type="button"
                      className={`forma-choice-card ${(settings?.motion || 'full') === 'full' ? 'is-active' : ''}`}
                      aria-pressed={(settings?.motion || 'full') === 'full'}
                      onClick={() => void saveSettingsPatch({ motion: 'full' })}
                    >
                      <strong className="forma-choice-title">{labels.full}</strong>
                    </button>
                    <button
                      type="button"
                      className={`forma-choice-card ${settings?.motion === 'reduced' ? 'is-active' : ''}`}
                      aria-pressed={settings?.motion === 'reduced'}
                      onClick={() => void saveSettingsPatch({ motion: 'reduced' })}
                    >
                      <strong className="forma-choice-title">{labels.reduced}</strong>
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <header className="forma-onboarding-hero-head">
                  <div className="forma-onboarding-icon-gem" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <Flame size={30} aria-hidden="true" />
                  </div>
                  <h2 id="forma-onboarding-title" className="forma-onboarding-title">
                    {labels.s4Title}
                  </h2>
                  <p id="forma-onboarding-desc" className="forma-onboarding-desc">
                    {labels.s4Desc}
                  </p>
                </header>

                <div className="forma-summary-card">
                  <div className="forma-summary-row">
                    <span>{labels.s4Start}</span>
                    <strong>{language === 'ar' ? 'العربية' : 'English'}</strong>
                  </div>
                  <div className="forma-summary-row">
                    <span>{labels.s4Unit}</span>
                    <strong>{(settings?.weightUnit || 'kg').toUpperCase()}</strong>
                  </div>
                  <div className="forma-summary-row">
                    <span>{labels.s4Rest}</span>
                    <strong>{settings?.restTimerSeconds || 90}s</strong>
                  </div>
                  <div className="forma-summary-row">
                    <span>{labels.s4Theme}</span>
                    <strong>{THEME_OPTIONS.find((option) => option.id === activeTheme)?.label ?? activeTheme}</strong>
                  </div>
                  <div className="forma-summary-row">
                    <span>{labels.s4Week}</span>
                    <strong>{activeWeek}</strong>
                  </div>
                </div>

                <p className="forma-onboarding-footnote">{labels.s4Hint}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="forma-onboarding-footer">
          <button
            type="button"
            className="forma-onboarding-back-btn"
            onClick={goPrev}
            disabled={currentStep === 0}
            aria-hidden={currentStep === 0}
            tabIndex={currentStep === 0 ? -1 : 0}
          >
            {isRTL ? <ArrowRight size={15} aria-hidden="true" /> : <ArrowLeft size={15} aria-hidden="true" />}
            <span>{labels.back}</span>
          </button>

          <button type="button" className="forma-onboarding-primary-btn" onClick={goNext}>
            <span>{isLast ? labels.finish : labels.next}</span>
            {isLast ? <Check size={16} aria-hidden="true" /> : isRTL ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertToggle({
  legend,
  enabled,
  onToggle
}: {
  legend: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="forma-alert-toggle">
      <span className="forma-alert-legend">{legend}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={legend}
        className={`forma-switch ${enabled ? 'is-on' : ''}`}
        onClick={() => onToggle(!enabled)}
      >
        <span className="forma-switch-knob" />
      </button>
    </div>
  );
}

export default OnboardingTour;
