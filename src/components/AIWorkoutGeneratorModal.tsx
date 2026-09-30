import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, X, Dumbbell, Calendar, CheckCircle2, RefreshCw, Clock,
  AlertTriangle, Square
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { addDays, startOfWeek } from 'date-fns';
import { useData } from '../hooks/useData';
import { WorkoutSession, SessionExercise, Routine } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import ReactMarkdown from 'react-markdown';
import { useReducedMotion } from './performance/useReducedMotion';
import { useModalA11y } from './AIMealVisionModal';

interface AIWorkoutGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineScheduled?: () => void;
}

type Goal = 'hypertrophy' | 'fat_loss' | 'strength' | 'endurance';
type Level = 'beginner' | 'intermediate' | 'advanced';
type Equipment = 'full_gym' | 'home_dumbbells' | 'bodyweight';

const GOALS: { id: Goal; titleEn: string; titleAr: string; descEn: string; descAr: string; icon: string }[] = [
  { id: 'hypertrophy', titleEn: 'Muscle Growth', titleAr: 'بناء العضلات والتضخيم', descEn: 'Maximize hypertrophy & size', descAr: 'أقصى زيادة في الحجم العضلي', icon: '🏋️' },
  { id: 'fat_loss', titleEn: 'Fat Loss & Tone', titleAr: 'خسارة الدهون ونحت الجسم', descEn: 'High burn & calorie deficit support', descAr: 'حرق سعرات عالٍ ودعم التنشيف', icon: '⚡' },
  { id: 'strength', titleEn: 'Raw Strength', titleAr: 'القوة البدنية الخالصة', descEn: 'Heavy compound progression', descAr: 'تركيز على الأوزان والحركات المركبة', icon: '💥' },
  { id: 'endurance', titleEn: 'Endurance & Fitness', titleAr: 'التحمل واللياقة البدنية', descEn: 'Athletic stamina & functional power', descAr: 'لياقة رياضية وقوة وظيفية عالية', icon: '🏃' },
];

const LEVELS: { id: Level; titleEn: string; titleAr: string; descEn: string; descAr: string }[] = [
  { id: 'beginner', titleEn: 'Beginner', titleAr: 'مبتدئ', descEn: '< 1 year training', descAr: 'أقل من سنة خبرة' },
  { id: 'intermediate', titleEn: 'Intermediate', titleAr: 'متوسط', descEn: '1 - 3 years consistent', descAr: '1 - 3 سنوات التزام مستمر' },
  { id: 'advanced', titleEn: 'Advanced', titleAr: 'متقدم', descEn: '3+ years intense lifting', descAr: 'أكثر من 3 سنوات تدريب مكثف' },
];

const EQUIPMENTS: { id: Equipment; titleEn: string; titleAr: string; descEn: string; descAr: string; icon: string }[] = [
  { id: 'full_gym', titleEn: 'Commercial Gym', titleAr: 'نادي رياضي متكامل', descEn: 'Barbells, cables & machines', descAr: 'بارات، أجهزة وكابلات متنوعة', icon: '🏢' },
  { id: 'home_dumbbells', titleEn: 'Home Dumbbells', titleAr: 'دامبلز منزلي', descEn: 'Dumbbells & adjustable bench', descAr: 'دامبلز ومقعد قابل للتعديل', icon: '🏠' },
  { id: 'bodyweight', titleEn: 'Bodyweight', titleAr: 'وزن الجسم', descEn: 'Calisthenics & pull-up bar', descAr: 'تمارين وزن الجسم وعقلة', icon: '🧘' },
];

interface GeneratedSession {
  title: string;
  type: string;
  estimatedMinutes: number;
  exercises: {
    name: string;
    targetMuscle: string;
    sets: number;
    reps: string;
    restSeconds: number;
    coachingCue: string;
  }[];
}

interface GeneratedPlan {
  routineName: string;
  tagline: string;
  scientificRationale: string;
  daysRequired: number;
  sessions: GeneratedSession[];
}

