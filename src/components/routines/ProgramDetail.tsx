import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Plus,
  RotateCcw,
  Save,
  Undo2
} from 'lucide-react';
import type { SessionExercise } from '../../lib/api';
import type { ProgramDraft } from './types';
import { ExerciseRow } from './ExerciseRow';
import { useSortableList } from './sortable';
import { useProgramDraft } from './useProgramDraft';

type ProgramDetailProps = {
  program: ProgramDraft;
  weightUnit: 'kg' | 'lb';
  isRTL: boolean;
  tExercise: (name: string) => string;
  tTitle: (name: string) => string;
  tMuscle: (muscle: string) => string;
  onBack: () => void;
  onSchedule: (program: ProgramDraft) => void;
  onSave: (program: ProgramDraft) => Promise<void>;
  onStartSession: (session: { title: string; type: string; exercises: SessionExercise[] }) => Promise<void>;
  saving: boolean;
  lastSavedAt: number | null;
};

export function ProgramDetail({
  program,
  weightUnit,
  isRTL,
  tExercise,
  tTitle,
  tMuscle,
  onBack,
  onSchedule,
  onSave,
  onStartSession,
  saving,
  lastSavedAt
}: ProgramDetailProps) {
  const draftApi = useProgramDraft(program, weightUnit);
  const [activeSession, setActiveSession] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const draft = draftApi.draft;
  const session = draft?.sessions[activeSession] ?? null;

  const exerciseIds = useMemo(
    () => (session?.exercises || []).map(exercise => exercise.id),
    [session]
  );

  const sortable = useSortableList({
    ids: exerciseIds,
    onMove: (fromId, toId) => draftApi.moveExercise(activeSession, fromId, toId),
    describe: id => {
      const found = session?.exercises.find(exercise => exercise.id === id);
      return tExercise(found?.name || (isRTL ? 'تمرين' : 'exercise'));
    },
    label: isRTL ? 'التمرين' : 'Exercise',
    moveUpLabel: isRTL ? 'لأعلى' : 'up',
    moveDownLabel: isRTL ? 'لأسفل' : 'down',
    moveToStartLabel: isRTL ? 'إلى البداية' : 'to start',
    moveToEndLabel: isRTL ? 'إلى النهاية' : 'to end',
    grabbedLabel: isRTL ? 'تم التقاط' : 'Grabbed',
    droppedLabel: isRTL ? 'تم الإفلات' : 'Dropped'
  });

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaveError(null);
    try {
      await onSave(draft);
      draftApi.markSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    }
  }, [draft, draftApi, onSave]);

  if (!draft || !session) {
    return (
      <div className="routine-detail-empty">
        <p>{isRTL ? 'لا يوجد محتوى في هذا البرنامج.' : 'This program has no sessions yet.'}</p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          {isRTL ? 'رجوع' : 'Back'}
        </button>
      </div>
    );
  }

  const stats = draftApi.stats;

  return (
    <motion.section
      className="routine-detail"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label={isRTL ? 'محرر البرنامج' : 'Program editor'}
    >
      <header className="routine-detail-header">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft
            width={16}
            height={16}
            aria-hidden="true"
            style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
          />
          <span>{isRTL ? 'المكتبة' : 'Library'}</span>
        </button>

        <div className="routine-detail-title-block">
          <input
            className="routine-detail-name"
            value={draft.name}
            aria-label={isRTL ? 'اسم البرنامج' : 'Program name'}
            onChange={event => draftApi.patchMeta({ name: event.target.value })}
          />
          <p className="routine-detail-stats tabular-nums">
            {isRTL
              ? `${stats?.sessions} جلسات • ${stats?.exercises} تمارين • ${stats?.sets} جولة`
              : `${stats?.sessions} sessions • ${stats?.exercises} exercises • ${stats?.sets} sets`}
          </p>
        </div>

        <div className="routine-detail-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onBack}
            disabled={!draftApi.isDirty}
            title={isRTL ? 'التراجع عن كل التعديلات' : 'Revert every change'}
          >
            <Undo2 width={15} height={15} aria-hidden="true" />
            <span>{isRTL ? 'تراجع' : 'Revert'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSchedule(draft)}
          >
            <Calendar width={15} height={15} aria-hidden="true" />
            <span>{isRTL ? 'جدولة' : 'Schedule'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!draftApi.isDirty || saving}
          >
            {saving ? <RotateCcw className="animate-spin" width={15} height={15} aria-hidden="true" /> : <Save width={15} height={15} aria-hidden="true" />}
            <span>{isRTL ? 'حفظ' : 'Save'}</span>
          </button>
        </div>
      </header>

      <div className="routine-dirty-bar" role="status" aria-live="polite" data-dirty={draftApi.isDirty}>
        {draftApi.isDirty ? (
          <>
            <AlertTriangle width={15} height={15} aria-hidden="true" />
            <span>
              {isRTL
                ? 'لديك تعديلات غير محفوظة على هذا البرنامج.'
                : 'You have unsaved changes in this program.'}
            </span>
            <button type="button" className="routine-ghost-btn" onClick={draftApi.reset}>
              {isRTL ? 'التراجع' : 'Discard'}
            </button>
          </>
        ) : lastSavedAt ? (
          <>
            <Check width={15} height={15} aria-hidden="true" />
            <span>{isRTL ? 'تم حفظ التعديلات.' : 'Changes saved.'}</span>
          </>
        ) : (
          <span className="is-muted">
            {isRTL ? 'كل التعديلات محفوظة.' : 'All changes are saved.'}
          </span>
        )}
      </div>

      {saveError && (
        <p className="routine-save-error" role="alert">
          {isRTL ? 'تعذر الحفظ.' : 'Could not save:'} {saveError}
        </p>
      )}

      <div className="routine-session-tabs" role="tablist" aria-label={isRTL ? 'جلسات البرنامج' : 'Program sessions'}>
        {draft.sessions.map((item, index) => {
          const selected = index === activeSession;
          return (
            <button
              key={`${item.title}-${index}`}
              type="button"
              role="tab"
              id={`routine-session-tab-${index}`}
              aria-selected={selected}
              aria-controls={`routine-session-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              className={`routine-session-tab ${selected ? 'is-active' : ''}`}
              onClick={() => setActiveSession(index)}
              onKeyDown={event => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const delta = event.key === 'ArrowRight' ? 1 : -1;
                const next = (index + delta + draft.sessions.length) % draft.sessions.length;
                setActiveSession(next);
                window.requestAnimationFrame(() => {
                  document.getElementById(`routine-session-tab-${next}`)?.focus();
                });
              }}
            >
              <span className="routine-session-tab-index tabular-nums">{index + 1}</span>
              <span className="routine-session-tab-title">{tTitle(item.title)}</span>
              <span className="routine-session-tab-meta tabular-nums">
                {item.exercises.length} {isRTL ? 'تمارين' : 'ex'}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="routine-session-panel"
        role="tabpanel"
        id={`routine-session-panel-${activeSession}`}
        aria-labelledby={`routine-session-tab-${activeSession}`}
      >
        <div className="routine-session-head">
          <input
            className="routine-session-title-input"
            value={session.title}
            aria-label={isRTL ? 'اسم الجلسة' : 'Session name'}
            onChange={event =>
              draftApi.patchSession(activeSession, prev => ({ ...prev, title: event.target.value }))
            }
          />
          <div className="routine-session-head-actions">
            <label className="routine-inline-chip">
              <span className="sr-only">{isRTL ? 'نوع الجلسة' : 'Session type'}</span>
              <input
                className="routine-inline-chip-input"
                value={session.type}
                onChange={event =>
                  draftApi.patchSession(activeSession, prev => ({ ...prev, type: event.target.value }))
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void onStartSession(session)}
            >
              {isRTL ? 'ابدأ التمرين' : 'Start session'}
            </button>
          </div>
        </div>

        <ul
          className="routine-exercise-list"
          ref={sortable.setContainer}
          aria-label={isRTL ? 'تمارين الجلسة' : 'Session exercises'}
        >
          {session.exercises.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              index={index}
              total={session.exercises.length}
              defaultUnit={weightUnit}
              isRTL={isRTL}
              tExercise={tExercise}
              tMuscle={tMuscle}
              collapsed={Boolean(collapsed[exercise.id])}
              handleProps={sortable.getHandleProps(exercise.id)}
              onToggleCollapsed={toggleCollapsed}
              onPatch={patch => draftApi.patchExercise(activeSession, exercise.id, () => ({ ...exercise, ...patch }))}
              onPatchSet={(setId, patch) => draftApi.patchSet(activeSession, exercise.id, setId, prev => ({ ...prev, ...patch }))}
              onAddSet={() => draftApi.addSet(activeSession, exercise.id)}
              onDuplicateSet={setId => draftApi.duplicateSet(activeSession, exercise.id, setId)}
              onRemoveSet={setId => draftApi.removeSet(activeSession, exercise.id, setId)}
              onMoveSet={(fromId, toId) => draftApi.moveSet(activeSession, exercise.id, fromId, toId)}
              onDuplicate={() => draftApi.duplicateExercise(activeSession, exercise.id)}
              onRemove={() => draftApi.removeExercise(activeSession, exercise.id)}
              onMoveUp={() => draftApi.moveExerciseBy(activeSession, exercise.id, -1)}
              onMoveDown={() => draftApi.moveExerciseBy(activeSession, exercise.id, 1)}
              onMoveToStart={() => draftApi.moveExerciseToEdge(activeSession, exercise.id, 'start')}
              onMoveToEnd={() => draftApi.moveExerciseToEdge(activeSession, exercise.id, 'end')}
              onStart={() => void onStartSession(session)}
            />
          ))}
        </ul>

        <p className="sr-only" role="status" aria-live="assertive">
          {sortable.announcement}
        </p>

        <button
          type="button"
          className="routine-add-exercise"
          onClick={() => draftApi.addExercise(activeSession)}
        >
          <Plus width={15} height={15} aria-hidden="true" />
          <span>{isRTL ? 'إضافة تمرين' : 'Add exercise'}</span>
        </button>
      </div>
    </motion.section>
  );
}
