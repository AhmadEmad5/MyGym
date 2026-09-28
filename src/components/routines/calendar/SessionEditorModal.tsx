import type { FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../../lib/api';
import { Button, Modal } from '../../ui';
import { TEMPLATE_NAMES } from './templates';

type SessionEditorModalProps = {
  isOpen: boolean;
  draft: Partial<WorkoutSession> | null;
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onPatch: (patch: Partial<WorkoutSession>) => void;
  onApplyTemplate: (name: string) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function SessionEditorModal({
  isOpen,
  draft,
  isRTL,
  t,
  tTitle,
  tMuscle,
  formatDate,
  onPatch,
  onApplyTemplate,
  onSubmit,
  onDelete,
  onClose
}: SessionEditorModalProps) {
  const isFriday = Boolean(draft?.date) && new Date(draft!.date!).getDay() === 5;
  const title = draft?.id ? t('editSessionTitle') : t('newSessionTitle');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={title}>
      <form onSubmit={onSubmit} className="calendar-session-form">
        {!draft?.id && (
          <div>
            <span className="calendar-field-label">{t('quickTemplates')}</span>
            <div className="quick-templates-ribbon">
              {TEMPLATE_NAMES.map(name => (
                <Button
                  key={name}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onApplyTemplate(name)}
                >
                  {name === 'Push Workout' || name === 'Pull Workout' || name === 'Legs Workout'
                    ? tTitle(name)
                    : tMuscle(name.replace(' Workout', ''))}
                </Button>
              ))}
            </div>
          </div>
        )}

        <label className="calendar-field">
          <span className="calendar-field-label">{t('sessionTitleInput')}</span>
          <input
            required
            type="text"
            className="input"
            value={draft?.title || ''}
            onChange={event => onPatch({ title: event.target.value })}
          />
        </label>

        <div className="calendar-field-grid">
          <label className="calendar-field">
            <span className="calendar-field-label">{t('dateTimeInput')}</span>
            <input
              required
              type="datetime-local"
              className="input"
              value={draft?.date || ''}
              onChange={event => onPatch({ date: event.target.value })}
            />
            {isFriday && (
              <span className="calendar-field-warning" role="alert">
                {isRTL
                  ? 'يوم الجمعة عطلة أسبوعية والجيم مغلق. يرجى اختيار يوم آخر.'
                  : 'Friday is a weekly off-day (gym closed). Please choose another day.'}
              </span>
            )}
          </label>

          <label className="calendar-field">
            <span className="calendar-field-label">{t('durationInput')}</span>
            <input
              required
              type="number"
              min={1}
              className="input"
              value={draft?.duration || 60}
              onChange={event => onPatch({ duration: Number(event.target.value) || 60 })}
            />
          </label>
        </div>

        <label className="calendar-field">
          <span className="calendar-field-label">{t('typeInput')}</span>
          <select
            className="input"
            value={draft?.type || 'Strength'}
            onChange={event => onPatch({ type: event.target.value })}
          >
            <option value="Strength">{t('strengthType')}</option>
            <option value="Cardio">{t('cardioType')}</option>
            <option value="Yoga">{t('yogaType')}</option>
            <option value="HIIT">{t('hiitType')}</option>
            <option value="Other">{t('otherType')}</option>
          </select>
        </label>

        <label className="calendar-field">
          <span className="calendar-field-label">{t('notesInput')}</span>
          <textarea
            className="input"
            rows={3}
            value={draft?.notes || ''}
            onChange={event => onPatch({ notes: event.target.value })}
          />
        </label>

        {Boolean(draft?.exercises?.length) && (
          <p className="calendar-field-hint">
            {isRTL ? 'التمارين' : 'Exercises'}: {draft?.exercises?.length} ·{' '}
            {formatDate(new Date(draft!.date || Date.now()), 'EEE dd MMM')}
          </p>
        )}

        <div className="calendar-modal-actions">
          {draft?.id ? (
            <Button
              type="button"
              variant="danger"
              size="icon"
              onClick={() => onDelete(draft.id!)}
              aria-label={t('delete')}
            >
              <Trash2 width={16} height={16} aria-hidden="true" />
            </Button>
          ) : (
            <span />
          )}
          <div className="calendar-modal-actions-right">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isFriday}>
              {t('save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
