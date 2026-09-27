import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Layers } from 'lucide-react';
import type { SessionExercise } from '../lib/api';

export interface PredefinedRoutine {
  id: string;
  name: string;
  category: string;
  description: string;
  daysRequired: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite Pro';
  difficultyScore?: number;
  estTime?: string;
  primaryMuscles?: string[];
  accentColor?: string;
  badge?: string;
  sessions: {
    title: string;
    type: string;
    exercises: SessionExercise[];
  }[];
}

interface ProgramDeck3DCardProps {
  routine: PredefinedRoutine;
  onApply: (routine: PredefinedRoutine) => void;
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
}

export function ProgramDeck3DCard({ routine, onApply, isRTL, tTitle }: ProgramDeck3DCardProps) {
  const exerciseCount = routine.sessions.reduce((total, session) => total + session.exercises.length, 0);
  const setCount = routine.sessions.reduce(
    (total, session) => total + session.exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0),
    0,
  );
  const muscleNames = routine.primaryMuscles?.slice(0, 5) || [];

  return (
    <motion.article
      className="routine-ledger-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.18 }}
      aria-labelledby={`routine-${routine.id}-title`}
    >
      <div className="routine-ledger-topline">
        <span className="routine-days-tag"><Layers width={14} height={14} />{routine.daysRequired} {isRTL ? 'أيام/أسبوع' : 'days / week'}</span>
        <span className="routine-ledger-counts tabular-nums">{routine.sessions.length} {isRTL ? 'جلسات' : 'sessions'} · {exerciseCount} {isRTL ? 'تمارين' : 'exercises'} · {setCount} {isRTL ? 'جولات' : 'sets'}</span>
      </div>

      <h3 id={`routine-${routine.id}-title`}>{tTitle(routine.name)}</h3>
      <p className="routine-ledger-description">{routine.description}</p>

      <div className="routine-ledger-muscles" aria-label={isRTL ? 'العضلات المستهدفة' : 'Target muscles'}>
        {muscleNames.map((muscle) => <span key={muscle}>{muscle}</span>)}
      </div>

      <ol className="routine-ledger-session-list">
        {routine.sessions.slice(0, 4).map((session, index) => (
          <li key={`${routine.id}-${session.title}`}>
            <span className="routine-ledger-index tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span className="routine-ledger-session-name">{tTitle(session.title.split('(')[0].trim())}</span>
            <span className="routine-ledger-session-meta tabular-nums">{session.exercises.length} {isRTL ? 'تمارين' : 'exercises'}</span>
          </li>
        ))}
        {routine.sessions.length > 4 && (
          <li className="routine-ledger-overflow">+{routine.sessions.length - 4} {isRTL ? 'جلسات أخرى' : 'more sessions'}</li>
        )}
      </ol>

      <div className="routine-ledger-footer">
        <span><Dumbbell width={14} height={14} />{routine.sessions[0]?.type || (isRTL ? 'تمارين' : 'Training')}</span>
        <button type="button" className="routine-ledger-action" onClick={() => onApply(routine)}>
          <span>{isRTL ? 'جدولة الروتين' : 'Schedule routine'}</span>
          <ArrowRight width={15} height={15} aria-hidden="true" style={{ transform: isRTL ? 'scaleX(-1)' : undefined }} />
        </button>
      </div>
    </motion.article>
  );
}
