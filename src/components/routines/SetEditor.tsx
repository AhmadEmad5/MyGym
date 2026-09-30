import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { SetRecord, SetType } from '../../lib/api';
import { useSortableList } from './sortable';

const SET_TYPES: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];

const SET_TYPE_SHORT: Record<SetType, string> = {
  normal: 'W',
  warmup: 'WU',
  dropset: 'D',
  failure: 'F'
};

type SetEditorProps = {
  exerciseName: string;
  sets: SetRecord[];
  defaultUnit: 'kg' | 'lb';
  isRTL: boolean;
  onPatch: (setId: string, patch: Partial<SetRecord>) => void;
  onAdd: () => void;
  onDuplicate: (setId: string) => void;
  onRemove: (setId: string) => void;
  onMove: (fromId: string, toId: string) => void;
};

export function SetEditor({
  exerciseName,
  sets,
  defaultUnit,
  isRTL,
  onPatch,
  onAdd,
  onDuplicate,
  onRemove,
  onMove
}: SetEditorProps) {
  const ids = sets.map(set => set.id);

  const sortable = useSortableList({
    ids,
    onMove,
    describe: id => {
      const index = ids.indexOf(id) + 1;
      return `${isRTL ? 'الجولة' : 'Set'} ${index} — ${exerciseName || (isRTL ? 'تمرين' : 'exercise')}`;
    },
    label: isRTL ? 'الجولة' : 'Set',
    moveUpLabel: isRTL ? 'لأعلى' : 'up',
    moveDownLabel: isRTL ? 'لأسفل' : 'down',
    moveToStartLabel: isRTL ? 'إلى البداية' : 'to start',
    moveToEndLabel: isRTL ? 'إلى النهاية' : 'to end',
    grabbedLabel: isRTL ? 'تم التقاط' : 'Grabbed',
    droppedLabel: isRTL ? 'تم الإفلات' : 'Dropped'
  });

  return (
    <div className="routine-set-editor">
      <div className="routine-set-grid routine-set-grid-header" aria-hidden="true">
        <span className="routine-set-col-grip" />
        <span className="routine-set-col-index">#</span>
        <span className="routine-set-col-type">{isRTL ? 'النوع' : 'Type'}</span>
        <span className="routine-set-col-weight">{isRTL ? 'الوزن' : 'Weight'}</span>
        <span className="routine-set-col-reps">{isRTL ? 'تكرارات' : 'Reps'}</span>
        <span className="routine-set-col-actions" />
      </div>

      <ul className="routine-set-list" ref={sortable.setContainer}>
        {sets.map((set, index) => {
          const handleProps = sortable.getHandleProps(set.id);
          const badge = SET_TYPE_SHORT[set.type || 'normal'];
          return (
            <li
              key={set.id}
              data-sortable-id={set.id}
              className={`routine-set-row ${sortable.itemClassName(set.id)}`}
            >
              <button
                type="button"
                className="routine-grip"
                {...handleProps}
                title={isRTL ? 'اسحب أو استخدم الأسهم لإعادة الترتيب' : 'Drag or use arrow keys to reorder'}
              >
                <GripVertical width={15} height={15} aria-hidden="true" />
              </button>

              <span className="routine-set-index tabular-nums" aria-hidden="true">
                {badge === 'W' ? index + 1 : badge}
              </span>

              <label className="routine-set-cell">
                <span className="sr-only">
                  {isRTL ? `نوع الجولة ${index + 1}` : `Set ${index + 1} type`}
                </span>
                <select
                  className="routine-mini-select"
                  value={set.type || 'normal'}
                  onChange={event => onPatch(set.id, { type: event.target.value as SetType })}
                >
                  {SET_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="routine-set-cell">
                <span className="sr-only">
                  {isRTL ? `وزن الجولة ${index + 1}` : `Set ${index + 1} weight`}
                </span>
                <input
                  className="routine-mini-input tabular-nums"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={set.weight}
                  onChange={event => onPatch(set.id, { weight: Number(event.target.value) || 0 })}
                />
                <span className="routine-unit-toggle" aria-hidden="true">
                  <button
                    type="button"
                    className={set.unit === 'kg' ? 'is-active' : ''}
                    onClick={() => onPatch(set.id, { unit: 'kg' })}
                    tabIndex={-1}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={set.unit === 'lb' ? 'is-active' : ''}
                    onClick={() => onPatch(set.id, { unit: 'lb' })}
                    tabIndex={-1}
                  >
                    lb
                  </button>
                </span>
              </label>

              <label className="routine-set-cell">
                <span className="sr-only">
                  {isRTL ? `تكرارات الجولة ${index + 1}` : `Set ${index + 1} reps`}
                </span>
                <input
                  className="routine-mini-input tabular-nums"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={set.repsTarget}
                  onChange={event => onPatch(set.id, { repsTarget: Number(event.target.value) || 0 })}
                />
              </label>

              <div className="routine-set-actions">
                <button
                  type="button"
                  className="routine-icon-btn"
                  onClick={() => onDuplicate(set.id)}
                  aria-label={isRTL ? `تكرار الجولة ${index + 1}` : `Duplicate set ${index + 1}`}
                  title={isRTL ? 'تكرار الجولة' : 'Duplicate set'}
                >
                  <Copy width={16} height={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="routine-icon-btn is-danger"
                  onClick={() => onRemove(set.id)}
                  disabled={sets.length <= 1}
                  aria-label={isRTL ? `حذف الجولة ${index + 1}` : `Delete set ${index + 1}`}
                  title={isRTL ? 'حذف الجولة' : 'Delete set'}
                >
                  <Trash2 width={16} height={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="routine-set-footer">
        <button type="button" className="routine-ghost-btn" onClick={onAdd}>
          <Plus width={14} height={14} aria-hidden="true" />
          <span>{isRTL ? 'إضافة جولة' : 'Add set'}</span>
        </button>
        <span className="routine-set-footer-meta tabular-nums">
          {isRTL
            ? `${sets.length} جولة • ${defaultUnit === 'kg' ? 'كجم' : 'رطل'} افتراضي`
            : `${sets.length} sets • default ${defaultUnit}`}
        </span>
      </div>

      <p className="sr-only" role="status" aria-live="assertive">
        {sortable.announcement}
      </p>
    </div>
  );
}
