import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Check, Play, Pause, Trash2, X,
  CirclePlay, ChevronRight, ChevronLeft, Sparkles, Dumbbell,
  RotateCcw, Info, CheckCircle2, Bell, MoreVertical, Flag, Square
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
import { workoutTimer } from '../lib/workoutTimer';
import { useReducedMotion } from '../components/performance/useReducedMotion';

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
  { name: 'Machine Preacher Curl', targetMuscle: 'Biceps', notes: 'عزل البايسبس بالكامل ومنع الأرجحة بفضل وسادة التثبيت.' },
  { name: 'Behind-The-Back Cable Curl', targetMuscle: 'Biceps', notes: 'تمدد قوي لرأس الطويل لبناء قمة عضلة البايسبس.' },
  { name: 'Rope Cable Hammer Curl', targetMuscle: 'Biceps', notes: 'استهداف العضلة العضدية لزيادة سماكة وعرض الذراع.' },
  { name: 'Cable Rope Triceps Pushdown', targetMuscle: 'Triceps', notes: 'استهداف الرأس الجانبي للترايسيبس للحصول على مظهر حدوة الحصان.' },
  { name: 'Overhead Cable Triceps Extension', targetMuscle: 'Triceps', notes: 'تمدد كامل للرأس الطويل المسؤول عن الحجم الأكبر للذراع.' },
  { name: 'Triceps Dip Machine', targetMuscle: 'Triceps', notes: 'استهداف شامل ومكثف للترايسيبس بأمان وثبات.' },
  { name: 'Cable Reverse Curl', targetMuscle: 'Forearms' },
  { name: 'Cable Wrist Curl', targetMuscle: 'Forearms' },
  { name: 'Kneeling Cable Crunch', targetMuscle: 'Core', notes: 'ثني الجذع بعضلات البطن فقط مع ثبات الحوض لبناء العضلات السداسية.' },
  { name: 'Ab Crunch Machine', targetMuscle: 'Core', notes: 'عزل متقدم ومريح للبطن مع دعم كامل للظهر.' }
];

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, saveSession, deleteSession, finishWorkoutSession } = useData();
  const { t, formatDate, tTitle, tExercise, tMuscle, isRTL } = useTranslation();
  const reducedMotion = useReducedMotion();

  useWakeLock(true);

  const session = useMemo(() => {
    return data?.sessions?.find(s => s.id === id) || null;
  }, [data?.sessions, id]);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showNotesAccordion, setShowNotesAccordion] = useState(false);
  const [showRestCelebration, setShowRestCelebration] = useState(false);
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioSeconds, setCardioSeconds] = useState(0);

  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOverflowOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOverflowOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOverflowOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (cardioRunning) {
      interval = setInterval(() => setCardioSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cardioRunning]);

  const exercises = useMemo(() => session?.exercises || [], [session?.exercises]);

  const muscleGroups = useMemo(() => {
    const map = new Map<string, SessionExercise[]>();
    exercises.forEach(ex => {
      const muscle = ex.targetMuscle || 'Other';
      if (!map.has(muscle)) map.set(muscle, []);
      map.get(muscle)!.push(ex);
    });
    return Array.from(map.entries()).map(([muscle, items]) => ({ muscle, count: items.length }));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (selectedMuscleFilter === 'all') return exercises;
    return exercises.filter(ex => ex.targetMuscle === selectedMuscleFilter);
  }, [exercises, selectedMuscleFilter]);

  const currentExercise = exercises[activeExerciseIndex] || exercises[0];

  const previousRecord = useMemo(() => {
    if (!data || !currentExercise?.name) return null;
    return selectPreviousPerformance(currentExercise.name, data, session?.id);
  }, [data, currentExercise?.name, session?.id]);

  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);

  const activeSetIndex = useMemo(() => {
    if (selectedSetIndex !== null && currentExercise?.sets?.[selectedSetIndex]) {
      return selectedSetIndex;
    }
    if (!currentExercise?.sets) return 0;
    const firstUnfinished = currentExercise.sets.findIndex(s => !s.isCompleted);
    return firstUnfinished !== -1 ? firstUnfinished : Math.max(0, currentExercise.sets.length - 1);
  }, [selectedSetIndex, currentExercise?.sets]);

  useEffect(() => {
    setSelectedSetIndex(null);
  }, [activeExerciseIndex]);

  const handleUpdateSession = useCallback(async (updatedSession: WorkoutSession) => {
    if (!data) return;
    await saveSession(updatedSession);
  }, [data, saveSession]);

  const updateSet = useCallback((exerciseIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
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
  }, [session, handleUpdateSession]);

  const handleToggleSetComplete = useCallback((exerciseIdx: number, setIdx: number) => {
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
      const nextUncompletedIdx = currentEx.sets.findIndex((s, i) => i > setIdx && !s.isCompleted);
      if (nextUncompletedIdx !== -1) {
        setSelectedSetIndex(nextUncompletedIdx);
      }

      gymAudio.playSetCompleteChime();
      gymAudio.triggerSubtleHaptic([30, 45]);

      const restSec = currentEx.restTime || data?.settings?.restTimerSeconds || 90;
      workoutTimer.start(
        restSec,
        currentEx.name,
        data?.settings?.soundAlerts !== false,
        data?.settings?.vibrationAlerts !== false
      );
    }
  }, [session, handleUpdateSession, data]);

  const handleQuickWeightAdjust = useCallback((exerciseIdx: number, setIdx: number, delta: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    const set = ex.sets[setIdx];
    const nextWeight = Math.max(0, Math.round(((set.weight || 0) + delta) * 10) / 10);
    updateSet(exerciseIdx, setIdx, 'weight', nextWeight);
    gymAudio.triggerSubtleHaptic([15]);
  }, [session, updateSet]);

  const handleQuickRepAdjust = useCallback((exerciseIdx: number, setIdx: number, delta: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    const set = ex.sets[setIdx];
    const currentReps = set.repsActual > 0 ? set.repsActual : set.repsTarget || 10;
    const nextReps = Math.max(1, currentReps + delta);
    updateSet(exerciseIdx, setIdx, 'repsActual', nextReps);
    gymAudio.triggerSubtleHaptic([15]);
  }, [session, updateSet]);

  const addSet = useCallback((exerciseIdx: number) => {
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
      return { ...exercise, sets: [...(exercise.sets || []), newSet] };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  }, [session, data, handleUpdateSession]);

  const deleteSet = useCallback((exerciseIdx: number, setIdx: number) => {
    if (!session) return;
    const ex = session.exercises[exerciseIdx];
    if (!ex || !ex.sets || ex.sets.length <= 1) return;
    const updatedExercises = session.exercises.map((exercise, eIdx) => {
      if (eIdx !== exerciseIdx) return exercise;
      return { ...exercise, sets: exercise.sets.filter((_, s) => s !== setIdx) };
    });
    handleUpdateSession({ ...session, exercises: updatedExercises });
  }, [session, handleUpdateSession]);

  const deleteExercise = useCallback((exerciseIdx: number) => {
    if (!session) return;
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا التمرين؟' : 'Delete this exercise?')) return;
    const updated = session.exercises.filter((_, idx) => idx !== exerciseIdx);
    handleUpdateSession({ ...session, exercises: updated });
    setIsOverflowOpen(false);
    if (activeExerciseIndex >= updated.length) {
      setActiveExerciseIndex(Math.max(0, updated.length - 1));
    }
  }, [session, activeExerciseIndex, isRTL, handleUpdateSession]);

  const handleCompleteCurrentExercise = useCallback(() => {
    if (!session || !currentExercise) return;

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
    workoutTimer.stop();

    if (activeExerciseIndex < session.exercises.length - 1) {
      setActiveExerciseIndex(prev => prev + 1);
      notify(
        isRTL
          ? `رائع! تم إنهاء ${tExercise(currentExercise.name)} والبدء في التالي.`
          : `Exercise completed! Next: ${tExercise(session.exercises[activeExerciseIndex + 1]?.name)}`,
        'success'
      );
    } else {
      notify(
        isRTL ? 'أحسنت! أنهيت جميع التمارين، يمكنك إنهاء الجلسة الآن.' : 'All exercises completed! You can now finish the workout.',
        'success'
      );
    }
  }, [session, currentExercise, activeExerciseIndex, isRTL, tExercise, handleUpdateSession]);

  const handleFinishWorkout = useCallback(async () => {
    if (!session) return;
    setIsOverflowOpen(false);
    const updatedSession = { ...session, isCompleted: true };
    await finishWorkoutSession(updatedSession);
    workoutTimer.stop();
    gymAudio.playCelebrationFanfare();
    notify(isRTL ? 'تهانينا! تم حفظ التمرين في السجل بنجاح 🎉' : 'Workout completed and logged to History! 🎉', 'success');
    navigate('/today', { replace: true });
  }, [session, finishWorkoutSession, isRTL, navigate]);

  const handleAddExerciseTemplate = (template: { name: string; targetMuscle: string; notes?: string }) => {    if (!session) return;
    const stamp = Date.now();
    const newEx: SessionExercise = {
      id: `ex-${stamp}`,
      name: template.name,
      targetMuscle: template.targetMuscle,
      restTime: data?.settings?.restTimerSeconds || 90,
      notes: template.notes || '',
      sets: [
        { id: `s-${stamp}-1`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false },
        { id: `s-${stamp}-2`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false },
        { id: `s-${stamp}-3`, weight: 0, repsTarget: 10, repsActual: 0, unit: data?.settings?.weightUnit || 'kg', isCompleted: false }
      ]
    };
    handleUpdateSession({
      ...session,
      exercises: [...(session.exercises || []), newEx]
    });
    setIsAddExerciseModalOpen(false);
    setActiveExerciseIndex(session.exercises.length);
  };

  const sessionTotals = useMemo(() => {
    let total = 0;
    let done = 0;
    (session?.exercises || []).forEach(ex => {
      total += ex.sets?.length || 0;
      done += ex.sets?.filter(s => s.isCompleted).length || 0;
    });
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [session?.exercises]);

  if (!session) {
    return (
      <div
        className="page-surface session-detail-container flex-col"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
        role="status"
        aria-live="polite"
      >
        <Dumbbell className="w-10 h-10 animate-bounce" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} aria-hidden="true" />
        <p style={{ color: 'var(--text-secondary)' }}>{t('loading') || 'Loading workout session...'}</p>
      </div>
    );
  }

  const isCardio = currentExercise?.targetMuscle === 'Cardio';
  const isLastExercise = activeExerciseIndex === session.exercises.length - 1;

  const totalSetsInExercise = currentExercise?.sets?.length || 0;
  const doneSetsInExercise = currentExercise?.sets?.filter(s => s.isCompleted).length || 0;
  const activeSet = currentExercise?.sets?.[activeSetIndex];
  const activeSetDone = !!activeSet?.isCompleted;

  return (
    <div className="page-surface session-detail-container flex-col" style={{ display: 'flex', flexDirection: 'column' }}>

      <div className="session-hud">
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.85rem',
            padding: '0.7rem 0.9rem',
            borderRadius: '18px',
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
            <button
              type="button"
              className="btn-icon btn-ghost session-target session-target-ghost"
              onClick={() => navigate('/today')}
              style={{ minWidth: '48px', minHeight: '48px', borderRadius: '14px', padding: 0 }}
              aria-label={isRTL ? 'العودة إلى اليوم' : 'Back to Today'}
            >
              <ArrowLeft className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tTitle(session.title)}
              </h1>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {formatDate(new Date(session.date), 'EEEE, d MMMM')}
                {' · '}
                {isRTL
                  ? `${sessionTotals.done} من ${sessionTotals.total} جولة`
                  : `${sessionTotals.done}/${sessionTotals.total} sets`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <div
              role="progressbar"
              aria-valuenow={sessionTotals.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={isRTL ? 'تقدم الجلسة' : 'Session progress'}
              style={{
                inlineSize: '4.5rem',
                blockSize: '6px',
                borderRadius: '999px',
                background: 'var(--bg-tertiary)',
                overflow: 'hidden'
              }}
            >
              <div style={{ inlineSize: `${sessionTotals.percent}%`, blockSize: '100%', background: 'var(--accent-primary)' }} />
            </div>

            <div className="session-overflow-anchor" ref={overflowRef}>
              <button
                type="button"
                className="session-target session-target-ghost"
                style={{ minWidth: '48px', paddingInline: '0.7rem' }}
                aria-haspopup="menu"
                aria-expanded={isOverflowOpen}
                aria-label={isRTL ? 'خيارات الجلسة' : 'Session options'}
                onClick={() => setIsOverflowOpen(prev => !prev)}
              >
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
              </button>
              {isOverflowOpen && (
                <div className="session-overflow-menu" role="menu" aria-label={isRTL ? 'خيارات الجلسة' : 'Session options'}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setIsOverflowOpen(false); handleFinishWorkout(); }}
                  >
                    <Flag size={16} aria-hidden="true" />
                    <span>{t('finishWorkout')}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => deleteExercise(activeExerciseIndex)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span>{isRTL ? 'حذف هذا التمرين' : 'Delete this exercise'}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={async () => {
                      setIsOverflowOpen(false);
                      if (window.confirm(t('deleteSessionConfirm'))) {
                        await deleteSession(session.id);
                        navigate('/today');
                      }
                    }}
                  >
                    <Square size={16} aria-hidden="true" />
                    <span>{t('deleteSession')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section style={{ marginBottom: '0.75rem' }} aria-label={isRTL ? 'تصفية المجموعات العضلية' : 'Muscle Group Filter'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedMuscleFilter('all')}
              aria-pressed={selectedMuscleFilter === 'all'}
              style={{
                minHeight: '40px',
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: selectedMuscleFilter === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                background: selectedMuscleFilter === 'all' ? 'color-mix(in srgb, var(--accent-primary) 18%, transparent)' : 'transparent',
                color: selectedMuscleFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isRTL ? 'جميع العضلات' : 'All Muscles'} ({exercises.length})
            </button>

            {muscleGroups.map(group => (
              <button
                key={group.muscle}
                type="button"
                aria-pressed={selectedMuscleFilter === group.muscle}
                onClick={() => {
                  setSelectedMuscleFilter(group.muscle);
                  const firstIdx = exercises.findIndex(e => e.targetMuscle === group.muscle);
                  if (firstIdx !== -1) setActiveExerciseIndex(firstIdx);
                }}
                style={{
                  minHeight: '40px',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: selectedMuscleFilter === group.muscle ? '1px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                  background: selectedMuscleFilter === group.muscle ? 'color-mix(in srgb, var(--accent-primary) 18%, transparent)' : 'transparent',
                  color: selectedMuscleFilter === group.muscle ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {tMuscle(group.muscle)} ({group.count})
              </button>
            ))}
          </div>
        </section>

        <nav style={{ marginBottom: '1rem' }} aria-label={isRTL ? 'تنتقل بين التمارين' : 'Exercise Stepper'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem' }} className="hide-scrollbar">
            {filteredExercises.map((ex) => {
              const realIdx = exercises.findIndex(e => e.id === ex.id);
              const isSelected = realIdx === activeExerciseIndex;
              const isDone = ex.sets?.every(s => s.isCompleted);

              return (
                <button
                  key={ex.id || realIdx}
                  type="button"
                  aria-current={isSelected ? 'step' : undefined}
                  onClick={() => {
                    setActiveExerciseIndex(realIdx);
                    gymAudio.triggerSubtleHaptic([15]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '52px',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '14px',
                    border: isSelected
                      ? '1.5px solid var(--accent-primary)'
                      : isDone
                        ? '1px solid color-mix(in srgb, var(--success) 40%, transparent)'
                        : '1px solid var(--premium-line)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--accent-primary) 22%, transparent)'
                      : isDone
                        ? 'color-mix(in srgb, var(--success) 10%, transparent)'
                        : 'var(--bg-secondary)',
                    color: isSelected ? 'var(--text-primary)' : isDone ? 'var(--success)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: isDone ? 'var(--success)' : isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#04121b'
                    }}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : realIdx + 1}
                  </span>
                  <span style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {tExercise(ex.name)}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {tMuscle(ex.targetMuscle)}
                    </span>
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsAddExerciseModalOpen(true)}
              aria-label={t('addExercise')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '52px',
                minHeight: '52px',
                borderRadius: '14px',
                border: '1px dashed var(--premium-line)',
                background: 'transparent',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {currentExercise && (
          <article style={{
            borderRadius: '20px',
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)',
            padding: '1.1rem',
            boxShadow: '0 20px 45px -18px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: 'var(--premium-soft)',
                    color: 'var(--accent-primary)'
                  }}>
                    {tMuscle(currentExercise.targetMuscle)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isRTL ? `تمرين ${activeExerciseIndex + 1} من ${exercises.length}` : `Exercise ${activeExerciseIndex + 1} of ${exercises.length}`}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {tExercise(currentExercise.name)}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                {currentExercise.notes && (
                  <button
                    type="button"
                    className="btn-icon btn-ghost"
                    onClick={() => setShowNotesAccordion(prev => !prev)}
                    aria-expanded={showNotesAccordion}
                    style={{ color: showNotesAccordion ? 'var(--accent-primary)' : 'var(--text-muted)', minWidth: '44px', minHeight: '44px' }}
                    title={isRTL ? 'نصائح الأداء' : 'Form Advice & Tips'}
                  >
                    <Info className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
                {currentExercise.videoUrl && (
                  <button
                    type="button"
                    className="btn-icon btn-ghost"
                    onClick={() => setShowTutorialModal(true)}
                    style={{ color: 'var(--accent-primary)', minWidth: '44px', minHeight: '44px' }}
                    title={isRTL ? 'فيديو الشرح' : 'Video Tutorial'}
                    aria-label={isRTL ? 'فيديو الشرح' : 'Video tutorial'}
                  >
                    <CirclePlay className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showNotesAccordion && currentExercise.notes && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={reducedMotion ? {} : { opacity: 1, height: 'auto' }}
                  exit={reducedMotion ? {} : { opacity: 0, height: 0 }}
                  style={{
                    background: 'var(--premium-soft)',
                    border: '1px solid var(--premium-line)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.9rem'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>{isRTL ? 'نصيحة الأداء الصحيح' : 'Proper Form Tips'}</span>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{currentExercise.notes}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isCardio ? (
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '16px',
                padding: '1.5rem',
                textAlign: 'center',
                border: '1px solid var(--premium-line)'
              }}>
                <div className="session-countdown" style={{ fontSize: '3.2rem', color: 'var(--accent-primary)', marginBottom: '1rem' }} role="timer" aria-label={`${formatTimer(cardioSeconds)}`}>
                  {formatTimer(cardioSeconds)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="session-target session-target-primary"
                    onClick={() => setCardioRunning(r => !r)}
                    aria-pressed={cardioRunning}
                  >
                    {cardioRunning ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
                    <span>{cardioRunning ? t('stopTimer') : t('startTimer')}</span>
                  </button>
                  <button
                    type="button"
                    className="session-target session-target-ghost"
                    onClick={() => { setCardioRunning(false); setCardioSeconds(0); }}
                    aria-label={isRTL ? 'تصفير المؤقت' : 'Reset timer'}
                  >
                    <RotateCcw className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  role="group"
                  aria-label={isRTL
                    ? `قائمة جولات ${tExercise(currentExercise.name)}`
                    : `Set checklist for ${currentExercise.name}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.9rem' }}
                >
                  {currentExercise.sets?.map((set, sIdx) => {
                    const isCurrentActive = sIdx === activeSetIndex;
                    return (
                      <div key={set.id || sIdx} style={{ display: 'grid', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className={`session-set-check ${isCurrentActive ? 'is-active' : ''}`.trim()}
                          aria-pressed={set.isCompleted}
                          onClick={() => { setSelectedSetIndex(sIdx); handleToggleSetComplete(activeExerciseIndex, sIdx); }}
                        >
                          <span className="session-set-check-mark" aria-hidden="true">
                            {set.isCompleted ? <Check className="w-6 h-6" /> : <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{sIdx + 1}</span>}
                          </span>
                          <span className="session-set-check-body">
                            <span className="session-set-check-title">
                              {isRTL ? `الجولة ${sIdx + 1}` : `Set ${sIdx + 1}`}
                            </span>
                            <span className="session-set-check-meta">
                              {`${set.weight || 0} ${set.unit} × ${set.repsActual || set.repsTarget || 10}`}
                              {set.isCompleted && ` · ${isRTL ? 'مكتملة' : 'done'}`}
                            </span>
                          </span>
                          <span className="forma-sr-only">
                            {isRTL
                              ? `${set.isCompleted ? 'مكتملة' : 'غير مكتملة'}. اضغط للتبديل.`
                              : `${set.isCompleted ? 'Completed' : 'Not completed'}. Activate to toggle.`}
                          </span>
                        </button>
                        <GymFloorSetCard
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
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="session-target session-target-ghost"
                  onClick={() => addSet(activeExerciseIndex)}
                  style={{ width: '100%', borderStyle: 'dashed', color: 'var(--accent-primary)' }}
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  <span>{t('addSet')}</span>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem' }}>
              <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isCardio
                  ? (isRTL ? 'مؤقت الكارديو' : 'Cardio timer')
                  : (isRTL
                    ? `${doneSetsInExercise} من ${totalSetsInExercise} جولة مكتملة`
                    : `${doneSetsInExercise} of ${totalSetsInExercise} sets complete`)}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="session-target session-target-ghost"
                  disabled={activeExerciseIndex === 0}
                  onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
                  aria-label={isRTL ? 'التمرين السابق' : 'Previous exercise'}
                  style={{ minWidth: '48px', padding: 0 }}
                >
                  <ChevronLeft className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="session-target session-target-ghost"
                  disabled={activeExerciseIndex === exercises.length - 1}
                  onClick={() => setActiveExerciseIndex(prev => Math.min(exercises.length - 1, prev + 1))}
                  aria-label={isRTL ? 'التمرين التالي' : 'Next exercise'}
                  style={{ minWidth: '48px', padding: 0 }}
                >
                  <ChevronRight className="w-5 h-5" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        )}
      </div>

      <div className="session-thumb-dock">
        <div className="session-dock-row">
          <button
            type="button"
            className={`session-target ${isCardio || !activeSet ? 'session-target-ghost' : activeSetDone ? 'session-target-success' : 'session-target-primary'}`}
            disabled={isCardio || !activeSet}
            onClick={() => handleToggleSetComplete(activeExerciseIndex, activeSetIndex)}
            aria-label={isRTL
              ? (activeSetDone ? 'إلغاء اكتمال الجولة' : 'تسجيل الجولة كمكتملة')
              : (activeSetDone ? 'Mark set incomplete' : 'Mark set complete')}
            style={{ gridColumn: '1 / -1' }}
          >
            {activeSetDone ? <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> : <Check className="w-6 h-6" aria-hidden="true" />}
            <span>
              {isRTL
                ? (activeSetDone ? 'تراجع عن الجولة' : `تم ${doneSetsInExercise}/${totalSetsInExercise} — أكمل الجولة`)
                : (activeSetDone ? 'Undo set' : `${doneSetsInExercise}/${totalSetsInExercise} done — complete set`)}
            </span>
          </button>
        </div>
        <div className="session-dock-row">
          <button
            type="button"
            className="session-target session-target-ghost"
            onClick={handleCompleteCurrentExercise}
            style={{ minHeight: '48px' }}
          >
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span style={{ fontSize: '0.85rem' }}>
              {isLastExercise
                ? (isRTL ? 'أنهِ التمرين الأخير' : 'Finish exercise')
                : (isRTL ? 'أنهِ التمرين' : 'Finish exercise')}
            </span>
          </button>
          <button
            type="button"
            className="session-target session-target-primary"
            onClick={handleFinishWorkout}
          >
            <Flag className="w-5 h-5" aria-hidden="true" />
            <span>{t('finishWorkout')}</span>
          </button>
          <button
            type="button"
            className="session-target session-target-ghost"
            onClick={() => setIsAddExerciseModalOpen(true)}
            aria-label={t('addExercise')}
            style={{ minWidth: '48px', padding: 0 }}
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <RestHudLayer
        reducedMotion={reducedMotion}
        showCelebration={showRestCelebration}
        onDismissCelebration={() => setShowRestCelebration(false)}
        onCelebrationShown={() => setShowRestCelebration(true)}
      />

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
              style={{
                textAlign: isRTL ? 'right' : 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                minHeight: '56px',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--premium-line)',
                color: 'var(--text-primary)'
              }}
              onClick={() => handleAddExerciseTemplate(ex)}
            >
              <span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem' }}>{tExercise(ex.name)}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tMuscle(ex.targetMuscle)}</span>
              </span>
              <Plus className="w-5 h-5" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

interface RestHudLayerProps {
  reducedMotion: boolean;
  showCelebration: boolean;
  onDismissCelebration: () => void;
  onCelebrationShown: () => void;
}

function RestHudLayer({ reducedMotion, showCelebration, onDismissCelebration, onCelebrationShown }: RestHudLayerProps) {
  const { t, isRTL, tExercise } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [exerciseName, setExerciseName] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let last: number | null = null;
    const unsubscribe = workoutTimer.subscribe(() => {
      const state = workoutTimer.getState();
      if (state.secondsLeft !== last) {
        last = state.secondsLeft;
        setSecondsLeft(state.secondsLeft);
        setTotalSeconds(state.totalSeconds);
        setExerciseName(state.exerciseName);
        setIsPaused(state.isPaused);
        if (state.secondsLeft === 0) onCelebrationShown();
      }
    });
    const initial = workoutTimer.getState();
    setSecondsLeft(initial.secondsLeft);
    setTotalSeconds(initial.totalSeconds);
    setExerciseName(initial.exerciseName);
    return unsubscribe;
  }, [onCelebrationShown]);

  if (secondsLeft === null) return null;

  const validTotal = totalSeconds > 0 ? totalSeconds : 90;
  const fraction = Math.max(0, Math.min(1, secondsLeft / validTotal));
  const isFinished = secondsLeft === 0;

  return (
    <>
      <div className="session-hud-rest">
        <motion.div
          role="region"
          aria-label={t('restTimer')}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }}
          style={{
            inlineSize: '100%',
            maxWidth: '440px',
            background: 'var(--premium-surface)',
            border: '1.5px solid color-mix(in srgb, var(--accent-primary) 45%, transparent)',
            borderRadius: '20px',
            padding: '0.6rem 0.7rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 18px 40px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <div
              aria-hidden="true"
              style={{
                inlineSize: '44px',
                blockSize: '44px',
                borderRadius: '12px',
                background: isFinished ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--premium-soft)',
                color: isFinished ? 'var(--success)' : 'var(--accent-primary)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              {isFinished ? <Check className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {isFinished ? (isRTL ? 'جاهز' : 'Ready') : (isRTL ? 'وقت الراحة' : t('restTimer'))}
              </div>
              <div
                className="session-countdown"
                style={{ fontSize: '2rem', color: isFinished ? 'var(--success)' : 'var(--accent-primary)' }}
              >
                {formatTimer(secondsLeft)}
              </div>
              <span className="forma-sr-only" aria-live="polite" aria-atomic="true">
                {exerciseName ? `${tExercise(exerciseName)}. ` : ''}
                {`${Math.floor(secondsLeft / 60)} ${isRTL ? 'دقيقة' : 'minutes'} ${secondsLeft % 60} ${isRTL ? 'ثانية' : 'seconds'} ${isRTL ? 'متبقية من الراحة' : 'remaining in rest'}`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <div aria-hidden="true" style={{ inlineSize: '4px', blockSize: '40px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ inlineSize: '100%', blockSize: `${fraction * 100}%`, background: 'var(--accent-primary)', marginBlockStart: `${(1 - fraction) * 100}%` }} />
            </div>
            <button
              type="button"
              className="session-target session-target-ghost"
              onClick={() => workoutTimer.adjust(-15)}
              aria-label={isRTL ? 'إنقاص 15 ثانية' : 'Remove 15 seconds'}
              style={{ minWidth: '48px', minHeight: '48px', padding: 0, fontSize: '0.75rem' }}
            >
              −15
            </button>
            <button
              type="button"
              className="session-target session-target-ghost"
              onClick={() => workoutTimer.adjust(15)}
              aria-label={isRTL ? 'إضافة 15 ثانية' : 'Add 15 seconds'}
              style={{ minWidth: '48px', minHeight: '48px', padding: 0, fontSize: '0.75rem' }}
            >
              +15
            </button>
            <button
              type="button"
              className="session-target session-target-ghost"
              onClick={() => workoutTimer.togglePause()}
              aria-pressed={isPaused}
              aria-label={isRTL ? (isPaused ? 'متابعة المؤقت' : 'إيقاف المؤقت مؤقتاً') : (isPaused ? 'Resume timer' : 'Pause timer')}
              style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
            >
              {isPaused ? <Play className="w-5 h-5" aria-hidden="true" /> : <Pause className="w-5 h-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="session-target session-target-ghost"
              onClick={() => workoutTimer.stop()}
              aria-label={isRTL ? 'تخطي الراحة' : 'Skip rest'}
              style={{ minWidth: '48px', minHeight: '48px', padding: 0 }}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <span className="forma-sr-only">{`${Math.round(fraction * 100)}% ${isRTL ? 'من الراحة' : 'of rest elapsed'}`}</span>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            role="alert"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'fixed',
              insetBlockStart: 'calc(1rem + max(0px, env(safe-area-inset-top, 0px)))',
              insetInline: '0.75rem',
              marginInline: 'auto',
              maxWidth: '420px',
              zIndex: 970,
              background: 'linear-gradient(135deg, var(--success), #34d399)',
              color: '#04140d',
              borderRadius: '16px',
              padding: '0.8rem 1rem',
              boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '0.9rem' }}>
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span>{isRTL ? 'انتهت الراحة! ابدأ جولتك التالية بقوة 💪' : 'Rest complete! Ready for your next set 💪'}</span>
            </div>
            <button
              type="button"
              onClick={onDismissCelebration}
              aria-label={isRTL ? 'إغلاق' : 'Dismiss'}
              style={{ minWidth: '40px', minHeight: '40px', display: 'grid', placeItems: 'center', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.16)', border: 'none', color: '#04140d', cursor: 'pointer' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
