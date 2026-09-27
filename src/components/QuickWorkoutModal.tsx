import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Zap, ChevronRight, Flame, HeartPulse, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import { addDays } from 'date-fns';
import { useTranslation } from '../lib/i18n';
import type { WorkoutSession, SessionExercise } from '../lib/api';
import { getExerciseTutorial } from '../lib/exerciseDatabase';

interface QuickWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (session: Partial<WorkoutSession>) => void;
  weightUnit?: 'kg' | 'lb';
  restSeconds?: number;
}

export function QuickWorkoutModal({
  isOpen,
  onClose,
  onAdd,
  weightUnit = 'kg',
  restSeconds = 90
}: QuickWorkoutModalProps) {
  const { t, isRTL } = useTranslation();
  const isFriday = new Date().getDay() === 5;

  const presets = [
    {
      id: 'push-express',
      titleAr: 'تمرين الصدر والترايسبس السريع',
      titleEn: 'Push Express (Chest & Triceps)',
      type: 'Strength',
      duration: 40,
      icon: Dumbbell,
      color: '#38bdf8',
      exercises: [
        { name: 'Treadmill Warm-up & Cardio', muscle: 'Cardio', duration: 10 },
        { name: 'Barbell Bench Press', muscle: 'Chest' },
        { name: 'Incline Dumbbell Press', muscle: 'Chest' },
        { name: 'Chest Cable Fly', muscle: 'Chest' },
        { name: 'Dips', muscle: 'Chest' },
        { name: 'Push-ups', muscle: 'Chest' }
      ]
    },
    {
      id: 'pull-express',
      titleAr: 'تمرين الظهر والبايسبس السريع',
      titleEn: 'Pull Express (Back & Biceps)',
      type: 'Strength',
      duration: 40,
      icon: Zap,
      color: '#a855f7',
      exercises: [
        { name: 'Treadmill Warm-up & Cardio', muscle: 'Cardio', duration: 10 },
        { name: 'Lat Pulldown', muscle: 'Back' },
        { name: 'Seated Cable Row', muscle: 'Back' },
        { name: 'Dumbbell Bicep Curl', muscle: 'Arms' },
        { name: 'Face Pull', muscle: 'Shoulders' }
      ]
    },
    {
      id: 'legs-express',
      titleAr: 'تمرين الأرجل القوي السريع',
      titleEn: 'Legs & Glutes Express',
      type: 'Strength',
      duration: 45,
      icon: Flame,
      color: '#f97316',
      exercises: [
        { name: 'Treadmill Warm-up & Cardio', muscle: 'Cardio', duration: 10 },
        { name: 'Barbell Squat', muscle: 'Legs' },
        { name: 'Leg Press', muscle: 'Legs' },
        { name: 'Romanian Deadlift', muscle: 'Legs' },
        { name: 'Standing Calf Raises', muscle: 'Legs' }
      ]
    },
    {
      id: 'shoulders-arms',
      titleAr: 'تمرين الأكتاف والذراعين',
      titleEn: 'Shoulders & Arms Blast',
      type: 'Strength',
      duration: 35,
      icon: Dumbbell,
      color: '#eab308',
      exercises: [
        { name: 'Treadmill Warm-up & Cardio', muscle: 'Cardio', duration: 10 },
        { name: 'Overhead Dumbbell Press', muscle: 'Shoulders' },
        { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders' },
        { name: 'Barbell Bicep Curl', muscle: 'Arms' },
        { name: 'Overhead Tricep Extension', muscle: 'Arms' }
      ]
    },
    {
      id: 'cardio-burn',
      titleAr: 'كارديو وحرق دهون 25 دقيقة',
      titleEn: 'Cardio Burn & Treadmill',
      type: 'Cardio',
      duration: 25,
      icon: HeartPulse,
      color: '#ef4444',
      exercises: [
        { name: 'Treadmill Running', muscle: 'Cardio', duration: 25 }
      ]
    }
  ];

  const handleSelectPreset = (preset: typeof presets[0]) => {
    const sessionExercises: SessionExercise[] = preset.exercises.map((ex, exIdx) => {
      const tutorial = getExerciseTutorial(ex.name, ex.muscle);
      return {
        id: `ex-${Date.now()}-${exIdx}`,
        name: ex.name,
        targetMuscle: ex.muscle,
        restTime: restSeconds,
        notes: '',
        videoUrl: tutorial.videoUrl,
        duration: 'duration' in ex ? (ex.duration as number) : undefined,
        sets: 'duration' in ex ? [] : [
          { id: `s-${Date.now()}-1`, weight: 0, repsTarget: 10, repsActual: 0, unit: weightUnit, isCompleted: false },
          { id: `s-${Date.now()}-2`, weight: 0, repsTarget: 10, repsActual: 0, unit: weightUnit, isCompleted: false },
          { id: `s-${Date.now()}-3`, weight: 0, repsTarget: 10, repsActual: 0, unit: weightUnit, isCompleted: false }
        ]
      };
    });

    // If today is Friday, gym is closed, so schedule for tomorrow (Saturday)
    const targetDate = isFriday ? addDays(new Date(), 1) : new Date();
    if (isFriday) targetDate.setHours(18, 0, 0, 0);

    const session: Partial<WorkoutSession> = {
      id: Date.now().toString(),
      title: isRTL ? preset.titleAr : preset.titleEn,
      date: targetDate.toISOString(),
      duration: preset.duration,
      type: preset.type,
      notes: isRTL 
        ? (isFriday ? 'تمت الجدولة ليوم السبت لأن الجيم مغلق الجمعة' : 'تمرين سريع فوري') 
        : (isFriday ? 'Scheduled for Saturday (Gym closed on Friday)' : 'Quick instant workout'),
      isCompleted: false,
      exercises: sessionExercises
    };

    onAdd(session);
    onClose();
  };

  const handleCustomEmpty = () => {
    const targetDate = isFriday ? addDays(new Date(), 1) : new Date();
    if (isFriday) targetDate.setHours(18, 0, 0, 0);

    const session: Partial<WorkoutSession> = {
      id: Date.now().toString(),
      title: isRTL ? 'تمرين حر مخصص' : 'Custom Quick Session',
      date: targetDate.toISOString(),
      duration: 45,
      type: 'Mixed',
      notes: isRTL 
        ? (isFriday ? 'تمت الجدولة ليوم السبت لأن الجيم مغلق الجمعة' : '') 
        : (isFriday ? 'Scheduled for Saturday (Gym closed on Friday)' : ''),
      isCompleted: false,
      exercises: []
    };

    onAdd(session);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-secondary, #131824)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                padding: '0.45rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                color: '#818cf8',
                display: 'flex'
              }}>
                <Zap size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {isRTL ? 'بدء تمرين سريع فوري' : 'Start Quick Workout'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isRTL ? 'اختر قالباً جاهزاً أو ابدأ جلسة مخصصة' : 'Choose a ready preset or start custom session'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={onClose}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Friday Gym Closed Notice */}
          {isFriday && (
            <div style={{
              margin: '1rem 1.5rem 0',
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#ef4444' }}>
                  {isRTL ? 'الجمعة عطلة أسبوعية — الجيم مغلق' : 'Friday Off-Day — Gym Closed'}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {isRTL 
                    ? 'سيتم جدولة هذا التمرين ليوم غد (السبت) تلقائياً لأن الجيم مغلق اليوم.' 
                    : 'This workout will be automatically scheduled for tomorrow (Saturday) because the gym is closed today.'}
                </p>
              </div>
            </div>
          )}

          {/* Preset list */}
          <div style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {presets.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 0.2s ease',
                    gap: '1rem'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.borderColor = p.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      padding: '0.6rem',
                      borderRadius: '12px',
                      background: `${p.color}15`,
                      color: p.color,
                      display: 'flex'
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {isRTL ? p.titleAr : p.titleEn}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {p.exercises.length} {t('exercises')} · ~{p.duration} {t('min')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                </button>
              );
            })}

            {/* Custom empty workout */}
            <button
              type="button"
              onClick={handleCustomEmpty}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.9rem',
                borderRadius: '14px',
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <Plus size={16} />
              <span>{isRTL ? 'إنشاء تمرين حر فارغ' : 'Create Custom Empty Workout'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
