import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Eye, Layers, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useReducedMotion } from './performance/useReducedMotion';
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

export function ProgramDeck3DCard({
  routine,
  onApply,
  isRTL,
  tTitle,
  onEdit,
  onDelete,
  isCustom = false
}: ProgramDeck3DCardProps) {
  const reduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const staticDeck = reduceMotion;

  const { exerciseCount, setCount, muscleNames, previewSessions, hiddenSessions } = useMemo(() => {
    const exercises = routine.sessions.reduce((total, session) => total + session.exercises.length, 0);
    const sets = routine.sessions.reduce(
      (total, session) => total + session.exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0),
      0
    );
    return {
      exerciseCount: exercises,
      setCount: sets,
      muscleNames: routine.primaryMuscles?.slice(0, 5) || [],
      previewSessions: routine.sessions.slice(0, 2),
      hiddenSessions: Math.max(0, routine.sessions.length - 2)
    };
  }, [routine]);

  const accent = routine.accentColor || 'var(--accent-cyan, #38bdf8)';
  const titleId = `routine-${routine.id}-title`;
  const listId = `routine-${routine.id}-list`;

  const scheduleCta = (
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
  );

  const secondaryActions = (
    <>
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
    </>
  );

  const flipToggle = (label: string) => (
    <button
      type="button"
      className="routine-flip-toggle"
      aria-expanded={flipped}
      aria-controls={listId}
      onClick={event => {
        event.stopPropagation();
        setFlipped(value => !value);
      }}
    >
      {flipped
        ? <RotateCcw width={14} height={14} aria-hidden="true" />
        : <Eye width={14} height={14} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );

  const sessionRows = (sessions: typeof routine.sessions, idPrefix: string, shortUnit: boolean) =>
    sessions.map((session, index) => (
      <li key={`${routine.id}-${idPrefix}-${session.title}`}>
        <span className="routine-ledger-index tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        <span className="routine-ledger-session-name">{tTitle(session.title.split('(')[0].trim())}</span>
        <span className="routine-ledger-session-meta tabular-nums">
          {session.exercises.length} {shortUnit ? (isRTL ? 'تمارين' : 'ex') : (isRTL ? 'exercises' : 'exercises')}
        </span>
      </li>
    ));

  const heading = (
    <>
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
    </>
  );

  const frontFace = (
    <>
      <span className="routine-ledger-sheen" aria-hidden="true" />
      {heading}
      <ol className="routine-ledger-session-list" id={listId}>
        {sessionRows(previewSessions, 'front', true)}
        {hiddenSessions > 0 && (
          <li className="routine-ledger-overflow">
            +{hiddenSessions} {isRTL ? 'جلسات أخرى' : 'more sessions'}
          </li>
        )}
      </ol>
    </>
  );

  const footerMeta = (
    <span>
      <Dumbbell width={14} height={14} aria-hidden="true" />
      {routine.sessions[0]?.type || (isRTL ? 'تمارين' : 'Training')}
      {routine.estTime ? ` · ${routine.estTime}` : ''}
    </span>
  );

  if (staticDeck) {
    return (
      <article
        className="routine-ledger-card"
        data-deck="static"
        data-custom={isCustom ? 'true' : 'false'}
        style={{ '--routine-accent': accent } as CSSProperties}
        aria-labelledby={titleId}
      >
        {frontFace}
        <div className="routine-ledger-footer">
          {footerMeta}
          <span className="routine-ledger-footer-actions">
            {secondaryActions}
            {scheduleCta}
          </span>
        </div>
      </article>
    );
  }

  return (
    <motion.div
      className="routine-flip"
      data-custom={isCustom ? 'true' : 'false'}
      style={{ '--routine-accent': accent } as CSSProperties}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={event => {
        if ((event.target as HTMLElement).closest('button')) return;
        setFlipped(value => !value);
      }}
    >
      <div className="routine-flip-inner" data-flipped={flipped ? 'true' : 'false'}>
        <article
          className="routine-ledger-card routine-flip-face routine-flip-front"
          aria-labelledby={titleId}
        >
          {frontFace}
          <div className="routine-ledger-footer">
            {footerMeta}
            <span className="routine-ledger-footer-actions">
              {secondaryActions}
              {flipToggle(isRTL ? 'التفاصيل' : 'Details')}
            </span>
          </div>
        </article>

        <article
          className="routine-ledger-card routine-flip-face routine-flip-back"
          aria-labelledby={`${titleId}-back`}
        >
          <div className="routine-flip-back-head">
            <h4 id={`${titleId}-back`}>{tTitle(routine.name)}</h4>
            {flipToggle(isRTL ? 'رجوع' : 'Back')}
          </div>
          <p className="routine-ledger-description">{routine.description}</p>
          <ol className="routine-ledger-session-list is-full">
            {sessionRows(routine.sessions, 'back', false)}
          </ol>
          <div className="routine-ledger-footer">
            <span className="tabular-nums">
              {exerciseCount} {isRTL ? 'تمرين' : 'exercises'} · {setCount} {isRTL ? 'جولة' : 'sets'}
            </span>
            <span className="routine-ledger-footer-actions">
              {secondaryActions}
              {scheduleCta}
            </span>
          </div>
        </article>
      </div>
    </motion.div>
  );
}
