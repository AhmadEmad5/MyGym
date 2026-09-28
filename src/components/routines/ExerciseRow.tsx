import { useState } from 'react';
import { ChevronDown, Copy, Dumbbell, GripVertical, Play, Trash2 } from 'lucide-react';
import type { SessionExercise, SetRecord } from '../../lib/api';
import type { SortableHandleProps } from './sortable';
import { SetEditor } from './SetEditor';

type ExerciseRowProps = {
  exercise: SessionExercise;
  index: number;
  total: number;
  defaultUnit: 'kg' | 'lb';
  isRTL: boolean;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  collapsed: boolean;
  handleProps: SortableHandleProps;
  onToggleCollapsed: (id: string) => void;
  onPatch: (patch: Partial<SessionExercise>) => void;
  onPatchSet: (setId: string, patch: Partial<SetRecord>) => void;
  onAddSet: () => void;
  onDuplicateSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onMoveSet: (fromId: string, toId: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToStart: () => void;
  onMoveToEnd: () => void;
  onStart: () => void;
};

export function ExerciseRow({
  exercise,
  index,
  total,
  defaultUnit,
  isRTL,
  tExercise,
  tMuscle,
  collapsed,
  handleProps,
  onToggleCollapsed,
  onPatch,
  onPatchSet,
  onAddSet,
  onDuplicateSet,
  onRemoveSet,
  onMoveSet,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMoveToStart,
  onMoveToEnd,
  onStart
}: ExerciseRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const name = tExercise(exercise.name || (isRTL ? 'تمرين جديد' : 'New exercise'));
  const sets = exercise.sets || [];
  const regionId = `exercise-region-${exercise.id}`;

  return (
    <li className="routine-exercise-row" data-exercise-id={exercise.id} data-sortable-id={exercise.id}>
      <div className="routine-exercise-head">
        <button type="button" className="routine-grip" {...handleProps}>
          <GripVertical width={16} height={16} aria-hidden="true" />
        </button>

        <span className="routine-exercise-order tabular-nums" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="routine-exercise-title">
          <input
            className="routine-inline-title"
            value={exercise.name}
            placeholder={isRTL ? 'اسم التمرين' : 'Exercise name'}
            aria-label={isRTL ? `اسم التمرين ${index + 1}` : `Exercise ${index + 1} name`}
            onChange={event => onPatch({ name: event.target.value })}
          />
          <div className="routine-exercise-meta">
            <label className="routine-inline-chip">
              <Dumbbell width={12} height={12} aria-hidden="true" />
              <span className="sr-only">{isRTL ? 'العضلة المستهدفة' : 'Target muscle'}</span>
              <input
                className="routine-inline-chip-input"
                value={exercise.targetMuscle}
                onChange={event => onPatch({ targetMuscle: event.target.value })}
              />
            </label>
            <label className="routine-inline-chip">
              <span className="sr-only">{isRTL ? 'ثواني الراحة' : 'Rest seconds'}</span>
              <input
                className="routine-inline-chip-input tabular-nums"
                type="number"
                min={0}
                step={5}
                value={exercise.restTime}
                onChange={event => onPatch({ restTime: Number(event.target.value) || 0 })}
              />
              <span aria-hidden="true">s</span>
            </label>
            <span className="routine-inline-chip is-readonly">
              {tMuscle(exercise.targetMuscle || 'Chest')} · {sets.length} {isRTL ? 'جولة' : 'sets'}
            </span>
          </div>
        </div>

        <div className="routine-exercise-actions">
          <button
            type="button"
            className="routine-icon-btn"
            onClick={onStart}
            aria-label={isRTL ? `بدء ${name}` : `Start ${name}`}
          >
            <Play width={14} height={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="routine-icon-btn"
            onClick={onDuplicate}
            aria-label={isRTL ? `تكرار ${name}` : `Duplicate ${name}`}
          >
            <Copy width={14} height={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="routine-icon-btn is-danger"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label={isRTL ? `حذف ${name}` : `Delete ${name}`}
          >
            <Trash2 width={14} height={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="routine-icon-btn"
            onClick={() => onToggleCollapsed(exercise.id)}
            aria-expanded={!collapsed}
            aria-controls={regionId}
            aria-label={isRTL ? `طي ${name}` : `Collapse ${name}`}
          >
            <ChevronDown
              width={15}
              height={15}
              aria-hidden="true"
              style={{
                transform: collapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform 150ms ease'
              }}
            />
          </button>
        </div>
      </div>

      <div className="routine-exercise-body" id={regionId} hidden={collapsed}>
          <div
            className="routine-reorder-cluster"
            role="group"
            aria-label={isRTL ? 'إعادة ترتيب التمرين' : 'Reorder exercise'}
          >
            <button type="button" className="routine-ghost-btn" onClick={onMoveToStart} disabled={index === 0}>
              <span aria-hidden="true">⇤</span>
              <span>{isRTL ? 'للبداية' : 'Start'}</span>
            </button>
            <button type="button" className="routine-ghost-btn" onClick={onMoveUp} disabled={index === 0}>
              <span aria-hidden="true">↑</span>
              <span>{isRTL ? 'لأعلى' : 'Up'}</span>
            </button>
            <button
              type="button"
              className="routine-ghost-btn"
              onClick={onMoveDown}
              disabled={index === total - 1}
            >
              <span aria-hidden="true">↓</span>
              <span>{isRTL ? 'لأسفل' : 'Down'}</span>
            </button>
            <button
              type="button"
              className="routine-ghost-btn"
              onClick={onMoveToEnd}
              disabled={index === total - 1}
            >
              <span aria-hidden="true">⇥</span>
              <span>{isRTL ? 'للنهاية' : 'End'}</span>
            </button>
          </div>

          <SetEditor
            exerciseName={name}
            sets={sets}
            defaultUnit={defaultUnit}
            isRTL={isRTL}
            onPatch={onPatchSet}
            onAdd={onAddSet}
            onDuplicate={onDuplicateSet}
            onRemove={onRemoveSet}
            onMove={onMoveSet}
          />

          <div className="routine-exercise-notes">
            <button
              type="button"
              className="routine-ghost-btn"
              onClick={() => setShowNotes(value => !value)}
              aria-expanded={showNotes}
            >
              {isRTL ? 'ملاحظات الأداء' : 'Coaching notes'}
            </button>
            {showNotes && (
              <textarea
                className="routine-inline-notes"
                rows={3}
                value={exercise.notes}
                placeholder={isRTL ? 'أضف نصائح الأداء هنا…' : 'Add form cues, setup notes, tempo…'}
                aria-label={isRTL ? 'ملاحظات التمرين' : 'Exercise notes'}
                onChange={event => onPatch({ notes: event.target.value })}
              />
            )}
          </div>
        </div>
    </li>
  );
}
