import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Check, Play, Pause, Trash2, X, 
  CirclePlay, ChevronRight, ChevronLeft, Sparkles, Dumbbell, 
  RotateCcw, Info, CheckCircle2, Bell
} from 'lucide-react';
import { WorkoutSession, SetRecord, SessionExercise } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { notify } from '../lib/feedback';
import { useWakeLock } from '../hooks/useWakeLock';
import { selectPreviousPerformance } from '../lib/selectors';
import { GymFloorSetCard } from '../components/mobile/GymFloorSetCard';

const DEFAULT_EXERCISES = [
  { name: 'Treadmill', targetMuscle: 'Cardio' },
  { name: 'Stationary Bike', targetMuscle: 'Cardio' },
  { name: 'Stairmaster', targetMuscle: 'Cardio' },
  { name: 'Elliptical', targetMuscle: 'Cardio' },
  { name: 'Rowing Machine', targetMuscle: 'Cardio' },
  { 
    name: 'Seated Machine Chest Press', 
    targetMuscle: 'Chest', 
    notes: 'يستهدف منتصف الصدر لبناء الكتلة العضلية الإجمالية. اسحب كتفيك للخلف وللأسفل وادفع بالصدر دون قفل الكوعين بالكامل.' 
  },
  { 
    name: 'Incline Machine Chest Press', 
    targetMuscle: 'Chest', 
    notes: 'تمرين أساسي لتطوير الجزء العلوي من الصدر. اضبط المقعد لتكون المقابض بمستوى أعلى الصدر.' 
  },
  { 
    name: 'High-to-Low Cable Crossover', 
    targetMuscle: 'Chest', 
    notes: 'استهداف الجزء السفلي والداخلي للصدر بتمدد وانقباض كامل ومستمر عبر الكيبل.' 
  },
  { name: 'Lat Pulldown', targetMuscle: 'Back' },
  { name: 'Barbell Row', targetMuscle: 'Back' },
  { 
    name: 'Wide-Grip Lat Pulldown', 
    targetMuscle: 'Back', 
    notes: 'يستهدف العضلة الظهرية العريضة (المجنص) لعرض الظهر V-Shape. اسحب باتجاه أعلى الصدر.' 
  },
  { 
    name: 'Seated Cable Row', 
    targetMuscle: 'Back', 
    notes: 'يركز على منتصف وسماكة الظهر. اعصر لوحي الكتف للخلف مع استقامة العمود الفقري.' 
  },
  { 
    name: 'Chest-Supported Machine Row', 
    targetMuscle: 'Back', 
    notes: 'عزل تام لعضلات الظهر بدون ضغط على الفقرات القطنية.' 
  },
  { 
    name: 'Back Extension', 
    targetMuscle: 'Back', 
    notes: 'تقوية عضلات أسفل الظهر وحماية العمود الفقري.' 
  },
  { name: 'Machine Shoulder Press', targetMuscle: 'Shoulders', notes: 'بناء حجم الكتف الشامل. ميل الكوعين للأمام 45 درجة لحماية المفصل.' },
  { name: 'Cable Lateral Raise', targetMuscle: 'Shoulders', notes: 'السر للحصول على أكتاف عريضة 3D مع شد متواصل عبر الكيبل.' },
  { name: 'Reverse Pec Deck Machine', targetMuscle: 'Shoulders', notes: 'عزل الكتف الخلفي بامتياز لتحسين استقامة الوقفة وشكل الكتف.' },
  { name: 'Barbell Back Squat', targetMuscle: 'Legs' },
  { name: 'Leg Press', targetMuscle: 'Legs' },
  { name: 'Romanian Deadlift', targetMuscle: 'Legs' },
  { name: 'Machine Preacher Curl', targetMuscle: 'Biceps', notes: 'عزل البايسيبس بالكامل ومنع الأرجحة بفضل وسادة التثبيت.' },
  { name: 'Behind-The-Back Cable Curl', targetMuscle: 'Biceps', notes: 'تمدد قوي للرأس الطويل لبناء قمة عضلة البايسيبس.' },
  { name: 'Rope Cable Hammer Curl', targetMuscle: 'Biceps', notes: 'استهداف العضلة العضدية لزيادة سمك وعرض الذراع.' },
  { name: 'Cable Rope Triceps Pushdown', targetMuscle: 'Triceps', notes: 'استهداف الرأس الجانبي للترايسيبس للحصول على مظهر حدوة الحصان.' },
  { name: 'Overhead Cable Triceps Extension', targetMuscle: 'Triceps', notes: 'تمدد كامل للرأس الطويل المسؤول عن الحجم الأكبر للذراع.' },
  { name: 'Triceps Dip Machine', targetMuscle: 'Triceps', notes: 'استهداف شامل ومكثف للترايسيبس بأمان وثبات.' },
  { name: 'Cable Reverse Curl', targetMuscle: 'Forearms' },
  { name: 'Cable Wrist Curl', targetMuscle: 'Forearms' },
  { name: 'Kneeling Cable Crunch', targetMuscle: 'Core', notes: 'ثني الجذع بعضلات البطن فقط مع ثبات الحوض لبناء العضلات السداسية.' },
  { name: 'Ab Crunch Machine', targetMuscle: 'Core', notes: 'عزل متقدم ومريح للبطن مع دعم كامل للظهر.' }
];

