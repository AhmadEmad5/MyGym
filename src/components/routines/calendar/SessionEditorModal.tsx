import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Lock, Trash2, Undo2 } from 'lucide-react';
import type { WorkoutSession } from '../../../lib/api';
import { Button, Modal } from '../../ui';
import { useReducedMotion } from '../../performance/useReducedMotion';
import { TEMPLATE_NAMES } from './templates';

type FieldName = 'title' | 'date' | 'duration';

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
  isSubmitting?: boolean;
  submitFailed?: boolean;
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
  onClose,
  isSubmitting = false,
  submitFailed = false
}: SessionEditorModalProps) {
  const reducedMotion = useReducedMotion();
  const uid = useId();
  // React 19 typings type `useRef<T>(null)` as `RefObject<T | null>`, which the
  // shared Modal's `initialFocusRef: RefObject<HTMLElement>` cannot accept.
  const formRef = useRef<HTMLFormElement>(null!);
  const summaryRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const wasFriday = useRef(false);

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    title: false,
    date: false,
    duration: false
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<'summary' | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [templateSnapshot, setTemplateSnapshot] = useState<Partial<WorkoutSession> | null>(null);
  const [templateEdits, setTemplateEdits] = useState({ title: false, type: false });
  const [notice, setNotice] = useState('');

  const ids = {
    title: { field: `${uid}-title`, hint: `${uid}-title-hint`, error: `${uid}-title-error` },
    date: { field: `${uid}-date`, hint: `${uid}-date-hint`, error: `${uid}-date-error` },
    duration: { field: `${uid}-duration`, hint: `${uid}-duration-hint`, error: `${uid}-duration-error` },
    type: { field: `${uid}-type`, hint: `${uid}-type-hint` },
    notes: { field: `${uid}-notes`, hint: `${uid}-notes-hint` }
  };

  const isFriday = Boolean(draft?.date) && new Date(draft!.date!).getDay() === 5;
  const modalTitle = draft?.id ? t('editSessionTitle') : t('newSessionTitle');

  const titleError = String(draft?.title ?? '').trim() === '' ? t('sessionTitleRequired') : '';
  const dateError = !draft?.date ? t('sessionDateRequired') : '';
  const fridayError = isFriday ? t('sessionDateFridayBlock') : '';
  const dateMessage = dateError || fridayError;
  const rawDuration = draft?.duration;
  const durationError =
    rawDuration === undefined || rawDuration === null || !Number.isFinite(Number(rawDuration))
      ? t('sessionDurationRequired')
      : Number(rawDuration) < 1
        ? t('sessionDurationMin')
        : '';

  const blockingError = Boolean(titleError || dateError || durationError);
  const templateActive = activeTemplate !== null;
  const titleFromTemplate = templateActive && !templateEdits.title;
  const typeFromTemplate = templateActive && !templateEdits.type;
  const canUndoTemplate = templateActive && templateSnapshot !== null;

  const errorFor = (name: FieldName) => {
    if (name === 'title') return titleError;
    if (name === 'date') return dateMessage;
    return durationError;
  };

  const showError = (name: FieldName) => {
    const active = name === 'date' ? isFriday || hasSubmitted || touched.date : hasSubmitted || touched[name];
    return active && Boolean(errorFor(name));
  };

  const describedBy = (name: FieldName, hasError: boolean) =>
    [ids[name].hint, hasError ? ids[name].error : ''].filter(Boolean).join(' ');

  const summaryItems = useMemo(() => {
    const items: { key: FieldName; message: string }[] = [];
    if (titleError) items.push({ key: 'title', message: titleError });
    if (dateError) items.push({ key: 'date', message: dateError });
    if (durationError) items.push({ key: 'duration', message: durationError });
    return items;
  }, [titleError, dateError, durationError]);

  const showSummary = hasSubmitted && summaryItems.length > 0;

  const focusField = useCallback(
    (name: FieldName) => {
      const target =
        name === 'title' ? titleRef.current : name === 'date' ? dateRef.current : durationRef.current;
      if (!target) return;
      target.focus();
      target.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (!isOpen) return;
    setTouched({ title: false, date: false, duration: false });
    setHasSubmitted(false);
    setPendingFocus(null);
    setActiveTemplate(null);
    setTemplateSnapshot(null);
    setTemplateEdits({ title: false, type: false });
    setNotice('');
    wasFriday.current = false;
  }, [isOpen, draft?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (isFriday && !wasFriday.current) setNotice(t('sessionDateFridayBlock'));
    wasFriday.current = isFriday;
  }, [isOpen, isFriday, t]);

  useEffect(() => {
    if (!pendingFocus) return;
    setPendingFocus(null);
    if (pendingFocus === 'summary') summaryRef.current?.focus();
  }, [pendingFocus]);

  const markTouched = (name: FieldName) =>
    setTouched(previous => (previous[name] ? previous : { ...previous, [name]: true }));

  const markTemplateEdit = (field: 'title' | 'type') =>
    setTemplateEdits(previous => (previous[field] ? previous : { ...previous, [field]: true }));

  const handleApplyTemplate = (name: string) => {
    if (isSubmitting) return;
    setTemplateSnapshot({ title: draft?.title, type: draft?.type, exercises: draft?.exercises });
    setActiveTemplate(name);
    setTemplateEdits({ title: false, type: false });
    setNotice(t('quickTemplateApplied'));
    onApplyTemplate(name);
  };

  const handleUndoTemplate = () => {
    if (isSubmitting || !templateSnapshot) return;
    const snapshot = templateSnapshot;
    setActiveTemplate(null);
    setTemplateSnapshot(null);
    setTemplateEdits({ title: false, type: false });
    setNotice(t('quickTemplateCleared'));
    const patch: Partial<WorkoutSession> = { exercises: snapshot.exercises };
    if (!templateEdits.title) patch.title = snapshot.title ?? '';
    if (!templateEdits.type) patch.type = snapshot.type;
    onPatch(patch);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setHasSubmitted(true);
    if (isFriday) {
      setNotice(t('saveBlockedFriday'));
      onSubmit(event);
      return;
    }
    if (blockingError) {
      setPendingFocus('summary');
      return;
    }
    onSubmit(event);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={modalTitle}
      initialFocusRef={formRef}
    >
      <form
        ref={formRef}
        tabIndex={-1}
        noValidate
        aria-busy={isSubmitting || undefined}
        onSubmit={handleSubmit}
        className="calendar-session-form"
      >
        {showSummary && (
          <motion.div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            aria-labelledby={`${uid}-summary-title`}
            className="calendar-validation-summary"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
          >
            <p id={`${uid}-summary-title`} className="calendar-validation-summary-title">
              <AlertTriangle width={16} height={16} aria-hidden="true" />
              {t('sessionFormFixErrors')}
            </p>
            <ul>
              {summaryItems.map(item => (
                <li key={item.key}>
                  <a
                    href={`#${ids[item.key].field}`}
                    onClick={event => {
                      event.preventDefault();
                      focusField(item.key);
                    }}
                  >
                    {item.message}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {!draft?.id && (
          <div className="calendar-templates">
            <div className="calendar-templates-head">
              <span className="calendar-field-label" id={`${uid}-templates-label`}>
                {t('quickTemplates')}
              </span>
              {canUndoTemplate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleUndoTemplate}
                  leftIcon={<Undo2 width={15} height={15} aria-hidden="true" />}
                >
                  {t('quickTemplateClear')}
                </Button>
              )}
            </div>
            <p className="calendar-field-hint" id={`${uid}-templates-hint`}>
              {t('quickTemplatesHint')}
            </p>
            <div
              className="quick-templates-ribbon"
              role="group"
              aria-labelledby={`${uid}-templates-label`}
              aria-describedby={`${uid}-templates-hint`}
            >
              {TEMPLATE_NAMES.map(name => {
                const selected = templateActive && activeTemplate === name;
                return (
                  <Button
                    key={name}
                    type="button"
                    variant={selected ? 'primary' : 'secondary'}
                    size="sm"
                    aria-pressed={selected}
                    disabled={isSubmitting}
                    onClick={() => handleApplyTemplate(name)}
                    leftIcon={selected ? <Check width={15} height={15} aria-hidden="true" /> : undefined}
                  >
                    {name === 'Push Workout' || name === 'Pull Workout' || name === 'Legs Workout'
                      ? tTitle(name)
                      : tMuscle(name.replace(' Workout', ''))}
                  </Button>
                );
              })}
            </div>
            {templateActive && (
              <p className="calendar-templates-status">
                <Check width={14} height={14} aria-hidden="true" />
                {t('quickTemplateApplied')}
              </p>
            )}
          </div>
        )}

        <div
          className={`calendar-field${showError('title') ? ' is-invalid' : ''}${
            titleFromTemplate ? ' is-templated' : ''
          }`}
        >
          <div className="calendar-field-head">
            <label className="calendar-field-label" htmlFor={ids.title.field}>
              {t('sessionTitleInput')}
            </label>
            {titleFromTemplate && (
              <span className="calendar-field-badge">{t('quickTemplateSelected')}</span>
            )}
          </div>
          <input
            id={ids.title.field}
            ref={titleRef}
            required
            type="text"
            className="input"
            value={draft?.title || ''}
            onChange={event => {
              markTemplateEdit('title');
              onPatch({ title: event.target.value });
            }}
            onBlur={() => markTouched('title')}
            aria-invalid={showError('title') || undefined}
            aria-describedby={describedBy('title', showError('title'))}
          />
          <p className="calendar-field-hint" id={ids.title.hint}>
            {t('sessionTitleHint')}
          </p>
          {showError('title') && (
            <p className="calendar-field-error" id={ids.title.error}>
              <AlertTriangle width={14} height={14} aria-hidden="true" />
              {titleError}
            </p>
          )}
        </div>

        <div className="calendar-field-grid">
          <div className={`calendar-field${showError('date') ? ' is-invalid' : ''}`}>
            <div className="calendar-field-head">
              <label className="calendar-field-label" htmlFor={ids.date.field}>
                {t('dateTimeInput')}
              </label>
            </div>
            <input
              id={ids.date.field}
              ref={dateRef}
              required
              type="datetime-local"
              className="input"
              value={draft?.date || ''}
              onChange={event => onPatch({ date: event.target.value })}
              onBlur={() => markTouched('date')}
              aria-invalid={showError('date') || undefined}
              aria-describedby={describedBy('date', showError('date'))}
            />
            <p className="calendar-field-hint" id={ids.date.hint}>
              {t('sessionDateHint')}
            </p>
            {(isFriday || showError('date')) && (
              <p className="calendar-field-error" id={ids.date.error}>
                <AlertTriangle width={14} height={14} aria-hidden="true" />
                {dateMessage}
              </p>
            )}
          </div>

          <div className={`calendar-field${showError('duration') ? ' is-invalid' : ''}`}>
            <div className="calendar-field-head">
              <label className="calendar-field-label" htmlFor={ids.duration.field}>
                {t('durationInput')}
              </label>
            </div>
            <input
              id={ids.duration.field}
              ref={durationRef}
              required
              type="number"
              min={1}
              className="input"
              value={draft?.duration || 60}
              onChange={event => onPatch({ duration: Number(event.target.value) || 60 })}
              onBlur={() => markTouched('duration')}
              aria-invalid={showError('duration') || undefined}
              aria-describedby={describedBy('duration', showError('duration'))}
            />
            <p className="calendar-field-hint" id={ids.duration.hint}>
              {t('sessionDurationHint')}
            </p>
            {showError('duration') && (
              <p className="calendar-field-error" id={ids.duration.error}>
                <AlertTriangle width={14} height={14} aria-hidden="true" />
                {durationError}
              </p>
            )}
          </div>
        </div>

        <div className={`calendar-field${typeFromTemplate ? ' is-templated' : ''}`}>
          <div className="calendar-field-head">
            <label className="calendar-field-label" htmlFor={ids.type.field}>
              {t('typeInput')}
            </label>
            {typeFromTemplate && (
              <span className="calendar-field-badge">{t('quickTemplateSelected')}</span>
            )}
          </div>
          <select
            id={ids.type.field}
            className="input"
            value={draft?.type || 'Strength'}
            onChange={event => {
              markTemplateEdit('type');
              onPatch({ type: event.target.value });
            }}
            aria-describedby={ids.type.hint}
          >
            <option value="Strength">{t('strengthType')}</option>
            <option value="Cardio">{t('cardioType')}</option>
            <option value="Yoga">{t('yogaType')}</option>
            <option value="HIIT">{t('hiitType')}</option>
            <option value="Other">{t('otherType')}</option>
          </select>
          <p className="calendar-field-hint" id={ids.type.hint}>
            {t('sessionTypeHint')}
          </p>
        </div>

        <div className="calendar-field">
          <div className="calendar-field-head">
            <label className="calendar-field-label" htmlFor={ids.notes.field}>
              {t('notesInput')}
            </label>
          </div>
          <textarea
            id={ids.notes.field}
            className="input"
            rows={3}
            value={draft?.notes || ''}
            onChange={event => onPatch({ notes: event.target.value })}
            aria-describedby={ids.notes.hint}
          />
          <p className="calendar-field-hint" id={ids.notes.hint}>
            {t('sessionNotesHint')}
          </p>
        </div>

        {Boolean(draft?.exercises?.length) && (
          <p className="calendar-field-hint">
            <span>
              {t('exercises')}: {draft?.exercises?.length}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{formatDate(new Date(draft!.date || Date.now()), 'EEE dd MMM')}</span>
          </p>
        )}

        {submitFailed && (
          <p className="calendar-submit-error" role="alert">
            <AlertTriangle width={16} height={16} aria-hidden="true" />
            {t('sessionSaveFailed')}
          </p>
        )}

        {isSubmitting && (
          <p className="calendar-submit-status" role="status">
            {t('savingSession')}
          </p>
        )}

        {isFriday && (
          <p className="calendar-field-warning">
            <AlertTriangle width={15} height={15} aria-hidden="true" />
            {t('saveBlockedFriday')}
          </p>
        )}

        <span className="sr-only" role="status">
          {notice}
        </span>

        <div className="calendar-modal-actions">
          {draft?.id ? (
            <Button
              type="button"
              variant="danger"
              size="icon"
              disabled={isSubmitting}
              onClick={() => onDelete(draft.id!)}
              aria-label={t('delete')}
            >
              <Trash2 width={16} height={16} aria-hidden="true" />
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <div className="calendar-modal-actions-right">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={`calendar-modal-actions-primary${isFriday ? ' is-blocked' : ''}`}
              isLoading={isSubmitting}
              aria-disabled={isFriday || undefined}
              aria-describedby={isFriday ? ids.date.error : undefined}
              leftIcon={isFriday ? <Lock width={16} height={16} aria-hidden="true" /> : undefined}
            >
              {isSubmitting ? t('savingSession') : t('save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