export function AIWorkoutGeneratorModal({ isOpen, onClose, onRoutineScheduled }: AIWorkoutGeneratorModalProps) {
  const { data, saveSessions, saveRoutine } = useData();
  const { t, isRTL, tExercise, tMuscle, tTitle } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [level, setLevel] = useState<Level>('intermediate');
  const [daysCount, setDaysCount] = useState<number>(4);
  const [equipment, setEquipment] = useState<Equipment>('full_gym');
  const [customFocus, setCustomFocus] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [wasAborted, setWasAborted] = useState(false);
  const abortRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [selectedSessionTab, setSelectedSessionTab] = useState<number>(0);

  const [isApplyingToCalendar, setIsApplyingToCalendar] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const GENERATION_STAGES_EN = [
    'Reading your training profile',
    'Selecting movement patterns',
    'Balancing volume and recovery',
    'Writing coaching cues'
  ];
  const GENERATION_STAGES_AR = [
    'قراءة ملفك التدريبي',
    'اختيار أنماط الحركة',
    'موازنة الحجم والاستشفاء',
    'صياغة الإرشادات'
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => {
      setGenerationStage(prev => (prev + 1) % GENERATION_STAGES_EN.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Escape, focus containment, focus restore and the scroll lock all come from
  // the shared hook so this dialog behaves like every other FORMA modal.
  const { panelRef } = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleAbort = () => {
    abortRef.current = true;
    setIsGenerating(false);
    setWasAborted(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStage(0);
    setErrorMessage(null);
    setGeneratedPlan(null);
    setAppliedSuccess(false);
    setSavedSuccess(false);

    const goalObj = GOALS.find(g => g.id === goal);
    const levelObj = LEVELS.find(l => l.id === level);
    const eqObj = EQUIPMENTS.find(e => e.id === equipment);

    const langInstruction = isRTL 
      ? `CRITICAL REQUIREMENT: The user interface is in ARABIC. You MUST write all textual fields ("routineName", "tagline", "scientificRationale", session "title", exercise "name", "targetMuscle", and "coachingCue") in fluent, natural, professional ARABIC (e.g. "تمرين ضغط الصدر بالبار المستوي", "الصدر", "الظهر", etc.).` 
      : `Output all fields in English.`;

    const prompt = `You are a world-class certified strength & conditioning coach (CSCS) and exercise biomechanist.
Design an optimal, science-backed workout program customized for the following athlete profile:

- Primary Goal: ${goalObj?.titleEn} (${goalObj?.descEn})
- Training Experience Level: ${levelObj?.titleEn} (${levelObj?.descEn})
- Desired Frequency: ${daysCount} days per week
- Available Equipment: ${eqObj?.titleEn} (${eqObj?.descEn})
- Specific Focus & Constraints: "${customFocus.trim() || 'Balanced full development, optimal stimulus-to-fatigue ratio'}"
- Crucial Schedule Rule: The gym is strictly closed every Friday. Athletes NEVER train on Friday. Friday must ALWAYS remain an off-day / complete recovery day.
- Crucial Warm-up Rule: Every single workout session MUST start with an aerobic warm-up & cardio exercise as its very first exercise (Exercise 1: "Treadmill Warm-up & Cardio" with targetMuscle: "Cardio", sets: 1, reps: "5-10 min", restSeconds: 60, coachingCue: "Light aerobic warm-up to elevate core temperature and lubricate joints before lifting.").

Structure exactly ${daysCount} training sessions (e.g. Push, Pull, Legs, Upper, Lower, or Full Body depending on frequency).
For each session, provide 4 to 6 biomechanically sound exercises with proper set volumes, target rep ranges, rest times, and coaching cues.

${langInstruction}

Output strictly valid JSON with NO markdown code fences, using this schema:
{
  "routineName": "Creative & motivating routine name",
  "tagline": "Short punchy summary",
  "scientificRationale": "2-3 sentences explaining why this split and movement selection fits the goal and equipment.",
  "daysRequired": ${daysCount},
  "sessions": [
    {
      "title": "Session Name",
      "type": "Strength",
      "estimatedMinutes": 55,
      "exercises": [
        {
          "name": "Barbell Incline Bench Press",
          "targetMuscle": "Chest",
          "sets": 3,
          "reps": "8-10",
          "restSeconds": 90,
          "coachingCue": "Control the eccentric phase for 2 seconds, pause on chest."
        }
      ]
    }
  ]
}`;

    try {
      const parsed = await generateGeminiJson<GeneratedPlan>({ prompt });

      if (abortRef.current) return;

      if (!parsed.sessions || parsed.sessions.length === 0) {
        throw new Error('AI returned an incomplete routine format.');
      }

      setGeneratedPlan(parsed);
      setSelectedSessionTab(0);
    } catch (err: any) {
      if (abortRef.current) return;
      console.error('AI Routine Generation Error:', err);
      const isBusy = err?.message?.includes('503') || err?.message?.includes('high demand');
      setErrorMessage(
        isBusy
          ? (isRTL ? 'الخوادم تشهد ضغطاً مؤقتاً، يرجى المحاولة مرة أخرى بعد ثوانٍ قليلة.' : 'AI servers are experiencing temporary high demand, please try again in a few moments.')
          : (err?.message || (isRTL ? 'تعذر إنشاء الجدول. يرجى التحقق من الاتصال والمحاولة مجدداً.' : 'Failed to generate routine. Please check your internet connection or try again.'))
      );
    } finally {
      if (!abortRef.current) setIsGenerating(false);
    }
  };

  const handleApplyToCalendar = async () => {
    if (!generatedPlan || !data) return;
    setIsApplyingToCalendar(true);

    try {
      // Schedule sessions starting this week (excluding past days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
      const newSessions: WorkoutSession[] = [];

      // Map sessions to appropriate days evenly spaced across the week
      // NOTE: Friday (day 5) is strictly a rest day in FORMA!
      const daySpacingMap: Record<number, number[]> = {
        2: [1, 4], // Mon, Thu
        3: [0, 2, 4], // Sun, Tue, Thu
        4: [0, 1, 3, 4], // Sun, Mon, Wed, Thu
        5: [0, 1, 2, 4, 6], // Sun, Mon, Tue, Thu, Sat (avoid Friday 5)
        6: [0, 1, 2, 3, 4, 6], // Sun, Mon, Tue, Wed, Thu, Sat (avoid Friday 5)
      };

      const targetDays = daySpacingMap[generatedPlan.daysRequired] || [0, 1, 2, 3].slice(0, generatedPlan.daysRequired);

      // If all target days for this week have already passed, start from next week
      const remainingThisWeek = targetDays.filter(dayOffset => addDays(weekStart, dayOffset) >= today);
      if (remainingThisWeek.length === 0) {
        weekStart = addDays(weekStart, 7);
      }

      // Repeat for 4 weeks
      for (let week = 0; week < 4; week++) {
        generatedPlan.sessions.forEach((s, sIndex) => {
          const dayOffset = targetDays[sIndex % targetDays.length];
          const sessionDate = addDays(weekStart, week * 7 + dayOffset);
          sessionDate.setHours(18, 0, 0, 0);

          // CRITICAL: NEVER schedule workouts on past days or on Friday (gym closed)!
          if (sessionDate < today || sessionDate.getDay() === 5) {
            return;
          }

          const formattedExercises: SessionExercise[] = s.exercises.map((ex, eIdx) => {
            const parsedReps = parseInt(ex.reps.split('-')[0]) || 10;
            const setsArr = Array.from({ length: ex.sets || 3 }).map((_, setIdx) => ({
              id: `${Date.now()}-${sIndex}-${eIdx}-${setIdx}`,
              weight: 0,
              repsTarget: parsedReps,
              repsActual: 0,
              unit: data.settings?.weightUnit || 'lb',
              isCompleted: false,
            }));

            return {
              id: `${Date.now()}-${sIndex}-${eIdx}`,
              name: ex.name,
              targetMuscle: ex.targetMuscle,
              restTime: ex.restSeconds || 90,
              notes: ex.coachingCue || '',
              sets: setsArr,
            };
          });

          // Ensure workout strictly starts with cardio warm-up
          const startsWithCardio = formattedExercises.length > 0 && (
            formattedExercises[0].targetMuscle.toLowerCase() === 'cardio' ||
            formattedExercises[0].name.toLowerCase().includes('cardio') ||
            formattedExercises[0].name.toLowerCase().includes('treadmill')
          );

          if (!startsWithCardio) {
            formattedExercises.unshift({
              id: `${Date.now()}-${sIndex}-cardio-warmup`,
              name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
              targetMuscle: 'Cardio',
              restTime: 60,
              notes: '5-10 minutes of light aerobic warm-up to prepare joints and elevate core temperature.',
              duration: 10,
              sets: [{
                id: `${Date.now()}-${sIndex}-cardio-s0`,
                weight: 0,
                repsTarget: 10,
                repsActual: 10,
                unit: data.settings?.weightUnit || 'lb',
                isCompleted: false,
              }]
            });
          }

          newSessions.push({
            id: `ai-${Date.now()}-${week}-${sIndex}`,
            title: s.title,
            date: sessionDate.toISOString(),
            duration: s.estimatedMinutes || 50,
            type: s.type || 'Strength',
            notes: `AI Generated: ${generatedPlan.routineName}`,
            isCompleted: false,
            exercises: formattedExercises,
          });
        });
      }

      await saveSessions(newSessions);
      setAppliedSuccess(true);
      if (onRoutineScheduled) onRoutineScheduled();
    } catch (err: any) {
      console.error('Failed to schedule AI routine:', err);
      setErrorMessage(err.message || 'Failed to apply sessions to calendar.');
    } finally {
      setIsApplyingToCalendar(false);
    }
  };

  const handleSaveToRoutines = async () => {
    if (!generatedPlan || !data) return;

    try {
      const allExercisesTemplate: SessionExercise[] = generatedPlan.sessions.flatMap((s, sIdx) => 
        s.exercises.map((ex, eIdx) => ({
          id: `tpl-${Date.now()}-${sIdx}-${eIdx}`,
          name: ex.name,
          targetMuscle: ex.targetMuscle,
          restTime: ex.restSeconds || 90,
          notes: ex.coachingCue || '',
          sets: Array.from({ length: ex.sets || 3 }).map((_, setIdx) => ({
            id: `${setIdx + 1}`,
            weight: 0,
            repsTarget: parseInt(ex.reps.split('-')[0]) || 10,
            repsActual: 0,
            unit: data.settings?.weightUnit || 'lb',
            isCompleted: false,
          })),
        }))
      );

      const newRoutine: Routine = {
        id: `ai-routine-${Date.now()}`,
        name: generatedPlan.routineName,
        description: `${generatedPlan.tagline}. ${generatedPlan.scientificRationale}`,
        exercises: allExercisesTemplate,
      };

      await saveRoutine(newRoutine);
      setSavedSuccess(true);
    } catch (err: any) {
      console.error('Failed to save routine:', err);
      setErrorMessage(err.message || 'Failed to save to routines.');
    }
  };

  return createPortal(
    <div 
      className="portal-modal-backdrop"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 15 }}
        animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={isRTL ? 'صانع الجداول بالذكاء الاصطناعي' : 'AI Workout Generator'}
        tabIndex={-1}
        className="card modal-card ai-generator-modal-card"
        style={{
          maxWidth: '750px',
          maxHeight: 'calc(100dvh - 1.5rem)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
          textAlign: isRTL ? 'right' : 'left'
        }}
      >
        <div className="modal-drag-handle" />
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(70, 217, 255, 0.1), rgba(139, 92, 246, 0.08))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {isRTL ? 'صانع الجداول بالذكاء الاصطناعي' : 'AI Workout Generator'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isRTL ? 'خطط تدريب مخصصة ومبنية علمياً بواسطة ذكاء Gemini' : 'Scientifically customized training plans built by Gemini AI'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon btn-ghost touch-target"
            onClick={onClose}
            aria-label={isRTL ? 'إغلاق' : 'Close'}
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
          {errorMessage && (
            <div className="forma-ai-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} aria-hidden="true" />
                {isRTL ? 'تعذر توليد الجدول' : 'Routine generation failed'}
              </strong>
              <span>{errorMessage}</span>
              <button
                type="button"
                className="forma-figure-toggle"
                style={{ marginBlockStart: '0.25rem' }}
                onClick={handleGenerate}
              >
                <RefreshCw size={12} aria-hidden="true" />
                <span>{isRTL ? 'إعادة المحاولة' : 'Try again'}</span>
              </button>
            </div>
          )}

          {wasAborted && !errorMessage && (
            <div className="forma-state-panel" role="status" style={{ marginBottom: '1.25rem' }}>
              <strong>{isRTL ? 'تم إيقاف التوليد' : 'Generation stopped'}</strong>
              <span>{isRTL ? 'يمكنك تعديل الإجابات ثم المحاولة مرة أخرى.' : 'Adjust your answers and try again whenever you are ready.'}</span>
            </div>
          )}

          {isGenerating && (
            <div className="forma-state-panel" role="status" aria-live="polite" style={{ marginBottom: '1.25rem' }}>
              <span aria-hidden="true" className="forma-ai-cursor" style={{ margin: 0 }} />
              <strong>
                {(isRTL ? GENERATION_STAGES_AR : GENERATION_STAGES_EN)[generationStage]}…
              </strong>
              <span>
                {isRTL
                  ? 'قد يستغرق التصميم الاحترافي بضع ثوانٍ.'
                  : 'A science-backed split usually takes a few seconds.'}
              </span>
            </div>
          )}

          {!generatedPlan ? (
            /* Questionnaire View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Goal */}
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                  {isRTL ? '1. الهدف التدريبي الأساسي' : '1. Primary Training Goal'}
                </legend>
                <div role="radiogroup" aria-label={isRTL ? 'الهدف التدريبي' : 'Training goal'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
                  {GOALS.map((g) => {
                    const isSelected = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setGoal(g.id)}
                        style={{
                          minHeight: '64px',
                          padding: '0.85rem',
                          borderRadius: '10px',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                          background: isSelected ? 'var(--premium-soft)' : 'var(--bg-tertiary)',
                          textAlign: isRTL ? 'right' : 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.3rem' }} aria-hidden="true">{g.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {isRTL ? g.titleAr : g.titleEn}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {isRTL ? g.descAr : g.descEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Experience Level */}
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                  {isRTL ? '2. مستوى الخبرة في رفع الأثقال' : '2. Lifting Experience Level'}
                </legend>
                <div role="radiogroup" aria-label={isRTL ? 'مستوى الخبرة' : 'Experience level'} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {LEVELS.map((l) => {
                    const isSelected = level === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setLevel(l.id)}
                        style={{
                          minHeight: '64px',
                          padding: '0.75rem',
                          borderRadius: '10px',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                          background: isSelected ? 'var(--premium-soft)' : 'var(--bg-tertiary)',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {isRTL ? l.titleAr : l.titleEn}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {isRTL ? l.descAr : l.descEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Frequency & Equipment Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Days Per Week */}
                <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                  <legend style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                    {isRTL ? '3. عدد أيام التمرين بالأسبوع' : '3. Frequency (Days/Week)'}
                  </legend>
                  <div role="radiogroup" aria-label={isRTL ? 'أيام التمرين أسبوعياً' : 'Days per week'} style={{ display: 'flex', gap: '0.5rem' }}>
                    {[2, 3, 4, 5, 6].map((num) => {
                      const isSelected = daysCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`${num} ${isRTL ? 'أيام' : 'days per week'}`}
                          onClick={() => setDaysCount(num)}
                          style={{
                            flex: 1,
                            minHeight: '52px',
                            padding: '0.65rem 0.25rem',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                            background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: isSelected ? '#000' : 'var(--text-primary)',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {num}{isRTL ? ' أيام' : 'd'}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Equipment */}
                <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                  <legend style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                    {isRTL ? '4. المعدات المتاحة' : '4. Available Equipment'}
                  </legend>
                  <div role="radiogroup" aria-label={isRTL ? 'المعدات' : 'Equipment'} style={{ display: 'flex', gap: '0.5rem' }}>
                    {EQUIPMENTS.map((eq) => {
                      const isSelected = equipment === eq.id;
                      return (
                        <button
                          key={eq.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setEquipment(eq.id)}
                          style={{
                            flex: 1,
                            minHeight: '68px',
                            padding: '0.65rem 0.35rem',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                            background: isSelected ? 'var(--premium-soft)' : 'var(--bg-tertiary)',
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span aria-hidden="true">{eq.icon}</span>
                          <span>{isRTL ? eq.titleAr.split(' ')[0] : eq.titleEn.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              {/* Custom Focus */}
              <div>
                <label htmlFor="ai-routine-focus" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  {isRTL ? '5. تركيز خاص أو نقاط ضعف (اختياري)' : '5. Focus Areas & Special Requests (Optional)'}
                </label>
                <input
                  id="ai-routine-focus"
                  type="text"
                  className="input"
                  placeholder={isRTL ? 'مثال: التركيز على الصدر والذراعين، تجنب إجهاد أسفل الظهر...' : 'e.g. Focus on chest and arms, avoid lower back strain, prioritize compound lifts...'}
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  style={{ width: '100%', minHeight: '48px', borderRadius: '10px', textAlign: isRTL ? 'right' : 'left' }}
                />
              </div>

              {/* Submit Generator Button */}
              {isGenerating ? (
                <button
                  type="button"
                  className="btn"
                  onClick={handleAbort}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    minHeight: '56px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    borderRadius: '12px',
                    background: 'color-mix(in srgb, var(--danger) 18%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)',
                    color: 'var(--danger)'
                  }}
                >
                  <Square size={16} fill="currentColor" aria-hidden="true" />
                  <span>{isRTL ? 'إيقاف التوليد' : 'Stop generating'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    minHeight: '56px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    borderRadius: '12px',
                    boxShadow: '0 8px 25px rgba(14, 165, 233, 0.35)',
                  }}
                >
                  <Sparkles size={18} aria-hidden="true" />
                  <span>{isRTL ? 'توليد جدول احترافي بالذكاء الاصطناعي' : 'Generate My Science-Backed Split'}</span>
                </button>
              )}
              {isGenerating && (
                <span
                  className="forma-sr-only"
                  role="status"
                  aria-live="polite"
                >
                  {isRTL ? 'جاري تصميم برنامجك المخصص عبر ذكاء Gemini' : 'Designing your custom program with Gemini AI'}
                </span>
              )}
            </div>
          ) : (
            /* Generated Routine View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Routine Header Card */}
              <div style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(70, 217, 255, 0.12), rgba(139, 92, 246, 0.12))',
                border: '1px solid rgba(70, 217, 255, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                    color: 'var(--accent-primary)', letterSpacing: '0.05em'
                  }}>
                    {isRTL ? `البرنامج الذكي المُولَّد · تقسيم ${generatedPlan.daysRequired} أيام` : `Generated AI Program · ${generatedPlan.daysRequired} Days Split`}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                    {isRTL ? '✓ جاهز للتمرين' : '✓ Ready to Train'}
                  </span>
                </div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
                  {tTitle(generatedPlan.routineName)}
                </h2>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {generatedPlan.tagline}
                </p>
                <div className="forma-ai-stream" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>{isRTL ? 'التفسير التدريبي:' : 'Coach Rationale:'}</strong>
                  <ReactMarkdown>{generatedPlan.scientificRationale}</ReactMarkdown>
                </div>
              </div>

              {/* Day Tabs */}
              <div>
                <div role="tablist" aria-label={isRTL ? 'أيام البرنامج' : 'Program days'} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {generatedPlan.sessions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={selectedSessionTab === idx}
                      onClick={() => setSelectedSessionTab(idx)}
                      style={{
                        minHeight: '48px',
                        padding: '0.55rem 0.9rem',
                        borderRadius: '8px',
                        border: selectedSessionTab === idx ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                        background: selectedSessionTab === idx ? 'var(--premium-soft)' : 'var(--bg-tertiary)',
                        color: selectedSessionTab === idx ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isRTL ? `اليوم ${idx + 1}: ${tTitle(s.title.split('-')[0].trim())}` : `Day ${idx + 1}: ${s.title.split('-')[0].trim()}`}
                    </button>
                  ))}
                </div>

                {/* Active Session Content */}
                {generatedPlan.sessions[selectedSessionTab] && (
                  <div style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    marginTop: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                        {tTitle(generatedPlan.sessions[selectedSessionTab].title)}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> ~{generatedPlan.sessions[selectedSessionTab].estimatedMinutes || 50} {t('min')}
                      </span>
                    </div>

                    {/* Exercises List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {generatedPlan.sessions[selectedSessionTab].exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {exIdx + 1}. {tExercise(ex.name)}
                            </span>
                            <span style={{
                              fontSize: '0.72rem', background: 'rgba(70, 217, 255, 0.1)',
                              color: 'var(--accent-primary)', padding: '0.15rem 0.5rem', borderRadius: '4px'
                            }}>
                              {tMuscle(ex.targetMuscle)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span><strong>{ex.sets}</strong> {t('sets')} × <strong>{ex.reps}</strong> {t('reps')}</span>
                            <span>{isRTL ? 'الراحة:' : 'Rest:'} <strong>{ex.restSeconds}{isRTL ? ' ث' : 's'}</strong></span>
                          </div>

                          {ex.coachingCue && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              🎯 {ex.coachingCue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status alerts */}
              {appliedSuccess && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <CheckCircle2 size={18} />
                  <span>{isRTL ? 'تمت جدولة البرنامج بنجاح في تقويمك للأربعة أسابيع القادمة!' : 'Program successfully scheduled on your Calendar for the next 4 weeks!'}</span>
                </div>
              )}

              {savedSuccess && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <CheckCircle2 size={18} />
                  <span>{isRTL ? 'تم حفظ الجدول في قوالبك الخاصة بقسم الجداول!' : 'Routine saved to your custom templates in Routines!'}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyToCalendar}
                  disabled={isApplyingToCalendar || appliedSuccess}
                  style={{
                    flex: '1 1 200px',
                    padding: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Calendar size={18} />
                  {isApplyingToCalendar 
                    ? (isRTL ? 'جاري الجدولة...' : 'Scheduling...') 
                    : appliedSuccess 
                    ? (isRTL ? 'تمت الإضافة للتقويم' : 'Applied to Calendar') 
                    : (isRTL ? 'تطبيق فوراً على التقويم' : 'Apply Directly to Calendar')}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveToRoutines}
                  disabled={savedSuccess}
                  style={{
                    flex: '1 1 180px',
                    padding: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Dumbbell size={18} />
                  {savedSuccess ? (isRTL ? 'تم الحفظ في الجداول' : 'Saved to Routines') : (isRTL ? 'حفظ كجدول' : 'Save as Routine')}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setGeneratedPlan(null)}
                  style={{
                    padding: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <RefreshCw size={16} /> {isRTL ? 'تعديل / إعادة التوليد' : 'Tweak / Re-generate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default AIWorkoutGeneratorModal;
