import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Layers,
  Lock,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  X
} from 'lucide-react';
import type { SessionExercise, SetRecord, WorkoutSession } from '../../../lib/api';
import { Button, Modal } from '../../ui';
import { useReducedMotion } from '../../performance/useReducedMotion';
import { gymAudio } from '../../../lib/audio';
import { TEMPLATE_NAMES } from './templates';
import {
  filterCatalog,
  MUSCLE_GROUPS,
  type CatalogExerciseItem,
  type MuscleGroup
} from './exerciseCatalog';

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

function createSessionExercise(
  name: string,
  targetMuscle: string = 'Chest',
  defaultSets: number = 3,
  defaultReps: number = 10,
  restTime: number = 90,
  notes: string = ''
): SessionExercise {
  const exId = `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id: exId,
    name,
    targetMuscle,
    restTime,
    notes,
    sets: Array.from({ length: defaultSets }, (_, idx) => ({
      id: `s-${exId}-${idx + 1}`,
      weight: 0,
      repsTarget: defaultReps,
      repsActual: 0,
      unit: 'kg',
      isCompleted: false
    }))
  };
}

function getMuscleColor(muscle?: string): string {
  switch ((muscle || '').toLowerCase()) {
    case 'chest':
      return '#38bdf8';
    case 'back':
      return '#818cf8';
    case 'legs':
      return '#34d399';
    case 'shoulders':
      return '#fbbf24';
    case 'biceps':
      return '#f472b6';
    case 'triceps':
      return '#c084fc';
    case 'forearms':
      return '#a78bfa';
    case 'core':
      return '#2dd4bf';
    case 'cardio':
      return '#f87171';
    default:
      return 'var(--accent-primary)';
  }
}

const REST_PRESETS = [30, 60, 90, 120, 180];
const REPS_PRESETS = [6, 8, 10, 12, 15, 20];

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

  // Interactive Exercise Builder state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState<MuscleGroup>('All');
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<string>('Chest');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

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
    setIsPickerOpen(false);
    setPickerSearch('');
    setPickerMuscle('All');
    setCustomName('');
    setExpandedExerciseId(null);
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
    gymAudio.triggerSubtleHaptic([30]);
    setTemplateSnapshot({ title: draft?.title, type: draft?.type, exercises: draft?.exercises });
    setActiveTemplate(name);
    setTemplateEdits({ title: false, type: false });
    setNotice(t('quickTemplateApplied'));
    onApplyTemplate(name);
  };

  const handleUndoTemplate = () => {
    if (isSubmitting || !templateSnapshot) return;
    gymAudio.triggerSubtleHaptic([20]);
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

  // Exercise builder handlers
  const handleAddExerciseFromCatalog = (item: CatalogExerciseItem) => {
    gymAudio.triggerSubtleHaptic([25]);
    const exercise = createSessionExercise(
      item.name,
      item.muscle,
      item.defaultSets,
      item.defaultReps,
      item.restTime,
      item.notes || ''
    );
    const existing = draft?.exercises || [];
    onPatch({ exercises: [...existing, exercise] });
    setExpandedExerciseId(exercise.id);
    setNotice(t('exerciseAddedNotice'));
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    gymAudio.triggerSubtleHaptic([30]);
    const exercise = createSessionExercise(customName.trim(), customMuscle, 3, 10, 90);
    const existing = draft?.exercises || [];
    onPatch({ exercises: [...existing, exercise] });
    setCustomName('');
    setExpandedExerciseId(exercise.id);
    setNotice(t('exerciseAddedNotice'));
  };

  const handleRemoveExercise = (exerciseId: string) => {
    gymAudio.triggerSubtleHaptic([30]);
    const updated = (draft?.exercises || []).filter(e => e.id !== exerciseId);
    onPatch({ exercises: updated });
    if (expandedExerciseId === exerciseId) setExpandedExerciseId(null);
    setNotice(t('exerciseRemovedNotice'));
  };

  const handleMoveExercise = (index: number, direction: -1 | 1) => {
    const list = [...(draft?.exercises || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    gymAudio.triggerSubtleHaptic([15]);
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    onPatch({ exercises: list });
  };

  const handleAddSet = (exerciseId: string) => {
    gymAudio.triggerSubtleHaptic([15]);
    const ex = draft?.exercises?.find(e => e.id === exerciseId);
    if (!ex || ex.sets.length >= 10) return;
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: SetRecord = {
      id: `s-${exerciseId}-${ex.sets.length + 1}-${Date.now().toString(36)}`,
      weight: lastSet?.weight ?? 0,
      repsTarget: lastSet?.repsTarget ?? 10,
      repsActual: 0,
      unit: lastSet?.unit ?? 'kg',
      isCompleted: false
    };
    const updated = (draft?.exercises || []).map(e =>
      e.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
    );
    onPatch({ exercises: updated });
  };

  const handleRemoveSet = (exerciseId: string) => {
    gymAudio.triggerSubtleHaptic([15]);
    const ex = draft?.exercises?.find(e => e.id === exerciseId);
    if (!ex || ex.sets.length <= 1) return;
    const updated = (draft?.exercises || []).map(e =>
      e.id === exerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e
    );
    onPatch({ exercises: updated });
  };

  const handleUpdateReps = (exerciseId: string, reps: number) => {
    gymAudio.triggerSubtleHaptic([10]);
    const validReps = Math.max(1, Math.min(100, reps));
    const updated = (draft?.exercises || []).map(e =>
      e.id === exerciseId
        ? {
            ...e,
            sets: e.sets.map(s => ({ ...s, repsTarget: validReps }))
          }
        : e
    );
    onPatch({ exercises: updated });
  };

  const handleUpdateRest = (exerciseId: string, seconds: number) => {
    gymAudio.triggerSubtleHaptic([10]);
    const updated = (draft?.exercises || []).map(e =>
      e.id === exerciseId ? { ...e, restTime: seconds } : e
    );
    onPatch({ exercises: updated });
  };

  const handleUpdateMuscle = (exerciseId: string, muscle: string) => {
    const updated = (draft?.exercises || []).map(e =>
      e.id === exerciseId ? { ...e, targetMuscle: muscle } : e
    );
    onPatch({ exercises: updated });
  };

  const filteredCatalog = useMemo(
    () => filterCatalog(pickerSearch, pickerMuscle),
    [pickerSearch, pickerMuscle]
  );

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
      size="xl"
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

        {/* =========================================================================
            INTERACTIVE EXERCISE BUILDER
           ========================================================================= */}
        <section className="session-exercise-builder" aria-label={t('exercises')}>
          <div className="exercise-builder-header">
            <div className="builder-title-meta">
              <span className="builder-icon-bubble" aria-hidden="true">
                <Dumbbell width={18} height={18} />
              </span>
              <div>
                <h3 className="builder-title">{t('exercises')}</h3>
                <div className="builder-meta-subtitle">
                  <span className="builder-count-pill tabular-nums">
                    {draft?.exercises?.length || 0} {t('exercises')}
                  </span>
                  {draft?.date && (
                    <span className="builder-date-pill tabular-nums">
                      {formatDate(new Date(draft.date), 'EEE dd MMM')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant={isPickerOpen ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => {
                gymAudio.triggerSubtleHaptic([15]);
                setIsPickerOpen(prev => !prev);
              }}
              leftIcon={
                isPickerOpen ? (
                  <X width={15} height={15} aria-hidden="true" />
                ) : (
                  <Plus width={15} height={15} aria-hidden="true" />
                )
              }
            >
              {isPickerOpen ? t('close') : t('addExercise')}
            </Button>
          </div>

          {/* Interactive Exercise Search & Add Drawer */}
          <AnimatePresence>
            {isPickerOpen && (
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="exercise-picker-drawer"
              >
                <div className="picker-search-bar">
                  <Search width={16} height={16} className="picker-search-icon" aria-hidden="true" />
                  <input
                    type="search"
                    className="picker-search-input"
                    placeholder={t('searchExercises')}
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    autoFocus
                  />
                  {pickerSearch && (
                    <button
                      type="button"
                      className="picker-search-clear"
                      onClick={() => setPickerSearch('')}
                      aria-label={t('cancel')}
                    >
                      <X width={14} height={14} />
                    </button>
                  )}
                </div>

                {/* Muscle Categories Filter */}
                <div className="picker-muscle-ribbon" role="tablist">
                  {MUSCLE_GROUPS.map(muscle => {
                    const isSelected = pickerMuscle === muscle;
                    return (
                      <button
                        key={muscle}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={`picker-muscle-chip ${isSelected ? 'is-active' : ''}`}
                        onClick={() => {
                          gymAudio.triggerSubtleHaptic([10]);
                          setPickerMuscle(muscle);
                        }}
                      >
                        {muscle === 'All' ? t('allMuscles') : tMuscle(muscle)}
                      </button>
                    );
                  })}
                </div>

                {/* Catalog Grid */}
                <div className="picker-results-grid">
                  {filteredCatalog.map(item => {
                    const muscleColor = getMuscleColor(item.muscle);
                    const alreadyAdded = (draft?.exercises || []).some(
                      e => e.name.toLowerCase() === item.name.toLowerCase()
                    );

                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        className={`picker-exercise-card ${alreadyAdded ? 'is-added' : ''}`}
                        onClick={() => handleAddExerciseFromCatalog(item)}
                      >
                        <div className="picker-exercise-top">
                          <span
                            className="picker-muscle-badge"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${muscleColor} 18%, transparent)`,
                              color: muscleColor,
                              borderColor: `color-mix(in srgb, ${muscleColor} 30%, transparent)`
                            }}
                          >
                            {tMuscle(item.muscle)}
                          </span>
                          <span className="picker-sets-tag tabular-nums">
                            {item.defaultSets} {t('sets')} · {item.defaultReps} {t('reps')}
                          </span>
                        </div>
                        <h4 className="picker-exercise-name">
                          {isRTL ? item.nameAr : item.name}
                        </h4>
                        <div className="picker-exercise-footer">
                          <span className="picker-rest-tag tabular-nums">
                            <Clock width={11} height={11} aria-hidden="true" />
                            {item.restTime}s
                          </span>
                          <span className="picker-add-action">
                            {alreadyAdded ? (
                              <Check width={14} height={14} className="text-emerald-400" />
                            ) : (
                              <Plus width={14} height={14} />
                            )}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Custom Exercise Adder */}
                <div className="picker-custom-box">
                  <div className="picker-custom-label">
                    <Sparkles width={14} height={14} aria-hidden="true" />
                    <span>{t('addCustomExercise')}</span>
                  </div>
                  <div className="picker-custom-row">
                    <input
                      type="text"
                      className="input picker-custom-input"
                      placeholder={t('customExerciseName')}
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomExercise(e);
                        }
                      }}
                    />
                    <select
                      className="input picker-custom-select"
                      value={customMuscle}
                      onChange={e => setCustomMuscle(e.target.value)}
                    >
                      {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                        <option key={m} value={m}>
                          {tMuscle(m)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!customName.trim()}
                      onClick={handleAddCustomExercise}
                      leftIcon={<Plus width={14} height={14} />}
                    >
                      {t('add')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercises List */}
          {(!draft?.exercises || draft.exercises.length === 0) ? (
            <div className="exercise-builder-empty">
              <span className="builder-empty-icon" aria-hidden="true">
                <Dumbbell width={26} height={26} />
              </span>
              <p className="builder-empty-title">{t('noExercisesInSession')}</p>
              <p className="builder-empty-desc">{t('addFirstExercisePrompt')}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  gymAudio.triggerSubtleHaptic([20]);
                  setIsPickerOpen(true);
                }}
                leftIcon={<Plus width={15} height={15} />}
              >
                {t('addExercise')}
              </Button>
            </div>
          ) : (
            <div className="exercise-builder-list">
              <AnimatePresence initial={false}>
                {draft.exercises.map((exercise, index) => {
                  const isExpanded = expandedExerciseId === exercise.id;
                  const muscleColor = getMuscleColor(exercise.targetMuscle);
                  const totalSets = exercise.sets?.length || 3;
                  const repsTarget = exercise.sets?.[0]?.repsTarget || 10;
                  const restTime = exercise.restTime || 90;

                  return (
                    <motion.article
                      key={exercise.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`builder-exercise-card ${isExpanded ? 'is-expanded' : ''}`}
                      style={{ borderInlineStartColor: muscleColor }}
                    >
                      {/* Card Summary Bar */}
                      <div className="builder-exercise-row">
                        <div className="builder-exercise-drag-actions">
                          <button
                            type="button"
                            className="btn-stepper-icon"
                            disabled={index === 0}
                            onClick={() => handleMoveExercise(index, -1)}
                            aria-label={`${t('prevExercise')} — ${exercise.name}`}
                          >
                            <ArrowUp width={13} height={13} />
                          </button>
                          <span className="builder-index-num tabular-nums">#{index + 1}</span>
                          <button
                            type="button"
                            className="btn-stepper-icon"
                            disabled={index === draft.exercises!.length - 1}
                            onClick={() => handleMoveExercise(index, 1)}
                            aria-label={`${t('nextExercise')} — ${exercise.name}`}
                          >
                            <ArrowDown width={13} height={13} />
                          </button>
                        </div>

                        <div
                          className="builder-exercise-info"
                          onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedExerciseId(isExpanded ? null : exercise.id);
                            }
                          }}
                        >
                          <div className="builder-exercise-name-row">
                            <h4 className="builder-exercise-name">{exercise.name}</h4>
                            <span
                              className="builder-muscle-badge"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${muscleColor} 18%, transparent)`,
                                color: muscleColor,
                                borderColor: `color-mix(in srgb, ${muscleColor} 30%, transparent)`
                              }}
                            >
                              {tMuscle(exercise.targetMuscle || 'Chest')}
                            </span>
                          </div>

                          <div className="builder-exercise-pills-row">
                            <span className="builder-meta-pill tabular-nums">
                              <Layers width={11} height={11} aria-hidden="true" />
                              {totalSets} {t('exerciseSetsCount')}
                            </span>
                            <span className="builder-meta-pill tabular-nums">
                              {repsTarget} {t('reps')}
                            </span>
                            <span className="builder-meta-pill tabular-nums">
                              <Clock width={11} height={11} aria-hidden="true" />
                              {restTime}s
                            </span>
                          </div>
                        </div>

                        <div className="builder-exercise-actions">
                          <button
                            type="button"
                            className="btn-card-action edit-action"
                            onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                            aria-label={`${isExpanded ? t('close') : t('edit')} — ${exercise.name}`}
                          >
                            {isExpanded ? (
                              <ChevronUp width={16} height={16} />
                            ) : (
                              <ChevronDown width={16} height={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-card-action delete-action"
                            onClick={() => handleRemoveExercise(exercise.id)}
                            aria-label={`${t('deleteExercise')} — ${exercise.name}`}
                          >
                            <Trash2 width={15} height={15} />
                          </button>
                        </div>
                      </div>

                      {/* Card Expanded Controls */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="builder-exercise-detail-panel"
                          >
                            {/* Steppers Grid */}
                            <div className="builder-steppers-grid">
                              {/* Sets Stepper */}
                              <div className="builder-stepper-cell">
                                <span className="stepper-cell-label">{t('exerciseSetsCount')}</span>
                                <div className="builder-stepper-control">
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={totalSets <= 1}
                                    onClick={() => handleRemoveSet(exercise.id)}
                                    aria-label={`Decrease sets for ${exercise.name}`}
                                  >
                                    <Minus width={14} height={14} />
                                  </button>
                                  <span className="stepper-value tabular-nums">{totalSets}</span>
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={totalSets >= 10}
                                    onClick={() => handleAddSet(exercise.id)}
                                    aria-label={`Increase sets for ${exercise.name}`}
                                  >
                                    <Plus width={14} height={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Target Reps Stepper */}
                              <div className="builder-stepper-cell">
                                <span className="stepper-cell-label">{t('exerciseRepsCount')}</span>
                                <div className="builder-stepper-control">
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={repsTarget <= 1}
                                    onClick={() => handleUpdateReps(exercise.id, repsTarget - 1)}
                                    aria-label={`Decrease reps for ${exercise.name}`}
                                  >
                                    <Minus width={14} height={14} />
                                  </button>
                                  <span className="stepper-value tabular-nums">{repsTarget}</span>
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    disabled={repsTarget >= 99}
                                    onClick={() => handleUpdateReps(exercise.id, repsTarget + 1)}
                                    aria-label={`Increase reps for ${exercise.name}`}
                                  >
                                    <Plus width={14} height={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Target Muscle Selector */}
                              <div className="builder-stepper-cell">
                                <span className="stepper-cell-label">{t('tutorialTargetMuscle')}</span>
                                <select
                                  className="input builder-select"
                                  value={exercise.targetMuscle || 'Chest'}
                                  onChange={e => handleUpdateMuscle(exercise.id, e.target.value)}
                                >
                                  {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                                    <option key={m} value={m}>
                                      {tMuscle(m)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Reps Presets Ribbon */}
                            <div className="builder-presets-row">
                              <span className="presets-label">{t('reps')}:</span>
                              <div className="presets-chips">
                                {REPS_PRESETS.map(r => (
                                  <button
                                    key={r}
                                    type="button"
                                    className={`preset-pill ${repsTarget === r ? 'is-selected' : ''}`}
                                    onClick={() => handleUpdateReps(exercise.id, r)}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Rest Timer Presets Ribbon */}
                            <div className="builder-presets-row">
                              <span className="presets-label">
                                <Clock width={12} height={12} aria-hidden="true" />
                                {t('exerciseRestTime')}:
                              </span>
                              <div className="presets-chips">
                                {REST_PRESETS.map(seconds => (
                                  <button
                                    key={seconds}
                                    type="button"
                                    className={`preset-pill ${restTime === seconds ? 'is-selected' : ''}`}
                                    onClick={() => handleUpdateRest(exercise.id, seconds)}
                                  >
                                    {seconds}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        <div className="calendar-field">
          <div className="calendar-field-head">
            <label className="calendar-field-label" htmlFor={ids.notes.field}>
              {t('notesInput')}
            </label>
          </div>
          <textarea
            id={ids.notes.field}
            className="input"
            rows={2}
            value={draft?.notes || ''}
            onChange={event => onPatch({ notes: event.target.value })}
            aria-describedby={ids.notes.hint}
          />
          <p className="calendar-field-hint" id={ids.notes.hint}>
            {t('sessionNotesHint')}
          </p>
        </div>

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
