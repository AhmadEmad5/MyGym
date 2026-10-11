import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { isSameDay } from 'date-fns';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Layers,
  Minus,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Timer,
  Trash2,
  Undo2,
  X,
  Zap
} from 'lucide-react';
import type { SessionExercise, SetRecord, WorkoutSession } from '../../../lib/api';
import { isRestDay, restDayName, type RestDaySource } from '../../../lib/restDay';
import { Button } from '../../ui';
import { useReducedMotion } from '../../performance/useReducedMotion';
import { gymAudio } from '../../../lib/audio';
import { notify } from '../../../lib/feedback';
import { useGsapStagger } from '../../../lib/useGsapStagger';
import { TEMPLATE_NAMES } from './templates';
import {
  filterCatalog,
  MUSCLE_GROUPS,
  type CatalogExerciseItem,
  type MuscleGroup
} from './exerciseCatalog';

export type FieldName = 'title' | 'date' | 'duration';

export type NewSessionDrawerProps = {
  isOpen: boolean;
  draft: Partial<WorkoutSession> | null;
  isRTL: boolean;
  restDaySettings?: RestDaySource;
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

// Exercise creator helper
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
      return 'var(--accent-primary, #10b981)';
  }
}

const REST_PRESETS = [30, 60, 90, 120, 180];
const REPS_PRESETS = [6, 8, 10, 12, 15, 20];
const DURATION_PRESETS = [30, 45, 60, 90, 120];

// Template metadata icon & accent mapping
function getTemplateIcon(templateName: string) {
  if (templateName.includes('Push')) return Flame;
  if (templateName.includes('Pull')) return Zap;
  if (templateName.includes('Legs')) return Dumbbell;
  if (templateName.includes('Chest')) return Layers;
  if (templateName.includes('Back')) return ActivityIcon;
  if (templateName.includes('Shoulders')) return Sparkles;
  if (templateName.includes('Biceps')) return Dumbbell;
  if (templateName.includes('Triceps')) return Zap;
  if (templateName.includes('Forearms')) return Layers;
  if (templateName.includes('Core')) return HeartPulse;
  return Dumbbell;
}

function ActivityIcon(props: any) {
  return <HeartPulse {...props} />;
}

// Session type options with icons & gradients
const SESSION_TYPES = [
  {
    key: 'Strength',
    icon: Dumbbell,
    accent: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/40 text-emerald-400'
  },
  {
    key: 'Cardio',
    icon: HeartPulse,
    accent: 'rose',
    gradient: 'from-rose-500/20 to-pink-500/10',
    border: 'border-rose-500/40 text-rose-400'
  },
  {
    key: 'Yoga',
    icon: Sparkles,
    accent: 'purple',
    gradient: 'from-purple-500/20 to-indigo-500/10',
    border: 'border-purple-500/40 text-purple-400'
  },
  {
    key: 'HIIT',
    icon: Flame,
    accent: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/40 text-amber-400'
  },
  {
    key: 'Other',
    icon: Layers,
    accent: 'cyan',
    gradient: 'from-cyan-500/20 to-sky-500/10',
    border: 'border-cyan-500/40 text-cyan-400'
  }
];

