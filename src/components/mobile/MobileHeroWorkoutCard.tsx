import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { WorkoutSession } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';
import { useFormaReducedMotion } from '../TodayBentoGrid';
import { GYM_FLOOR_HAPTICS, pulseHaptic } from './gymFloorHaptics';

interface MobileHeroWorkoutCardProps {
  session: WorkoutSession | null;
  isCompletedToday: boolean;
  onQuickWorkout: () => void;
}

const enterTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

export function MobileHeroWorkoutCard({
  session,
  isCompletedToday,
  onQuickWorkout,
}: MobileHeroWorkoutCardProps) {
  const navigate = useNavigate();
  const { tExercise, tMuscle, isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);

  const exercises = useMemo(() => session?.exercises || [], [session?.exercises]);

  const targetMuscles = useMemo(() => {
    const muscles = new Set<string>();
    for (const exercise of exercises) {
      if (exercise.targetMuscle) muscles.add(exercise.targetMuscle);
    }
    return Array.from(muscles).slice(0, 3);
  }, [exercises]);

  const exerciseCount = exercises.length;
  const estimatedMinutes = session?.duration || (exerciseCount > 0 ? Math.max(35, exerciseCount * 9) : 0);
  const workoutTitle = session?.title || (isRTL ? 'لا يوجد تمرين مجدول' : 'No workout scheduled');
  const hasContent = Boolean(session) && exerciseCount > 0;

  const handleOpenWorkout = () => {
    gymAudio.triggerSubtleHaptic([30, 40]);
    pulseHaptic(isCompletedToday ? GYM_FLOOR_HAPTICS.select : GYM_FLOOR_HAPTICS.sessionStart);
    if (session?.id) navigate(`/session/${session.id}`);
    else onQuickWorkout();
  };

  return (
    <motion.div
      className="mobile-hero-workout"
      data-state={isCompletedToday ? 'complete' : 'planned'}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition}
    >
      <div className="mobile-hero-topline">
        <span className="mobile-hero-tag">
          {isCompletedToday ? <CheckCircle2 size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          {isCompletedToday
            ? isRTL ? 'تمرين اليوم منجز' : 'Workout completed'
            : isRTL ? 'تمرين اليوم' : 'Today’s workout'}
        </span>
      </div>

      <h2 className="mobile-hero-title">{workoutTitle}</h2>

      {hasContent ? (
        <p className="mobile-hero-stats">
          <span>
            <Dumbbell size={14} aria-hidden="true" />
            {exerciseCount} {isRTL ? 'تمارين' : 'exercises'}
          </span>
          {estimatedMinutes > 0 && (
            <>
              <i aria-hidden="true" />
              <span>
                <Clock size={14} aria-hidden="true" />
                ~{estimatedMinutes} {isRTL ? 'دقيقة' : 'min'}
              </span>
            </>
          )}
        </p>
      ) : (
        <p className="mobile-hero-empty">
          {isRTL
            ? 'لا توجد تمارين في هذه الجلسة بعد — اختر روتيناً أو أضف جلسة سريعة.'
            : 'This session has no exercises yet — pick a routine or log a quick workout.'}
        </p>
      )}

      <motion.button
        type="button"
        className="mobile-hero-cta"
        data-variant={isCompletedToday ? 'review' : 'start'}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        onClick={handleOpenWorkout}
      >
        {isCompletedToday ? (
          <>
            <RotateCcw size={17} aria-hidden="true" />
            <span>{isRTL ? 'مراجعة وتعديل التمرين' : 'Review / reopen session'}</span>
          </>
        ) : (
          <>
            <Play size={17} fill="currentColor" aria-hidden="true" />
            <span>{isRTL ? 'بدء التمرين الآن' : 'Start session'}</span>
            <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} aria-hidden="true" />
          </>
        )}
      </motion.button>

      {targetMuscles.length > 0 && (
        <ul className="mobile-hero-muscles" aria-label={isRTL ? 'العضلات المستهدفة' : 'Target muscles'}>
          {targetMuscles.map((muscle) => (
            <li key={muscle}>{tMuscle(muscle)}</li>
          ))}
        </ul>
      )}

      {exerciseCount > 0 && (
        <>
          <button
            type="button"
            className="mobile-hero-toggle"
            aria-expanded={isExpanded}
            aria-controls="mobile-hero-exercise-list"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <span>{isRTL ? 'معاينة قائمة التمارين' : 'Preview exercises'}</span>
            <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.ul
                id="mobile-hero-exercise-list"
                className="mobile-hero-exercises"
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {exercises.map((exercise, index) => (
                  <li key={exercise.id || index}>
                    <span className="mobile-hero-exercise-index tabular-nums" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="mobile-hero-exercise-name">{tExercise(exercise.name)}</span>
                    <span className="mobile-hero-exercise-sets tabular-nums">
                      {exercise.sets?.length || 0} {isRTL ? 'جولات' : 'sets'}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}

      {isCompletedToday && (
        <button type="button" className="mobile-hero-secondary" onClick={onQuickWorkout}>
          <Plus size={14} aria-hidden="true" />
          <span>{isRTL ? 'بدء تمرين إضافي' : 'Log extra workout'}</span>
        </button>
      )}
    </motion.div>
  );
}
