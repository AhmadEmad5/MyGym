import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Routine, SessionExercise, WorkoutSession } from '../lib/api';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';
import { InteractiveMuscleMapModal } from '../components/InteractiveMuscleMapModal';
import type { PredefinedRoutine } from '../components/ProgramDeck3DCard';
import {
  buildProgramSessions,
  findReplaceableSessionIds,
  ProgramDetail,
  ProgramList,
  RoutineFilterBar,
  ScheduleRoutineModal,
  SplitQuickBuilder,
  toProgramDraft
} from '../components/routines';
import { EMPTY_ROUTINE_FILTERS } from '../components/routines/RoutineFilterBar';
import type { ProgramDraft, QuickSplit, RoutineFilters } from '../components/routines';
import { createEntityId } from '../components/routines/types';
import { PREDEFINED_ROUTINES, PREDEFINED_ROUTINE_CATEGORIES } from '../components/routines/data';

const CUSTOM_CATEGORY = 'Custom Program';

function routineToProgramDraft(routine: Routine): PredefinedRoutine {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    category: CUSTOM_CATEGORY,
    daysRequired: 1,
    difficulty: 'Intermediate',
    difficultyScore: 3,
    estTime: '45 - 60 min',
    primaryMuscles: [],
    accentColor: '#38bdf8',
    badge: 'MY PROGRAM',
    sessions: [
      {
        title: routine.name,
        type: 'Strength',
        exercises: (routine.exercises || []).map(exercise => ({
          ...exercise,
          sets: (exercise.sets || []).map(set => ({ ...set }))
        }))
      }
    ]
  };
}

function programDraftToRoutine(draft: ProgramDraft, existing?: Routine): Routine {
  const firstSession = draft.sessions[0];
  return {
    id: existing?.id || draft.id || createEntityId('routine'),
    name: draft.name || existing?.name || CUSTOM_CATEGORY,
    description: draft.description,
    exercises: (firstSession?.exercises || []).map(exercise => ({
      ...exercise,
      sets: (exercise.sets || []).map(set => ({ ...set }))
    }))
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9؀-ۿ]+/)
    .filter(Boolean);
}

function matchesFilters(program: PredefinedRoutine, filters: RoutineFilters) {
  if (filters.category !== 'all' && program.category !== filters.category) return false;
  if (filters.difficulty !== 'all' && (program.difficulty ?? 'Beginner') !== filters.difficulty) return false;
  if (filters.days !== 'all' && program.daysRequired !== filters.days) return false;
  const query = filters.query.trim();
  if (!query) return true;
  const haystack = [
    program.name,
    program.category,
    program.description,
    ...(program.primaryMuscles || []),
    ...program.sessions.flatMap(session =>
      session.exercises.map(exercise => `${exercise.name} ${exercise.targetMuscle}`)
    )
  ]
    .join(' ')
    .toLowerCase();
  return tokenize(query).every(token => haystack.includes(token));
}

