import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Layers, Pencil, Trash2 } from 'lucide-react';
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
  onEdit?: (routine: PredefinedRoutine) => void;
  onDelete?: (routine: PredefinedRoutine) => void;
  isCustom?: boolean;
}

export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduced;
}

export function ProgramDeck3DCard({
  routine,
  onApply,
  isRTL,
  tTitle,
  onEdit,
  onDelete,
  isCustom = false
}: ProgramDeck3DCardProps) {
  const reduceMotion = useReducedMotionPreference();
  const staticDeck = reduceMotion;

  const { exerciseCount, setCount, muscleNames, visibleSessions, hiddenSessions } = useMemo(() => {
    const exercises = routine.sessions.reduce((total, session) => total + session.exercises.length, 0);
    const sets = routine.sessions.reduce(
      (total, session) => total + session.exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0),
      0
    );
    return {
      exerciseCount: exercises,
      setCount: sets,
      muscleNames: routine.primaryMuscles?.slice(0, 5) || [],
      visibleSessions: routine.sessions.slice(0, 4),
      hiddenSessions: Math.max(0, routine.sessions.length - 4)
    };
  }, [routine]);

  const accent = routine.accentColor || 'var(--accent-cyan, #38bdf8)';
  const titleId = `routine-${routine.id}-title`;

  const card = (
    <article
      className="routine-ledger-card"
      data-deck={staticDeck ? 'static' : 'gloss'}
      data-custom={isCustom ? 'true' : 'false'}
      style={{ '--routine-accent': accent } as CSSProperties}
      aria-labelledby={titleId}
    >
      <span className="routine-ledger-sheen" aria-hidden="true" />

      <div className="routine-ledger-topline">
        <span className="routine-days-tag">
          <Layers width={14} height={14} aria-hidden="true" />
          {routine.daysRequired} {isRTL ? 'أيام/أسبوع' : 'days / week'}
        </span>
        <span className="routine-ledger-counts tabular-nums">
          {routine.sessions.length} {isRTL ? 'جلسات' : 'sessions'} · {exerciseCount} {isRTL ? 'تمارين' : 'exercises'} · {setCount} {isRTL ? 'جولات' : 'sets'}
        </span>
      </div>

      <h3 id={titleId}>{tTitle(routine.name)}</h3>
      <p className="routine-ledger-description">{routine.description}</p>

      <div className="routine-ledger-muscles" aria-label={isRTL ? 'العضلات المستهدفة' : 'Target muscles'}>
        {muscleNames.map(muscle => (
          <span key={muscle}>{muscle}</span>
        ))}
        {isCustom && <span className="is-custom">{isRTL ? 'مخصص' : 'Custom'}</span>}
      </div>

      <ol className="routine-ledger-session-list">
        {visibleSessions.map((session, index) => (
          <li key={`${routine.id}-${session.title}`}>
            <span className="routine-ledger-index tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span className="routine-ledger-session-name">{tTitle(session.title.split('(')[0].trim())}</span>
            <span className="routine-ledger-session-meta tabular-nums">
              {session.exercises.length} {isRTL ? 'تمارين' : 'exercises'}
            </span>
          </li>
        ))}
        {hiddenSessions > 0 && (
          <li className="routine-ledger-overflow">
            +{hiddenSessions} {isRTL ? 'جلسات أخرى' : 'more sessions'}
          </li>
        )}
      </ol>

      <div className="routine-ledger-footer">
        <span>
          <Dumbbell width={14} height={14} aria-hidden="true" />
          {routine.sessions[0]?.type || (isRTL ? 'تمارين' : 'Training')}
          {routine.estTime ? ` · ${routine.estTime}` : ''}
        </span>
        <span className="routine-ledger-footer-actions">
          {onEdit && (
            <button
              type="button"
              className="routine-ledger-action is-secondary"
              onClick={() => onEdit(routine)}
              aria-label={isRTL ? `تعديل ${routine.name}` : `Edit ${routine.name}`}
            >
              <Pencil width={15} height={15} aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="routine-ledger-action is-danger"
              onClick={() => onDelete(routine)}
              aria-label={isRTL ? `حذف ${routine.name}` : `Delete ${routine.name}`}
            >
              <Trash2 width={15} height={15} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="routine-ledger-action"
            onClick={() => onApply(routine)}
            aria-label={isRTL ? `جدولة ${routine.name}` : `Schedule ${routine.name}`}
          >
            <span>{isRTL ? 'جدولة' : 'Schedule'}</span>
            <ArrowRight
              width={15}
              height={15}
              aria-hidden="true"
              style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
            />
          </button>
        </span>
      </div>
    </article>
  );

  if (staticDeck) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      whileTap={{ scale: 0.995 }}
    >
      {card}
    </motion.div>
  );
}