export function SessionDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, saveSession, deleteSession, finishWorkoutSession } = useData();
  const { t, formatDate, tTitle, tExercise, tMuscle, isRTL } = useTranslation();

  // Screen Wake Lock: keeps mobile display on during workout session
  useWakeLock(true);

  const session = useMemo(() => {
    return data?.sessions?.find(s => s.id === id) || null;
  }, [data?.sessions, id]);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');

  // Smart Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showRestCelebration, setShowRestCelebration] = useState(false);

  // Cardio execution state
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioSeconds, setCardioSeconds] = useState(0);

  // Modals & Drawers
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showNotesAccordion, setShowNotesAccordion] = useState(false);

  // Rest Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimerSeconds !== null && restTimerSeconds > 0 && !isTimerPaused) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimerSeconds === 0) {
      if (data?.settings?.soundAlerts !== false) {
        gymAudio.playRestTimerChime();
      }
      if (data?.settings?.vibrationAlerts !== false) {
        gymAudio.triggerVibration();
      }
      setShowRestCelebration(true);
      const timeout = setTimeout(() => setShowRestCelebration(false), 4000);
      setRestTimerSeconds(null);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [restTimerSeconds, isTimerPaused, data?.settings?.soundAlerts, data?.settings?.vibrationAlerts]);

  // Cardio timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cardioRunning) {
      interval = setInterval(() => {
        setCardioSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cardioRunning]);

  const exercises = useMemo(() => session?.exercises || [], [session?.exercises]);

  // Group exercises by muscle
  const muscleGroups = useMemo(() => {
    const map = new Map<string, SessionExercise[]>();
    exercises.forEach(ex => {
      const muscle = ex.targetMuscle || 'Other';
      if (!map.has(muscle)) map.set(muscle, []);
      map.get(muscle)!.push(ex);
    });
    return Array.from(map.entries()).map(([muscle, items]) => ({
      muscle,
      count: items.length
    }));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (selectedMuscleFilter === 'all') return exercises;
    return exercises.filter(ex => ex.targetMuscle === selectedMuscleFilter);
  }, [exercises, selectedMuscleFilter]);

  // Current active exercise in focus mode
  const currentExercise = exercises[activeExerciseIndex] || exercises[0];

  // Progressive Overload reference for current exercise
  const previousRecord = useMemo(() => {
    if (!data || !currentExercise?.name) return null;
    return selectPreviousPerformance(currentExercise.name, data, session?.id);
  }, [data, currentExercise?.name, session?.id]);

  // Selected Set Index for floor mode focus
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);

  // Auto-derived active set index
  const activeSetIndex = useMemo(() => {
    if (selectedSetIndex !== null && currentExercise?.sets?.[selectedSetIndex]) {
      return selectedSetIndex;
    }
    if (!currentExercise?.sets) return 0;
    const firstUnfinished = currentExercise.sets.findIndex(s => !s.isCompleted);
    return firstUnfinished !== -1 ? firstUnfinished : Math.max(0, currentExercise.sets.length - 1);
  }, [selectedSetIndex, currentExercise?.sets]);

  // Reset selected set when exercise changes
  useEffect(() => {
    setSelectedSetIndex(null);
  }, [activeExerciseIndex]);

  const handleUpdateSession = async (updatedSession: WorkoutSession) => {
    if (!data) return;
    await saveSession(updatedSession);
  };

  if (!session) {
    return (
      <div className="page-surface session-detail-container flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Dumbbell className="w-10 h-10 animate-bounce" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>{t('loading') || 'Loading workout session...'}</p>
      </div>
    );
  }

  // Set updates
  const updateSet = (exerciseIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
    if (!session) return;
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIdx) return exercise;
      const updatedSets = (exercise.sets || []).map((set, sIdx) => {
        if (sIdx !== setIdx) return set;
        return { ...set, [field]: value };
      });
      return { ...exercise, sets: updatedSets };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  // Toggle Set Complete with Smart Auto-fill & Smart Rest Timer
  const handleToggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    if (!session) return;
    const currentEx = session.exercises[exerciseIdx];
    const currentSet = currentEx.sets[setIdx];
    const nextState = !currentSet.isCompleted;

    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIdx) return exercise;
      const updatedSets = exercise.sets.map((set, sIdx) => {
        if (sIdx === setIdx) {
          return { ...set, isCompleted: nextState };
        }
        // Auto-fill next uncompleted set with current set's weight and reps
        if (nextState && sIdx === setIdx + 1 && !set.isCompleted) {
          return {
            ...set,
            weight: set.weight === 0 ? currentSet.weight : set.weight,
            repsActual: set.repsActual === 0 ? currentSet.repsActual || set.repsTarget : set.repsActual,
            unit: currentSet.unit
          };
        }
        return set;
      });
      return { ...exercise, sets: updatedSets };
    });

    handleUpdateSession({ ...session, exercises: updatedExercises });

    if (nextState) {
      // Auto-advance active set index if completing
      const nextUncompletedIdx = currentEx.sets.findIndex((s, i) => i > setIdx && !s.isCompleted);
      if (nextUncompletedIdx !== -1) {
        setSelectedSetIndex(nextUncompletedIdx);
      }

      // Play audio & vibration
      gymAudio.playSetCompleteChime();
      gymAudio.triggerSubtleHaptic([30, 45]);

      // Trigger Smart Rest Timer
      const restSec = currentEx.restTime || data?.settings?.restTimerSeconds || 90;
      setRestTimerSeconds(restSec);
      setIsTimerPaused(false);
    }
  };

  // Quick weight adjustment
  const handleQuickWeightAdjust = (exerciseIdx: number, setIdx: number, delta: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    const set = ex.sets[setIdx];
    const nextWeight = Math.max(0, Math.round(((set.weight || 0) + delta) * 10) / 10);
    updateSet(exerciseIdx, setIdx, 'weight', nextWeight);
    gymAudio.triggerSubtleHaptic([15]);
  };

  // Quick rep adjustment
  const handleQuickRepAdjust = (exerciseIdx: number, setIdx: number, delta: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    const set = ex.sets[setIdx];
    const currentReps = set.repsActual > 0 ? set.repsActual : set.repsTarget || 10;
    const nextReps = Math.max(1, currentReps + delta);
    updateSet(exerciseIdx, setIdx, 'repsActual', nextReps);
    gymAudio.triggerSubtleHaptic([15]);
  };

  const addSet = (exerciseIdx: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    const lastSet = ex.sets?.[ex.sets.length - 1];
    
    const newSet: SetRecord = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      weight: lastSet ? lastSet.weight : 0,
      repsTarget: lastSet ? lastSet.repsTarget : 10,
      repsActual: lastSet ? lastSet.repsActual : 0,
      unit: lastSet ? lastSet.unit : (data?.settings?.weightUnit || 'kg'),
      isCompleted: false
    };

    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIdx) return exercise;
      return {
        ...exercise,
        sets: [...(exercise.sets || []), newSet]
      };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const deleteSet = (exerciseIdx: number, setIdx: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    if (!ex || !ex.sets || ex.sets.length <= 1) return;
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIdx) return exercise;
      return {
        ...exercise,
        sets: exercise.sets.filter((_, s) => s !== setIdx)
      };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  };

  const deleteExercise = (exerciseIdx: number) => {
    if (!session) return;
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا التمرين؟' : 'Delete this exercise?')) return;
    const updated = session.exercises.filter((_, idx) => idx !== exerciseIdx);
    handleUpdateSession({ ...session, exercises: updated });
    if (activeExerciseIndex >= updated.length) {
      setActiveExerciseIndex(Math.max(0, updated.length - 1));
    }
  };

  // "Complete Exercise" Button Logic requested by user:
  // Completes all sets of the exercise, celebrates, and automatically goes to next exercise!
  const handleCompleteCurrentExercise = () => {
    if (!session || !currentExercise) return;
    
    // Mark all sets of this exercise as completed
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== activeExerciseIndex) return exercise;
      const completedSets = exercise.sets.map(s => ({
        ...s,
        isCompleted: true,
        repsActual: s.repsActual > 0 ? s.repsActual : (s.repsTarget || 10)
      }));
      return { ...exercise, sets: completedSets };
    });

    handleUpdateSession({ ...session, exercises: updatedExercises });
    gymAudio.playCelebrationFanfare();
    gymAudio.triggerVibration([50, 40, 70]);

    // If there is a next exercise, automatically go to it!
    if (activeExerciseIndex < session.exercises.length - 1) {
      setActiveExerciseIndex(prev => prev + 1);
      notify(
        isRTL 
          ? `رائع! تم إنهاء ${tExercise(currentExercise.name)} والبدء في التالي.` 
          : `Exercise completed! Next: ${tExercise(session.exercises[activeExerciseIndex + 1]?.name)}`,
        'success'
      );
    } else {
      // Last exercise finished! Offer to finish the entire workout
      notify(
        isRTL ? 'أحسنت! أنهيت جميع التمارين، يمكنك إنهاء الجلسة الآن.' : 'All exercises completed! You can now finish the workout.',
        'success'
      );
    }
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    if (!session) return;
    const updatedSession = { ...session, isCompleted: true };
    await finishWorkoutSession(updatedSession);
    gymAudio.playCelebrationFanfare();
    notify(isRTL ? 'تهانينا! تم حفظ التمرين في السجل بنجاح 🎉' : 'Workout completed and logged to History! 🎉', 'success');
    navigate('/today', { replace: true });
  };

  const handleAddExerciseTemplate = (template: { name: string; targetMuscle: string; notes?: string }) => {
    if (!session) return;
    const newEx: SessionExercise = {
      id: `ex-${Date.now()}`,
      name: template.name,
      targetMuscle: template.targetMuscle,
      restTime: data?.settings?.restTimerSeconds || 90,
      notes: template.notes || '',
      sets: [
        { id: `s-${Date.now()}-1`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false },
        { id: `s-${Date.now()}-2`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false },
        { id: `s-${Date.now()}-3`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false }
      ]
    };
    handleUpdateSession({
      ...session,
      exercises: [...(session.exercises || []), newEx]
    });
    setIsAddExerciseModalOpen(false);
    setActiveExerciseIndex(session.exercises.length);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isCardio = currentExercise?.targetMuscle === 'Cardio';
  const isAllCurrentSetsDone = currentExercise?.sets?.every(s => s.isCompleted);
  const isLastExercise = activeExerciseIndex === session.exercises.length - 1;

  return (
    <div className="page-surface session-detail-container flex-col" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* 1. Header Bar */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '0.75rem', 
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: '18px',
        background: 'rgba(18, 24, 38, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button"
            className="btn-icon btn-ghost" 
            onClick={() => navigate('/today')}
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Back to Today"
          >
            <ArrowLeft className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {tTitle(session.title)}
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {formatDate(new Date(session.date), 'EEEE, d MMMM')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleFinishWorkout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.825rem',
              borderRadius: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Check className="w-4 h-4" />
            <span>{t('finishWorkout')}</span>
          </button>

          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={async () => {
              if (confirm(t('deleteSessionConfirm'))) {
                await deleteSession(session.id);
                navigate('/today');
              }
            }}
            style={{ color: 'var(--text-muted)' }}
            title={t('deleteSession')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Muscle Group Selector & Separation */}
      <section style={{ marginBottom: '1rem' }} aria-label="Muscle Group Filter">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedMuscleFilter('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: selectedMuscleFilter === 'all' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
              background: selectedMuscleFilter === 'all' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255,255,255,0.04)',
              color: selectedMuscleFilter === 'all' ? '#38bdf8' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {isRTL ? 'جميع العضلات' : 'All Muscles'} ({exercises.length})
          </button>

          {muscleGroups.map(group => (
            <button
              key={group.muscle}
              type="button"
              onClick={() => {
                setSelectedMuscleFilter(group.muscle);
                const firstIdx = exercises.findIndex(e => e.targetMuscle === group.muscle);
                if (firstIdx !== -1) setActiveExerciseIndex(firstIdx);
              }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: selectedMuscleFilter === group.muscle ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                background: selectedMuscleFilter === group.muscle ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedMuscleFilter === group.muscle ? '#34d399' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {tMuscle(group.muscle)} ({group.count})
            </button>
          ))}
        </div>
      </section>

      {/* 3. Horizontal Exercise Ribbon Stepper */}
      <nav style={{ marginBottom: '1.25rem' }} aria-label="Exercise Stepper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', padding: '0.35rem' }} className="hide-scrollbar">
          {filteredExercises.map((ex) => {
            const realIdx = exercises.findIndex(e => e.id === ex.id);
            const isSelected = realIdx === activeExerciseIndex;
            const isDone = ex.sets?.every(s => s.isCompleted);

            return (
              <button
                key={ex.id || realIdx}
                type="button"
                onClick={() => {
                  setActiveExerciseIndex(realIdx);
                  gymAudio.triggerSubtleHaptic([15]);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '14px',
                  border: isSelected 
                    ? '1.5px solid #06b6d4' 
                    : isDone 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)' 
                    : isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(18, 24, 38, 0.6)',
                  color: isSelected ? '#ffffff' : isDone ? '#34d399' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: isDone ? '#10b981' : isSelected ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff'
                }}>
                  {isDone ? <Check className="w-3 h-3" /> : realIdx + 1}
                </div>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {tExercise(ex.name)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {tMuscle(ex.targetMuscle)}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddExerciseModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 0.75rem',
              borderRadius: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 4. Active Exercise Card (Focus Mode) */}
      {currentExercise && (
        <article style={{
          borderRadius: '20px',
          background: 'rgba(18, 24, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(24px)',
          padding: '1.25rem',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 25px rgba(6, 182, 212, 0.08)',
          marginBottom: '1.5rem'
        }}>
          {/* Exercise Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#38bdf8'
                }}>
                  {tMuscle(currentExercise.targetMuscle)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isRTL ? `تمرين ${activeExerciseIndex + 1} من ${exercises.length}` : `Exercise ${activeExerciseIndex + 1} of ${exercises.length}`}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {tExercise(currentExercise.name)}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {currentExercise.notes && (
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  onClick={() => setShowNotesAccordion(prev => !prev)}
                  style={{ color: showNotesAccordion ? '#38bdf8' : 'var(--text-muted)', padding: '0.35rem' }}
                  title="Form Advice & Tips"
                >
                  <Info className="w-5 h-5" />
                </button>
              )}
              {currentExercise.videoUrl && (
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  onClick={() => setShowTutorialModal(true)}
                  style={{ color: '#06b6d4', padding: '0.35rem' }}
                  title="Video Tutorial"
                >
                  <CirclePlay className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                className="btn-icon btn-ghost"
                onClick={() => deleteExercise(activeExerciseIndex)}
                style={{ color: 'var(--danger, #ef4444)', padding: '0.35rem' }}
                title="Delete exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Notes Accordion */}
          <AnimatePresence>
            {showNotesAccordion && currentExercise.notes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles className="w-4 h-4" />
                  <span>{isRTL ? 'نصيحة الأداء الصحيح' : 'Proper Form Tips'}</span>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{currentExercise.notes}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cardio View or Weights Sets View */}
          {isCardio ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#06b6d4', fontVariantNumeric: 'tabular-nums', marginBottom: '1rem' }}>
                {formatTimer(cardioSeconds)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCardioRunning(r => !r)}
                  style={{ minWidth: '120px', borderRadius: '12px' }}
                >
                  {cardioRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{cardioRunning ? t('stopTimer') : t('startTimer')}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setCardioRunning(false); setCardioSeconds(0); }}
                  style={{ borderRadius: '12px' }}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Sets Rows: Gym Floor Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {currentExercise.sets?.map((set, sIdx) => {
                  const isCurrentActive = sIdx === activeSetIndex;
                  return (
                    <GymFloorSetCard
                      key={set.id || sIdx}
                      set={set}
                      setIndex={sIdx}
                      totalSets={currentExercise.sets.length}
                      previousRecord={previousRecord}
                      onUpdateSet={(field, val) => updateSet(activeExerciseIndex, sIdx, field, val)}
                      onToggleComplete={() => handleToggleSetComplete(activeExerciseIndex, sIdx)}
                      onQuickWeightAdjust={(delta) => handleQuickWeightAdjust(activeExerciseIndex, sIdx, delta)}
                      onQuickRepAdjust={(delta) => handleQuickRepAdjust(activeExerciseIndex, sIdx, delta)}
                      onDeleteSet={currentExercise.sets.length > 1 ? () => deleteSet(activeExerciseIndex, sIdx) : undefined}
                      isCompact={!isCurrentActive}
                      onSelectSet={() => setSelectedSetIndex(sIdx)}
                    />
                  );
                })}
              </div>

              {/* Add Set Button */}
              <button
                type="button"
                className="btn-ghost"
                onClick={() => addSet(activeExerciseIndex)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  marginBottom: '1.25rem'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>{t('addSet')}</span>
              </button>
            </div>
          )}

          {/* 5. USER REQUESTED FEATURE: "Complete Exercise" Button & Auto-Go to Next Exercise */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleCompleteCurrentExercise}
              style={{
                flex: 1,
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                border: 'none',
                background: isAllCurrentSetsDone 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: isAllCurrentSetsDone 
                  ? '0 8px 24px -4px rgba(16, 185, 129, 0.5)' 
                  : '0 8px 24px -4px rgba(6, 182, 212, 0.4)'
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isLastExercise
                  ? (isRTL ? 'أنهِ هذا التمرين الأخير' : 'Complete Final Exercise')
                  : (isRTL ? 'أنهِ هذا التمرين وانتقل للتالي' : 'Complete Exercise & Go Next')}
              </span>
              <ChevronRight className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </motion.button>

            {/* Stepper Next/Prev buttons */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn-icon btn-ghost"
                disabled={activeExerciseIndex === 0}
                onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
                style={{ borderRadius: '12px', padding: '0.75rem' }}
                title="Previous Exercise"
              >
                <ChevronLeft className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </button>
              <button
                type="button"
                className="btn-icon btn-ghost"
                disabled={activeExerciseIndex === exercises.length - 1}
                onClick={() => setActiveExerciseIndex(prev => Math.min(exercises.length - 1, prev + 1))}
                style={{ borderRadius: '12px', padding: '0.75rem' }}
                title="Next Exercise"
              >
                <ChevronRight className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </button>
            </div>
          </div>
        </article>
      )}

      {/* 6. Smart Rest Timer Floating HUD */}
      <AnimatePresence>
        {restTimerSeconds !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 'calc(16px + max(0px, env(safe-area-inset-bottom, 0px)))',
              left: '16px',
              right: '16px',
              margin: '0 auto',
              maxWidth: '480px',
              zIndex: 9999,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
              border: '1.5px solid rgba(6, 182, 212, 0.45)',
              borderRadius: '20px',
              padding: '0.75rem 1.25rem',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Dumbbell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {isRTL ? 'وقت الراحة والاستشفاء' : 'Rest Timer'}
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {formatTimer(restTimerSeconds)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => setRestTimerSeconds(s => Math.max(5, (s || 0) - 15))}
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => setRestTimerSeconds(s => (s || 0) + 15)}
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => setIsTimerPaused(p => !p)}
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
              >
                {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                type="button"
                className="btn-icon btn-ghost"
                onClick={() => setRestTimerSeconds(null)}
                style={{ color: 'var(--text-muted)', padding: '0.3rem' }}
                title="Skip Rest"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Celebration Notification */}
      <AnimatePresence>
        {showRestCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 'calc(24px + max(0px, env(safe-area-inset-bottom, 0px)))',
              left: '16px',
              right: '16px',
              margin: '0 auto',
              maxWidth: '420px',
              zIndex: 9999,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.98))',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '0.85rem 1.25rem',
              boxShadow: '0 20px 45px -10px rgba(16, 185, 129, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <Bell className="w-5 h-5 animate-bounce" />
              <span>{isRTL ? 'انتهت الراحة! ابدأ جولتك التالية بقوة 💪' : 'Rest complete! Ready for your next set 💪'}</span>
            </div>
            <button
              type="button"
              className="btn-icon btn-ghost"
              onClick={() => setShowRestCelebration(false)}
              style={{ color: '#ffffff', padding: '0.2rem' }}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Tutorial Modal */}
      {currentExercise?.videoUrl && (
        <Modal
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          title={`${tExercise(currentExercise.name)} — ${isRTL ? 'فيديو الشرح' : 'Tutorial'}`}
        >
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '14px' }}>
            <iframe
              src={currentExercise.videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/')}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentExercise.name}
            />
          </div>
        </Modal>
      )}

      {/* Add Exercise Modal */}
      <Modal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        title={t('addExercise')}
      >
        <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }} className="hide-scrollbar">
          {DEFAULT_EXERCISES.map((ex, i) => (
            <button
              key={i}
              type="button"
              className="card"
              style={{
                textAlign: isRTL ? 'right' : 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onClick={() => handleAddExerciseTemplate(ex)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tExercise(ex.name)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tMuscle(ex.targetMuscle)}</div>
              </div>
              <Plus className="w-5 h-5 text-accent-primary" />
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}
