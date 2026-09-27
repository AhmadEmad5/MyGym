import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Dumbbell, 
  Clock, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RotateCcw,
  Plus
} from 'lucide-react';
import type { WorkoutSession } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';

interface MobileHeroWorkoutCardProps {
  session: WorkoutSession | null;
  isCompletedToday: boolean;
  onQuickWorkout: () => void;
  streakDays?: number;
}

export function MobileHeroWorkoutCard({
  session,
  isCompletedToday,
  onQuickWorkout,
}: MobileHeroWorkoutCardProps) {
  const navigate = useNavigate();
  const { tExercise, tMuscle, isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback demo exercises if session has no exercises yet
  const exercises = useMemo(() => {
    if (session?.exercises && session.exercises.length > 0) {
      return session.exercises;
    }
    return [
      { id: 'ex-1', name: 'Seated Machine Chest Press', targetMuscle: 'Chest', sets: [1, 2, 3, 4] },
      { id: 'ex-2', name: 'Incline Machine Chest Press', targetMuscle: 'Chest', sets: [1, 2, 3] },
      { id: 'ex-3', name: 'High-to-Low Cable Crossover', targetMuscle: 'Chest', sets: [1, 2, 3] },
      { id: 'ex-4', name: 'Cable Rope Triceps Pushdown', targetMuscle: 'Triceps', sets: [1, 2, 3, 4] },
      { id: 'ex-5', name: 'Overhead Cable Triceps Extension', targetMuscle: 'Triceps', sets: [1, 2, 3] },
      { id: 'ex-6', name: 'Triceps Dip Machine', targetMuscle: 'Triceps', sets: [1, 2, 3] },
    ];
  }, [session?.exercises]);

  const targetMuscles = useMemo(() => {
    const muscles = new Set<string>();
    for (const ex of exercises) {
      if (ex.targetMuscle) muscles.add(ex.targetMuscle);
    }
    return Array.from(muscles).slice(0, 3);
  }, [exercises]);

  const exerciseCount = exercises.length;
  const estimatedMinutes = Math.max(35, exerciseCount * 9);
  const workoutTitle = session?.title || (isRTL ? 'تضخيم الصدر والترايسبس' : 'Chest & Triceps Hypertrophy');

  // Handle tap to start or resume workout session
  const handleOpenWorkout = () => {
    gymAudio.triggerSubtleHaptic([30, 40]);
    if (session?.id) {
      navigate(`/session/${session.id}`);
    } else {
      onQuickWorkout();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(145deg, rgba(13, 27, 46, 0.95) 0%, rgba(6, 15, 26, 0.95) 100%)',
        border: isCompletedToday 
          ? '1.5px solid rgba(16, 185, 129, 0.45)' 
          : '1.5px solid rgba(56, 189, 248, 0.45)',
        borderRadius: '26px',
        padding: '1.4rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isCompletedToday
          ? '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 28px rgba(16, 185, 129, 0.18)'
          : '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 28px rgba(56, 189, 248, 0.18)',
        marginBottom: '1.15rem'
      }}
    >
      {/* Background ambient radial glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '130px',
        height: '130px',
        borderRadius: '50%',
        background: isCompletedToday
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Tagline / Category pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: isCompletedToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
          border: isCompletedToday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '20px',
          padding: '0.3rem 0.75rem',
          fontSize: '0.74rem',
          fontWeight: 800,
          color: isCompletedToday ? '#34d399' : '#38bdf8',
          letterSpacing: '0.05em'
        }}>
          {isCompletedToday ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>
            {isCompletedToday 
              ? (isRTL ? 'تمرين اليوم منجز ✓' : 'WORKOUT COMPLETED ✓') 
              : (isRTL ? 'تمرين اليوم الموصى به' : "TODAY'S WORKOUT")}
          </span>
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          Day 1
        </span>
      </div>

      {/* Workout Title */}
      <h2 style={{
        fontSize: '1.45rem',
        fontWeight: 900,
        color: '#ffffff',
        margin: '0 0 0.45rem 0',
        lineHeight: 1.25,
        letterSpacing: '-0.02em'
      }}>
        {workoutTitle}
      </h2>

      {/* Stats Line: Exercises count + Estimated Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Dumbbell className="w-4 h-4 text-cyan-400" />
          <span>{exerciseCount} {isRTL ? 'تمارين' : 'Exercises'}</span>
        </div>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>~{estimatedMinutes} min</span>
        </div>
      </div>

      {/* Primary Action Button: Large Glowing CTA */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleOpenWorkout}
        style={{
          width: '100%',
          padding: '0.95rem 1.25rem',
          borderRadius: '16px',
          background: isCompletedToday
            ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          cursor: 'pointer',
          boxShadow: isCompletedToday
            ? '0 8px 24px rgba(14, 165, 233, 0.45)'
            : '0 8px 24px rgba(16, 185, 129, 0.45)',
          letterSpacing: '0.02em',
          marginBottom: '0.85rem'
        }}
      >
        {isCompletedToday ? (
          <>
            <RotateCcw className="w-5 h-5 text-white" />
            <span>{isRTL ? 'مراجعة وتعديل التمرين' : 'Review / Reopen Session'}</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-white" />
            <span>{isRTL ? 'بدء التمرين الآن' : 'Start Session'}</span>
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} style={{ opacity: 0.8 }} />
          </>
        )}
      </motion.button>

      {/* Target Muscle Pills */}
      {targetMuscles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
          {targetMuscles.map(m => (
            <span
              key={m}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.2rem 0.55rem',
                color: 'var(--text-secondary)'
              }}
            >
              {tMuscle(m)}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible Exercise Preview Drawer Toggle */}
      {exerciseCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '0.55rem 0.75rem',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>{isRTL ? 'معاينة قائمة التمارين' : 'Preview Exercises'}</span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '14px',
                  padding: '0.75rem',
                  marginTop: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600 }}>{tExercise(ex.name)}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ex.sets?.length || 3} sets
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Secondary Extra Workout Button if session is completed */}
      {isCompletedToday && (
        <button
          type="button"
          onClick={onQuickWorkout}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            padding: '0.65rem',
            borderRadius: '12px',
            background: 'transparent',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            cursor: 'pointer'
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isRTL ? 'بدء تمرين إضافي' : 'Log Extra Workout'}</span>
        </button>
      )}
    </motion.div>
  );
}