export function RoutinesView() {
  const { data, saveSessions, deleteSessions, saveRoutine, deleteRoutine } = useData();
  const { t, isRTL, tTitle, tExercise, tMuscle } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<RoutineFilters>(EMPTY_ROUTINE_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ProgramDraft | null>(null);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isMuscleMapOpen, setIsMuscleMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [draftProgram, setDraftProgram] = useState<PredefinedRoutine | null>(null);

  const weightUnit = data?.settings?.weightUnit === 'lb' ? 'lb' : 'kg';

  const customPrograms = useMemo<PredefinedRoutine[]>(
    () => (data?.routines || []).map(routineToProgramDraft),
    [data?.routines]
  );

  const allPrograms = useMemo<PredefinedRoutine[]>(
    () => [...customPrograms, ...PREDEFINED_ROUTINES],
    [customPrograms]
  );

  const { visibleCustom, visibleTemplates, resultCount } = useMemo(() => {
    const custom: PredefinedRoutine[] = [];
    const templates: PredefinedRoutine[] = [];
    for (const program of allPrograms) {
      if (!matchesFilters(program, filters)) continue;
      if (customPrograms.some(item => item.id === program.id)) custom.push(program);
      else templates.push(program);
    }
    return { visibleCustom: custom, visibleTemplates: templates, resultCount: custom.length + templates.length };
  }, [allPrograms, customPrograms, filters]);

  const detailProgram = useMemo<ProgramDraft | null>(() => {
    if (draftProgram) return toProgramDraft(draftProgram, true);
    if (!selectedId) return null;
    const found = allPrograms.find(program => program.id === selectedId);
    if (!found) return null;
    return toProgramDraft(found, customPrograms.some(item => item.id === found.id));
  }, [allPrograms, customPrograms, draftProgram, selectedId]);

  const openScheduling = useCallback((program: ProgramDraft, preselectedDays: number[] = []) => {
    setScheduleTarget(program);
    setScheduleDays(preselectedDays);
    setIsScheduleOpen(true);
  }, []);

  const handleQuickApplySplit = useCallback(
    (split: QuickSplit) => {
      const routine = PREDEFINED_ROUTINES.find(item => item.id === split.id);
      if (!routine) return;
      openScheduling(toProgramDraft(routine), split.days);
      notify(
        isRTL
          ? `تم تجهيز ${tTitle(routine.name)} بجدول الأيام المقترح! اضغط تأكيد للبدء.`
          : `Ready to schedule ${routine.name} with optimal rest days pre-selected!`,
        'success'
      );
    },
    [isRTL, openScheduling, tTitle]
  );

  const handleApply = useCallback(
    (routine: PredefinedRoutine) => {
      const isCustom = customPrograms.some(item => item.id === routine.id);
      openScheduling(toProgramDraft(routine, isCustom));
    },
    [customPrograms, openScheduling]
  );

  const handleEdit = useCallback((routine: PredefinedRoutine) => {
    setDraftProgram(null);
    setLastSavedAt(null);
    setSelectedId(routine.id);
  }, []);

  const handleCreateBlank = useCallback(() => {
    setSelectedId(null);
    setLastSavedAt(null);
    setDraftProgram({
      id: createEntityId('program'),
      name: isRTL ? 'برنامج جديد' : 'New program',
      category: CUSTOM_CATEGORY,
      description: isRTL ? 'برنامج تدريبي مخصص.' : 'A custom training program.',
      daysRequired: 1,
      difficulty: 'Beginner',
      difficultyScore: 1,
      estTime: '45 min',
      primaryMuscles: [],
      accentColor: '#38bdf8',
      badge: 'DRAFT',
      sessions: [
        {
          title: isRTL ? 'اليوم 1' : 'Day 1',
          type: 'Strength',
          exercises: [
            {
              id: createEntityId('ex'),
              name: '',
              targetMuscle: 'Chest',
              restTime: 90,
              notes: '',
              sets: [
                {
                  id: createEntityId('set'),
                  weight: 0,
                  repsTarget: 8,
                  repsActual: 0,
                  unit: weightUnit,
                  isCompleted: false
                }
              ]
            }
          ]
        }
      ]
    });
  }, [isRTL, weightUnit]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDraftProgram(null);
    setLastSavedAt(null);
  }, []);

  const handleSaveProgram = useCallback(
    async (program: ProgramDraft) => {
      setIsSaving(true);
      try {
        const existing = (data?.routines || []).find(item => item.id === program.id);
        await saveRoutine(programDraftToRoutine(program, existing));
        setLastSavedAt(Date.now());
        if (!existing) {
          setSelectedId(program.id);
          setDraftProgram(null);
        }
        notify(isRTL ? 'تم حفظ البرنامج في مكتبتك.' : 'Program saved to your library.', 'success');
      } finally {
        setIsSaving(false);
      }
    },
    [data?.routines, isRTL, saveRoutine]
  );

  const handleDeleteProgram = useCallback(
    async (routine: PredefinedRoutine) => {
      if (!customPrograms.some(item => item.id === routine.id)) return;
      try {
        await deleteRoutine(routine.id);
        if (selectedId === routine.id) setSelectedId(null);
        notify(isRTL ? 'تم حذف البرنامج.' : 'Program deleted.', 'success');
      } catch {
        notify(isRTL ? 'تعذر حذف البرنامج.' : 'Could not delete the program.', 'error');
      }
    },
    [customPrograms, deleteRoutine, isRTL, selectedId]
  );

  const handleConfirmSchedule = useCallback(
    async (days: number[], repeatWeeks: number, replaceExisting: boolean, selectedStart: 'thisWeek' | 'nextWeek') => {
      if (!scheduleTarget) return;
      try {
        const sessions = buildProgramSessions({
          program: scheduleTarget,
          days,
          repeatWeeks,
          scheduleStart: selectedStart
        });
        if (replaceExisting && data) {
          const stale = findReplaceableSessionIds(data.sessions, sessions);
          if (stale.length > 0) await deleteSessions(stale);
        }
        await saveSessions(sessions);
        notify(
          isRTL ? `تمت جدولة ${sessions.length} جلسة بنجاح.` : `Scheduled ${sessions.length} sessions successfully.`,
          'success'
        );
        setIsScheduleOpen(false);
        navigate('/plan');
      } catch (error) {
        console.error('Failed to schedule routine:', error);
        notify(t('scheduleRoutineError'), 'error');
        throw error;
      }
    },
    [data, deleteSessions, navigate, saveSessions, scheduleTarget, t]
  );

  const handleStartSession = useCallback(
    async (source: { title: string; type: string; exercises: SessionExercise[] }) => {
      if (!source.exercises || source.exercises.length === 0) {
        notify(isRTL ? 'أضف تمريناً واحداً على الأقل قبل البدء.' : 'Add at least one exercise before starting.', 'warning');
        return;
      }
      const now = new Date();
      now.setSeconds(0, 0);
      const id = createEntityId('session');
      const session: WorkoutSession = {
        id,
        title: source.title,
        date: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        duration: 60,
        type: source.type || 'Strength',
        notes: '',
        isCompleted: false,
        exercises: source.exercises.map((exercise, exIdx) => ({
          ...exercise,
          id: `${id}-ex${exIdx}`,
          sets: (exercise.sets || []).map((set, setIdx) => ({
            ...set,
            id: `${id}-ex${exIdx}-s${setIdx}`,
            repsActual: 0,
            isCompleted: false
          }))
        }))
      };
      await saveSessions([session]);
      navigate(`/session/${id}`);
    },
    [isRTL, navigate, saveSessions]
  );

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="zen-page-container routines-page"
    >
      <div className="zen-header">
        <div>
          <div className="routines-title-row">
            <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <h1 style={{ margin: 0 }}>{t('routinesLibrary')}</h1>
          </div>
          <p className="routines-hero-desc">{t('routinesHeroDesc')}</p>
        </div>
        <div className="routines-header-actions">
          <button
            type="button"
            onClick={() => setIsMuscleMapOpen(true)}
            className="zen-pill-btn routines-muscle-map-btn"
          >
            <Activity size={17} aria-hidden="true" />
            <span>{t('muscleMapTitle')}</span>
          </button>
          <button type="button" onClick={() => setIsAIModalOpen(true)} className="btn-primary routines-ai-btn">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t('generateWithAI')}</span>
          </button>
        </div>
      </div>

      {detailProgram ? (
        <ProgramDetail
          program={detailProgram}
          weightUnit={weightUnit}
          isRTL={isRTL}
          tExercise={tExercise}
          tTitle={tTitle}
          tMuscle={tMuscle}
          onBack={closeDetail}
          onSchedule={program => openScheduling(program)}
          onSave={handleSaveProgram}
          onStartSession={handleStartSession}
          saving={isSaving}
          lastSavedAt={lastSavedAt}
        />
      ) : (
        <>
          <SplitQuickBuilder isRTL={isRTL} onApplySplit={handleQuickApplySplit} />

          <RoutineFilterBar
            filters={filters}
            onChange={setFilters}
            categories={PREDEFINED_ROUTINE_CATEGORIES}
            resultCount={resultCount}
            totalCount={allPrograms.length}
            isRTL={isRTL}
          />

          <ProgramList
            customPrograms={visibleCustom}
            templatePrograms={visibleTemplates}
            isFiltered={resultCount !== allPrograms.length}
            isRTL={isRTL}
            t={t}
            tTitle={tTitle}
            onApply={handleApply}
            onEdit={handleEdit}
            onDelete={program => void handleDeleteProgram(program)}
            onCreateBlank={handleCreateBlank}
            onOpenAI={() => setIsAIModalOpen(true)}
            onResetFilters={() => setFilters(EMPTY_ROUTINE_FILTERS)}
          />
        </>
      )}

      <ScheduleRoutineModal
        isOpen={isScheduleOpen}
        program={scheduleTarget}
        programTitle={scheduleTarget ? tTitle(scheduleTarget.name) : ''}
        initialDays={scheduleDays}
        isRTL={isRTL}
        t={t}
        onClose={() => setIsScheduleOpen(false)}
        onConfirm={handleConfirmSchedule}
        onNotify={notify}
      />

      <AIWorkoutGeneratorModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <InteractiveMuscleMapModal isOpen={isMuscleMapOpen} onClose={() => setIsMuscleMapOpen(false)} />
    </motion.div>
  );
}