export function NewSessionDrawer({
  isOpen,
  draft,
  isRTL,
  restDaySettings,
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
}: NewSessionDrawerProps) {
  const reducedMotion = useReducedMotion();
  const uid = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const sheetCardRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const wasRestDay = useRef(false);

  // GSAP Entrance Stagger for form sections
  const formRef = useGsapStagger<HTMLFormElement>({
    selector: '.gsap-form-section',
    delay: 0.08,
    stagger: 0.04,
    duration: 0.32,
    yOffset: 12
  });

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

  const [showManualTime, setShowManualTime] = useState(false);
  const isTodayDate = Boolean(draft?.date) && isSameDay(new Date(draft!.date!), new Date());

  const restDayNameLocal = restDayName(restDaySettings, isRTL);
  const isRestDayDate = Boolean(draft?.date) && isRestDay(new Date(draft!.date!), restDaySettings);
  const modalTitle = draft?.id ? t('editSessionTitle') : t('newSessionTitle');

  const titleError = String(draft?.title ?? '').trim() === '' ? t('sessionTitleRequired') : '';
  const dateError = !draft?.date ? t('sessionDateRequired') : '';
  const restDayError = isRestDayDate
    ? isRTL
      ? `${restDayNameLocal} يوم عطلة أسبوعي والجيم مغلق. اختر يوماً آخر للحفظ.`
      : `${restDayNameLocal} is the weekly off-day and the gym is closed. Pick another day to save.`
    : '';
  const dateMessage = dateError || restDayError;
  const rawDuration = draft?.duration;
  const durationError =
    rawDuration === undefined || rawDuration === null || !Number.isFinite(Number(rawDuration))
      ? t('sessionDurationRequired')
      : Number(rawDuration) < 1
        ? t('sessionDurationMin')
        : '';

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
    const active = name === 'date' ? isRestDayDate || hasSubmitted || touched.date : hasSubmitted || touched[name];
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
    wasRestDay.current = false;
  }, [isOpen, draft?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (isRestDayDate && !wasRestDay.current) setNotice(restDayError);
    wasRestDay.current = isRestDayDate;
  }, [isOpen, isRestDayDate, restDayError]);

  useEffect(() => {
    if (!pendingFocus) return;
    setPendingFocus(null);
    if (showSummary && summaryRef.current) {
      summaryRef.current.focus();
      return;
    }
    const firstInvalid = summaryItems[0];
    if (firstInvalid) focusField(firstInvalid.key);
  }, [pendingFocus, showSummary, summaryItems, focusField]);

  // Touch Swipe to Dismiss Gesture for Mobile Drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchDeltaY.current = 0;
    if (sheetCardRef.current) {
      sheetCardRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      touchDeltaY.current = delta;
      if (sheetCardRef.current) {
        sheetCardRef.current.style.transform = `translateY(${delta}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    const delta = touchDeltaY.current;
    touchStartY.current = null;
    touchDeltaY.current = 0;

    if (sheetCardRef.current) {
      sheetCardRef.current.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      if (delta > 75) {
        sheetCardRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          onClose();
        }, 160);
      } else {
        sheetCardRef.current.style.transform = 'translateY(0px)';
      }
    }
  };

  const markTouched = (name: FieldName) => {
    setTouched(prev => (prev[name] ? prev : { ...prev, [name]: true }));
  };

  const markTemplateEdit = (field: 'title' | 'type') => {
    if (!templateActive || templateEdits[field]) return;
    setTemplateEdits(prev => ({ ...prev, [field]: true }));
  };

  const handleApplyTemplate = (name: string) => {
    if (isSubmitting) return;
    gymAudio.triggerSubtleHaptic([15, 20]);
    if (!templateActive) {
      setTemplateSnapshot({
        title: draft?.title,
        type: draft?.type,
        exercises: draft?.exercises ? [...draft.exercises] : []
      });
    }
    setActiveTemplate(name);
    setTemplateEdits({ title: false, type: false });
    onApplyTemplate(name);
  };

  const handleUndoTemplate = () => {
    if (isSubmitting || !templateSnapshot) return;
    gymAudio.triggerSubtleHaptic([25]);
    const snapshot = templateSnapshot;
    setActiveTemplate(null);
    setTemplateSnapshot(null);
    setTemplateEdits({ title: false, type: false });
    onPatch({
      title: snapshot.title ?? '',
      type: snapshot.type ?? 'Strength',
      exercises: snapshot.exercises ?? []
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setHasSubmitted(true);
    setTouched({ title: true, date: true, duration: true });

    if (!draft?.title?.trim()) {
      gymAudio.triggerSubtleHaptic([35, 45]);
      notify(isRTL ? 'يرجى إدخال اسم الجلسة التدريبية أو اختيار قالب سريع' : 'Please enter a workout title or pick a quick template', 'warning');
      focusField('title');
      return;
    }

    if (summaryItems.length > 0) {
      gymAudio.triggerSubtleHaptic([35, 45]);
      setPendingFocus('summary');
      return;
    }
    gymAudio.triggerSubtleHaptic([40, 60]);
    onSubmit(event);
  };

  // Date shortcut chip helper - uses phone's current live time
  const handleDateShortcut = (daysAhead: number) => {
    gymAudio.triggerSubtleHaptic([10]);
    const now = new Date();
    const d = new Date();
    d.setDate(now.getDate() + daysAhead);
    d.setHours(now.getHours(), now.getMinutes(), 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const localIso = `${year}-${month}-${day}T${hours}:${minutes}`;

    onPatch({ date: localIso });
    markTouched('date');
  };

  // Duration adjustments
  const adjustDuration = (delta: number) => {
    gymAudio.triggerSubtleHaptic([8]);
    const current = Number(draft?.duration) || 60;
    const next = Math.max(5, Math.min(360, current + delta));
    onPatch({ duration: next });
    markTouched('duration');
  };

  const setExactDuration = (val: number) => {
    gymAudio.triggerSubtleHaptic([12]);
    onPatch({ duration: val });
    markTouched('duration');
  };

  // Exercise catalog actions
  const filteredCatalog = useMemo(() => {
    return filterCatalog(pickerSearch, pickerMuscle);
  }, [pickerSearch, pickerMuscle]);

  const handleAddExerciseFromCatalog = (item: CatalogExerciseItem) => {
    gymAudio.triggerSubtleHaptic([20]);
    const newEx = createSessionExercise(
      item.name,
      item.muscle,
      item.defaultSets,
      item.defaultReps,
      item.restTime,
      item.notes
    );
    const existing = draft?.exercises || [];
    onPatch({ exercises: [...existing, newEx] });
    setExpandedExerciseId(newEx.id);
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    gymAudio.triggerSubtleHaptic([25]);
    const newEx = createSessionExercise(customName.trim(), customMuscle, 3, 10, 90, '');
    const existing = draft?.exercises || [];
    onPatch({ exercises: [...existing, newEx] });
    setCustomName('');
    setExpandedExerciseId(newEx.id);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    gymAudio.triggerSubtleHaptic([20]);
    const existing = draft?.exercises || [];
    onPatch({ exercises: existing.filter(e => e.id !== exerciseId) });
    if (expandedExerciseId === exerciseId) setExpandedExerciseId(null);
  };

  const handleMoveExercise = (exerciseId: string, direction: 'up' | 'down') => {
    gymAudio.triggerSubtleHaptic([10]);
    const existing = [...(draft?.exercises || [])];
    const index = existing.findIndex(e => e.id === exerciseId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existing.length) return;
    const [moved] = existing.splice(index, 1);
    existing.splice(targetIndex, 0, moved);
    onPatch({ exercises: existing });
  };

  const handleAddSet = (exerciseId: string) => {
    gymAudio.triggerSubtleHaptic([15]);
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex) return;
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: SetRecord = {
      id: `s-${exerciseId}-${Date.now().toString(36)}`,
      weight: lastSet ? lastSet.weight : 0,
      repsTarget: lastSet ? lastSet.repsTarget : 10,
      repsActual: 0,
      unit: lastSet ? lastSet.unit : 'kg',
      isCompleted: false
    };
    ex.sets = [...ex.sets, newSet];
    onPatch({ exercises: existing });
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    gymAudio.triggerSubtleHaptic([15]);
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex || ex.sets.length <= 1) return;
    ex.sets = ex.sets.filter(s => s.id !== setId);
    onPatch({ exercises: existing });
  };

  const handleUpdateSet = (exerciseId: string, setId: string, patch: Partial<SetRecord>) => {
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex) return;
    ex.sets = ex.sets.map(s => (s.id === setId ? { ...s, ...patch } : s));
    onPatch({ exercises: existing });
  };

  const handleUpdateRest = (exerciseId: string, seconds: number) => {
    gymAudio.triggerSubtleHaptic([10]);
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex) return;
    ex.restTime = seconds;
    onPatch({ exercises: existing });
  };

  const handleUpdateReps = (exerciseId: string, reps: number) => {
    gymAudio.triggerSubtleHaptic([10]);
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex) return;
    ex.sets = ex.sets.map(s => ({ ...s, repsTarget: reps }));
    onPatch({ exercises: existing });
  };

  const handleUpdateMuscle = (exerciseId: string, muscle: string) => {
    const existing = [...(draft?.exercises || [])];
    const ex = existing.find(e => e.id === exerciseId);
    if (!ex) return;
    ex.targetMuscle = muscle;
    onPatch({ exercises: existing });
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[var(--z-modal,10000)] flex items-end sm:items-center justify-center p-0 sm:p-4 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-modal-title`}
      >
        {/* Backdrop with blurred obsidian glass */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal / Drawer Surface Card */}
        <motion.div
          ref={sheetCardRef}
          initial={reducedMotion ? { opacity: 0 } : { y: '100%', opacity: 0.95 }}
          animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          transition={reducedMotion ? { duration: 0.15 } : { type: 'spring', damping: 28, stiffness: 350 }}
          style={{ willChange: 'transform, opacity' }}
          className="relative w-full max-h-[92vh] sm:max-h-[88vh] sm:max-w-2xl lg:max-w-3xl flex flex-col overflow-hidden z-10 bg-zinc-950/95 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] outline-none"
          onClick={e => e.stopPropagation()}
        >
          {/* Subtle Ambient Glowing Mesh Accent behind Header */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 blur-3xl pointer-events-none rounded-full"
            aria-hidden="true"
          />

          {/* Mobile Top Drag Handle */}
          <div
            className="sm:hidden flex justify-center pt-2.5 pb-1 touch-none cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-hidden="true"
          >
            <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors" />
          </div>

          {/* Header Bar */}
          <header className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-900/60 shrink-0 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                <Dumbbell className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id={`${uid}-modal-title`}
                  className="text-lg sm:text-xl font-bold tracking-tight text-white truncate"
                >
                  {modalTitle}
                </h2>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {draft?.id
                    ? isRTL
                      ? 'تعديل تفاصيل وتمارين الجلسة المجدولة'
                      : 'Edit scheduled routine, sets & duration'
                    : isRTL
                    ? 'اختر قالباً سريعاً أو ابنِ جلستك الرياضية بدقة'
                    : 'Choose a quick template or build custom session'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-zinc-400 hover:text-white shrink-0"
              aria-label={t('cancel')}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain space-y-6">
            <form
              ref={formRef}
              tabIndex={-1}
              noValidate
              aria-busy={isSubmitting || undefined}
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
            >
              {/* Validation Summary if any error */}
              {showSummary && (
                <motion.div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  aria-labelledby={`${uid}-summary-title`}
                  className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col gap-2"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <p id={`${uid}-summary-title`} className="flex items-center gap-2 text-rose-400 text-sm font-bold m-0">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {t('sessionFormFixErrors')}
                  </p>
                  <ul className="text-xs text-rose-300 list-disc list-inside space-y-1">
                    {summaryItems.map(item => (
                      <li key={item.key}>
                        <a
                          href={`#${ids[item.key].field}`}
                          className="hover:underline text-rose-300 font-medium"
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

              {/* -------------------------------------------------------------
                  TRACK 2: REDESIGNED QUICK TEMPLATES CAROUSEL
                 ------------------------------------------------------------- */}
              {!draft?.id && (
                <section
                  className="gsap-form-section flex flex-col gap-2.5 p-4 rounded-2xl bg-zinc-900/50 border border-white/10"
                  aria-labelledby={`${uid}-templates-label`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      <span id={`${uid}-templates-label`} className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        {t('quickTemplates')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-semibold tabular-nums">
                        {TEMPLATE_NAMES.length} {isRTL ? 'قوالب' : 'templates'}
                      </span>
                    </div>

                    {canUndoTemplate && (
                      <button
                        type="button"
                        onClick={handleUndoTemplate}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all active:scale-95"
                      >
                        <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('quickTemplateClear')}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 m-0" id={`${uid}-templates-hint`}>
                    {t('quickTemplatesHint')}
                  </p>

                  {/* Clean Snap-Scroller Ribbon with Zero Cutoffs */}
                  <div
                    className="snap-x snap-mandatory overflow-x-auto no-scrollbar flex items-center gap-2.5 pb-1 pt-1.5 scroll-smooth overscroll-x-contain"
                    role="group"
                    aria-describedby={`${uid}-templates-hint`}
                  >
                    {TEMPLATE_NAMES.map(name => {
                      const selected = templateActive && activeTemplate === name;
                      const IconComp = getTemplateIcon(name);
                      const displayName =
                        name === 'Push Workout' || name === 'Pull Workout' || name === 'Legs Workout'
                          ? tTitle(name)
                          : tMuscle(name.replace(' Workout', ''));

                      return (
                        <button
                          key={name}
                          type="button"
                          aria-pressed={selected}
                          disabled={isSubmitting}
                          onClick={() => handleApplyTemplate(name)}
                          className={`snap-start shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] border ${
                            selected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40'
                              : 'bg-zinc-900/90 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-zinc-800/90 hover:text-white'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 shrink-0 ${selected ? 'text-emerald-400' : 'text-zinc-400'}`} aria-hidden="true" />
                          <span>{displayName}</span>
                          {selected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 ml-1 shrink-0" aria-hidden="true" />
                          ) : (
                            <span className="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded-md tabular-nums">
                              3 {isRTL ? 'تمارين' : 'ex'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {templateActive && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t('quickTemplateApplied')}</span>
                    </div>
                  )}
                </section>
              )}

              {/* -------------------------------------------------------------
                  TRACK 3: HIGH-END TITLE INPUT
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={ids.title.field}
                    className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    {t('sessionTitleInput')}
                  </label>
                  {titleFromTemplate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {t('quickTemplateSelected')}
                    </span>
                  )}
                </div>

                <div
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl bg-zinc-900/70 border transition-all ${
                    showError('title')
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-white/10 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20'
                  }`}
                >
                  <Dumbbell className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
                  <input
                    id={ids.title.field}
                    ref={titleRef}
                    required
                    type="text"
                    placeholder={isRTL ? 'مثال: تمارين الصدر والبايسيبس، أرجل قوية...' : 'e.g. Chest & Biceps Hypertrophy, Heavy Leg Day...'}
                    className="w-full bg-transparent text-white font-medium placeholder:text-zinc-400 text-sm focus:outline-none"
                    value={draft?.title || ''}
                    onChange={event => {
                      markTemplateEdit('title');
                      onPatch({ title: event.target.value });
                    }}
                    onBlur={() => markTouched('title')}
                    aria-invalid={showError('title') || undefined}
                    aria-describedby={describedBy('title', showError('title'))}
                  />
                </div>

                <p className="text-xs text-zinc-400 m-0" id={ids.title.hint}>
                  {t('sessionTitleHint')}
                </p>
                {showError('title') && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 font-bold m-0" id={ids.title.error}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {titleError}
                  </p>
                )}
              </section>

              {/* -------------------------------------------------------------
                  TRACK 3: AUTOMATIC PHONE TIME & SMART DATE SELECTOR
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    {isRTL ? 'توقيت الهاتف التلقائي' : 'Automatic Phone Time'}
                  </span>

                  {/* Live Status Badge */}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isRTL ? 'مزامنة حيّة مع الهاتف' : 'Live Phone Sync'}
                  </span>
                </div>

                {/* Modern Auto-Time Card */}
                <div
                  className={`p-4 rounded-2xl bg-zinc-900/80 border transition-all flex flex-col gap-3.5 ${
                    showError('date') || isRestDayDate
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-white/10 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold text-white truncate tabular-nums">
                          {draft?.date
                            ? formatDate(new Date(draft.date), 'EEEE, d MMMM · h:mm a')
                            : formatDate(new Date(), 'EEEE, d MMMM · h:mm a')}
                        </div>
                        <p className="text-xs text-zinc-400 m-0 mt-0.5">
                          {isRTL
                            ? 'مضبوط تلقائياً حسب توقيت هاتفك الحالي'
                            : 'Automatically set to your current phone time'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowManualTime(prev => !prev)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-all border border-white/10 shrink-0"
                    >
                      {showManualTime ? (isRTL ? 'إخفاء التعديل' : 'Hide Custom') : (isRTL ? 'تعديل يدوي' : 'Custom Time')}
                    </button>
                  </div>

                  {/* Quick Day Switcher Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleDateShortcut(0)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all active:scale-95 text-center ${
                        isTodayDate
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm ring-1 ring-emerald-400/30'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/10 hover:bg-zinc-800'
                      }`}
                    >
                      {isRTL ? 'اليوم (الآن)' : 'Today (Now)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateShortcut(1)}
                      className="py-2 px-2 text-xs font-bold rounded-xl border transition-all active:scale-95 text-center bg-zinc-900 text-zinc-400 hover:text-white border-white/10 hover:bg-zinc-800"
                    >
                      {isRTL ? 'غداً' : 'Tomorrow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDateShortcut(2)}
                      className="py-2 px-2 text-xs font-bold rounded-xl border transition-all active:scale-95 text-center bg-zinc-900 text-zinc-400 hover:text-white border-white/10 hover:bg-zinc-800"
                    >
                      {isRTL ? '+2 يوم' : '+2 Days'}
                    </button>
                  </div>

                  {/* Optional Custom Manual Datetime Selector (collapsed by default) */}
                  <AnimatePresence>
                    {showManualTime && (
                      <motion.div
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pt-3 border-t border-white/5 overflow-hidden flex flex-col gap-2"
                      >
                        <label
                          htmlFor={ids.date.field}
                          className="text-[11px] font-semibold text-zinc-400 block"
                        >
                          {isRTL ? 'اختر تاريخاً أو وقتاً مخصصاً للجلسة:' : 'Select custom date & time:'}
                        </label>
                        <input
                          id={ids.date.field}
                          ref={dateRef}
                          required
                          type="datetime-local"
                          className="w-full bg-zinc-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white [color-scheme:dark] tabular-nums focus:outline-none focus:border-emerald-500/50"
                          value={draft?.date || ''}
                          onChange={event => onPatch({ date: event.target.value })}
                          onBlur={() => markTouched('date')}
                          aria-invalid={showError('date') || undefined}
                          aria-describedby={describedBy('date', showError('date'))}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {(isRestDayDate || showError('date')) && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold"
                    id={ids.date.error}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{dateMessage}</span>
                  </div>
                )}
              </section>

              {/* -------------------------------------------------------------
                  TRACK 3: DURATION CONTROL WITH STEPPER & PRESETS
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={ids.duration.field}
                    className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"
                  >
                    <Timer className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    {t('durationInput')}
                  </label>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5">
                    {DURATION_PRESETS.map(preset => {
                      const isMatch = Number(draft?.duration) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setExactDuration(preset)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all active:scale-95 tabular-nums ${
                            isMatch
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-sm'
                              : 'bg-white/5 text-zinc-400 hover:text-white border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {preset}m
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stepper Input Row */}
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 p-1.5 rounded-xl bg-zinc-900/70 border border-white/10">
                  <button
                    type="button"
                    onClick={() => adjustDuration(-5)}
                    className="min-w-[40px] min-h-[40px] rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-zinc-300 hover:text-white border border-white/10"
                    aria-label={isRTL ? 'إنقاص 5 دقائق' : 'Decrease 5 minutes'}
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 px-3">
                    <input
                      id={ids.duration.field}
                      ref={durationRef}
                      required
                      type="number"
                      min={5}
                      max={360}
                      step={5}
                      className="w-16 bg-transparent text-center text-white font-bold text-lg focus:outline-none tabular-nums"
                      value={draft?.duration || 60}
                      onChange={event => onPatch({ duration: Number(event.target.value) || 60 })}
                      onBlur={() => markTouched('duration')}
                      aria-invalid={showError('duration') || undefined}
                      aria-describedby={describedBy('duration', showError('duration'))}
                    />
                    <span className="text-xs font-semibold text-zinc-400">
                      {isRTL ? 'دقيقة' : 'minutes'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustDuration(5)}
                    className="min-w-[40px] min-h-[40px] rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-zinc-300 hover:text-white border border-white/10"
                    aria-label={isRTL ? 'زيادة 5 دقائق' : 'Increase 5 minutes'}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span id={ids.duration.hint}>{t('sessionDurationHint')}</span>
                  <button
                    type="button"
                    onClick={() => adjustDuration(15)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    +15m Quick Add
                  </button>
                </div>

                {showError('duration') && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 font-bold m-0" id={ids.duration.error}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {durationError}
                  </p>
                )}
              </section>

              {/* -------------------------------------------------------------
                  TRACK 3: SESSION TYPE SELECTOR (SEGMENTED RADIO CHIP GRID)
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={ids.type.field}
                    className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    {t('typeInput')}
                  </label>
                  {typeFromTemplate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {t('quickTemplateSelected')}
                    </span>
                  )}
                </div>

                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                  role="radiogroup"
                  aria-labelledby={`${uid}-type-label`}
                >
                  {SESSION_TYPES.map(st => {
                    const isSelected = (draft?.type || 'Strength') === st.key;
                    const Icon = st.icon;
                    const typeLabel =
                      st.key === 'Strength'
                        ? t('strengthType')
                        : st.key === 'Cardio'
                        ? t('cardioType')
                        : st.key === 'Yoga'
                        ? t('yogaType')
                        : st.key === 'HIIT'
                        ? t('hiitType')
                        : t('otherType');

                    return (
                      <button
                        key={st.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          gymAudio.triggerSubtleHaptic([12]);
                          markTemplateEdit('type');
                          onPatch({ type: st.key });
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                          isSelected
                            ? `bg-gradient-to-br ${st.gradient} ${st.border} shadow-sm ring-1 ring-white/10`
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/10' : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-white truncate">
                            {typeLabel}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-zinc-400 m-0" id={ids.type.hint}>
                  {t('sessionTypeHint')}
                </p>
              </section>

              {/* -------------------------------------------------------------
                  INTERACTIVE EXERCISE BUILDER (PRESERVED & ENHANCED)
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Dumbbell className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white m-0">{t('exercises')}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 tabular-nums">
                          {draft?.exercises?.length || 0} {t('exercises')}
                        </span>
                        {draft?.date && (
                          <span className="text-[11px] text-zinc-400 tabular-nums">
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
                        <X className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      )
                    }
                  >
                    {isPickerOpen ? t('close') : t('addExercise')}
                  </Button>
                </div>

                {/* Exercise Search & Catalog Drawer */}
                <AnimatePresence>
                  {isPickerOpen && (
                    <motion.div
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-950/80 border border-white/10 overflow-hidden"
                    >
                      {/* Search Bar */}
                      <div className="relative flex items-center w-full">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-auto rtl:right-3 pointer-events-none" aria-hidden="true" />
                        <input
                          type="search"
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-cyan-500/50"
                          placeholder={t('searchExercises')}
                          value={pickerSearch}
                          onChange={e => setPickerSearch(e.target.value)}
                          autoFocus
                        />
                        {pickerSearch && (
                          <button
                            type="button"
                            className="absolute right-3 rtl:right-auto rtl:left-3 text-zinc-400 hover:text-white"
                            onClick={() => setPickerSearch('')}
                            aria-label={t('cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Muscle Categories Ribbon */}
                      <div className="snap-x snap-mandatory overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
                        {MUSCLE_GROUPS.map(muscle => {
                          const isSelected = pickerMuscle === muscle;
                          return (
                            <button
                              key={muscle}
                              type="button"
                              role="tab"
                              aria-selected={isSelected}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                              }`}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {filteredCatalog.map(item => {
                          const muscleColor = getMuscleColor(item.muscle);
                          const alreadyAdded = (draft?.exercises || []).some(
                            e => e.name.toLowerCase() === item.name.toLowerCase()
                          );

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleAddExerciseFromCatalog(item)}
                              className={`flex flex-col text-left rtl:text-right p-3 rounded-xl border transition-all active:scale-[0.98] ${
                                alreadyAdded
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-zinc-900/80 border-white/5 hover:border-white/15 hover:bg-zinc-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 w-full mb-1">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${muscleColor} 18%, transparent)`,
                                    color: muscleColor
                                  }}
                                >
                                  {tMuscle(item.muscle)}
                                </span>
                                <span className="text-[10px] text-zinc-400 tabular-nums">
                                  {item.defaultSets} {t('sets')} · {item.defaultReps} {t('reps')}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-white truncate">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add Custom Exercise Form */}
                      <form
                        onSubmit={handleAddCustomExercise}
                        className="flex items-center gap-2 pt-2 border-t border-white/10"
                      >
                        <input
                          type="text"
                          placeholder={isRTL ? 'إضافة تمرين مخصص...' : 'Add custom exercise name...'}
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-400 focus:outline-none"
                        />
                        <select
                          value={customMuscle}
                          onChange={e => setCustomMuscle(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                            <option key={m} value={m}>
                              {tMuscle(m)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={!customName.trim()}
                          className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs disabled:opacity-40 transition-colors"
                        >
                          {t('add')}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List of Added Exercises */}
                {(!draft?.exercises || draft.exercises.length === 0) ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-zinc-950/40 border border-dashed border-white/10 text-zinc-400">
                    <Dumbbell className="w-8 h-8 text-zinc-400 mb-2 opacity-50" aria-hidden="true" />
                    <p className="text-xs font-semibold m-0">{t('noExercisesAdded')}</p>
                    <p className="text-[11px] text-zinc-400 mt-1 mb-0">{t('chooseTemplateOrAdd')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {draft.exercises.map((exercise, idx) => {
                      const isExpanded = expandedExerciseId === exercise.id;
                      const muscleColor = getMuscleColor(exercise.targetMuscle);

                      return (
                        <div
                          key={exercise.id}
                          className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/10 flex flex-col gap-3"
                        >
                          {/* Exercise Card Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-white/5 text-zinc-400 font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate m-0">
                                  {exercise.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                                    style={{ color: muscleColor }}
                                  >
                                    {tMuscle(exercise.targetMuscle || 'Chest')}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 tabular-nums">
                                    {exercise.sets.length} {t('sets')} · {exercise.restTime}s rest
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveExercise(exercise.id, 'up')}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                aria-label="Move Up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (draft.exercises?.length || 0) - 1}
                                onClick={() => handleMoveExercise(exercise.id, 'down')}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                                aria-label="Move Down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedExerciseId(prev => (prev === exercise.id ? null : exercise.id))
                                }
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                aria-label="Expand Sets"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(exercise.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                aria-label="Delete Exercise"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Exercise Sets Table (when expanded) */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-white/5 space-y-3">
                              <div className="space-y-1.5">
                                {exercise.sets.map((set, sIdx) => (
                                  <div
                                    key={set.id}
                                    className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-2 p-1.5 rounded-lg bg-zinc-900/60 text-xs"
                                  >
                                    <span className="w-5 text-center font-bold text-zinc-400 tabular-nums">
                                      #{sIdx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        value={set.weight || ''}
                                        placeholder="0"
                                        onChange={e =>
                                          handleUpdateSet(exercise.id, set.id, {
                                            weight: parseFloat(e.target.value) || 0
                                          })
                                        }
                                        className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-center font-bold text-white tabular-nums"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateSet(exercise.id, set.id, {
                                            unit: set.unit === 'kg' ? 'lb' : 'kg'
                                          })
                                        }
                                        className="px-1.5 py-1 text-[10px] font-bold rounded bg-white/5 hover:bg-white/10 text-zinc-400 uppercase"
                                      >
                                        {set.unit}
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={1}
                                        value={set.repsTarget || 10}
                                        onChange={e =>
                                          handleUpdateSet(exercise.id, set.id, {
                                            repsTarget: parseInt(e.target.value, 10) || 1
                                          })
                                        }
                                        className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-center font-bold text-white tabular-nums"
                                      />
                                      <span className="text-[10px] text-zinc-400">{t('reps')}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateSet(exercise.id, set.id, {
                                          isCompleted: !set.isCompleted
                                        })
                                      }
                                      className={`p-1 rounded ${
                                        set.isCompleted
                                          ? 'bg-emerald-500 text-black'
                                          : 'bg-white/5 text-zinc-400 hover:text-white'
                                      }`}
                                      aria-label="Toggle Complete"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>

                                    {exercise.sets.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSet(exercise.id, set.id)}
                                        className="p-1 text-zinc-400 hover:text-rose-400"
                                        aria-label="Remove Set"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Exercise Target Muscle Selector */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                <span className="text-[11px] text-zinc-400 font-semibold">{t('muscleGroup') || 'العضلة المستهدفة'}:</span>
                                <select
                                  value={exercise.targetMuscle || 'Chest'}
                                  onChange={e => handleUpdateMuscle(exercise.id, e.target.value)}
                                  className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                >
                                  {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                                    <option key={m} value={m}>
                                      {tMuscle(m)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Reps Presets Ribbon */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-zinc-400 font-semibold">{t('reps')}:</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {REPS_PRESETS.map(r => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => handleUpdateReps(exercise.id, r)}
                                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-white/5 hover:bg-white/10 text-zinc-400 tabular-nums transition-colors"
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddSet(exercise.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  {t('addSet')}
                                </button>

                                {/* Rest Timer Presets */}
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-400" />
                                  {REST_PRESETS.map(sec => (
                                    <button
                                      key={sec}
                                      type="button"
                                      onClick={() => handleUpdateRest(exercise.id, sec)}
                                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                        exercise.restTime === sec
                                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                          : 'bg-white/5 text-zinc-400'
                                      }`}
                                    >
                                      {sec}s
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Screen reader notice */}
              <span className="sr-only" role="status">
                {notice}
              </span>

              {/* -------------------------------------------------------------
                  NOTES SECTION
                 ------------------------------------------------------------- */}
              <section className="gsap-form-section flex flex-col gap-2">
                <label
                  htmlFor={ids.notes.field}
                  className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                >
                  {t('notesInput')}
                </label>
                <textarea
                  id={ids.notes.field}
                  className="w-full bg-zinc-900/70 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50"
                  rows={2}
                  placeholder={isRTL ? 'ملاحظات إضافية عن الحمل التدريبي أو الحالة البدنية...' : 'Session notes, target RPE, warm-up reminders...'}
                  value={draft?.notes || ''}
                  onChange={event => onPatch({ notes: event.target.value })}
                  aria-describedby={ids.notes.hint}
                />
                <p className="text-xs text-zinc-400 m-0" id={ids.notes.hint}>
                  {t('sessionNotesHint')}
                </p>
              </section>

              {submitFailed && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t('sessionSaveFailed')}
                </div>
              )}
            </form>
          </div>

          {/* -------------------------------------------------------------
              STICKY BOTTOM ACTION FOOTER (TOUCH ERGONOMIC)
             ------------------------------------------------------------- */}
          <footer className="px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {draft?.id ? (
              <Button
                type="button"
                variant="danger"
                size="icon"
                disabled={isSubmitting}
                onClick={() => onDelete(draft.id!)}
                aria-label={t('delete')}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={onClose}
              >
                {t('cancel')}
              </Button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-h-[48px] px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>{t('savingSession')}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>{draft?.id ? t('save') : (isRTL ? 'حفظ وجدولة الجلسة' : 'Schedule Session')}</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

// Re-export aliases for backwards compatibility
export const SessionEditorModal = NewSessionDrawer;
export const NewSessionModal = NewSessionDrawer;
