import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameWeek, startOfMonth, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { WorkoutSession } from '../lib/api';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { gymAudio } from '../lib/audio';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';
import {
  buildPPLPlan,
  resolveWeekStartsOn,
  REST_DAY,
  toLocalDateTimeValue
} from '../components/routines/calendar/calendarData';
import { CalendarHeader, MonthLegend } from '../components/routines/calendar/CalendarHeader';
import type { CalendarMode } from '../components/routines/calendar/CalendarHeader';
import { MonthGrid } from '../components/routines/calendar/MonthGrid';
import type { DayLoad } from '../components/routines/calendar/MonthGrid';
import { WeekRibbon } from '../components/routines/calendar/WeekRibbon';
import { PlanListView } from '../components/routines/calendar/PlanListView';
import { DayDetailPanel } from '../components/routines/calendar/DayDetailPanel';
import type { DayTab } from '../components/routines/calendar/DayDetailPanel';
import { SessionEditorModal } from '../components/routines/calendar/SessionEditorModal';
import { ClearPlannedModal } from '../components/routines/calendar/ClearPlannedModal';
import type { ClearScope } from '../components/routines/calendar/ClearPlannedModal';
import { buildTemplateExercises, ensureCardioWarmup } from '../components/routines/calendar/templates';

const VALID_TABS: DayTab[] = ['all', 'planned', 'workouts', 'nutrition'];

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

export function CalendarView() {
  const { data, saveSession, saveSessions, deleteSession, deleteSessions, finishWorkoutSession } = useData();
  const { t, formatDate, tTitle, tMuscle, tExercise, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [mode, setMode] = useState<CalendarMode>('week');
  const [sessionDraft, setSessionDraft] = useState<Partial<WorkoutSession> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const tabParam = searchParams.get('tab');
  const [dayTab, setDayTab] = useState<DayTab>(
    VALID_TABS.includes(tabParam as DayTab) ? (tabParam as DayTab) : 'all'
  );

  useEffect(() => {
    if (VALID_TABS.includes(tabParam as DayTab)) setDayTab(tabParam as DayTab);
  }, [tabParam]);

  const today = useMemo(() => startOfToday(), []);
  const weekStartsOn = resolveWeekStartsOn(data?.settings?.weekStartsOn);

  const weekStart = useMemo(
    () => startOfWeek(anchor, { weekStartsOn }),
    [anchor, weekStartsOn]
  );
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(anchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn });
    const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn });
    const days: Date[] = [];
    for (let day = new Date(gridStart); day <= gridEnd; day = addDays(day, 1)) days.push(new Date(day));
    return days;
  }, [anchor, weekStartsOn]);

  const listDays = mode === 'month' ? monthDays : weekDays;

  const sessionIndex = useMemo(() => {
    const index = new Map<string, WorkoutSession[]>();
    for (const session of data?.sessions || []) {
      const key = format(new Date(session.date), 'yyyy-MM-dd');
      const bucket = index.get(key);
      if (bucket) bucket.push(session);
      else index.set(key, [session]);
    }
    return index;
  }, [data?.sessions]);

  const historyIndex = useMemo(() => {
    const index = new Map<string, number>();
    for (const record of data?.history || []) {
      const key = format(new Date(record.date), 'yyyy-MM-dd');
      index.set(key, (index.get(key) || 0) + 1);
    }
    return index;
  }, [data?.history]);

  const mealIndex = useMemo(() => {
    const index = new Map<string, number>();
    for (const meal of data?.meals || []) {
      const key = format(new Date(meal.date), 'yyyy-MM-dd');
      index.set(key, (index.get(key) || 0) + 1);
    }
    return index;
  }, [data?.meals]);

  const loadFor = useCallback(
    (day: Date): DayLoad => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        planned: sessionIndex.get(key)?.length || 0,
        completed: historyIndex.get(key) || 0,
        meals: mealIndex.get(key) || 0
      };
    },
    [historyIndex, mealIndex, sessionIndex]
  );

  const plannedSessions = useMemo(
    () => (data?.sessions || []).filter(session => !session.isCompleted),
    [data?.sessions]
  );

  const weekPlannedCount = useMemo(
    () => plannedSessions.filter(session => isSameWeek(new Date(session.date), anchor, { weekStartsOn })).length,
    [anchor, plannedSessions, weekStartsOn]
  );

  const dayPlannedCount = useMemo(
    () => plannedSessions.filter(session => isSameDay(new Date(session.date), selectedDay)).length,
    [plannedSessions, selectedDay]
  );

  const daySessions = useMemo(
    () => sessionIndex.get(format(selectedDay, 'yyyy-MM-dd')) || [],
    [selectedDay, sessionIndex]
  );
  const dayHistory = useMemo(
    () => (data?.history || []).filter(record => isSameDay(new Date(record.date), selectedDay)),
    [data?.history, selectedDay]
  );
  const dayMeals = useMemo(
    () => (data?.meals || []).filter(meal => isSameDay(new Date(meal.date), selectedDay)),
    [data?.meals, selectedDay]
  );

  const dayNutrition = useMemo(() => {
    const consumed = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const protein = dayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const carbs = dayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const fats = dayMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0);
    const dayKey = format(selectedDay, 'yyyy-MM-dd');
    return {
      consumed,
      protein,
      carbs,
      fats,
      water: data?.waterLogs?.[dayKey] || 0,
      burned: dayHistory.reduce((sum, record) => sum + (record.burnedCalories || 0), 0)
    };
  }, [data?.history, data?.waterLogs, dayHistory, dayMeals, selectedDay]);

  const duplicateIds = useMemo(() => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const sorted = [...(data?.sessions || [])].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
      return b.id.localeCompare(a.id);
    });
    for (const session of sorted) {
      const key = `${format(new Date(session.date), 'yyyy-MM-dd')}__${session.title.toLowerCase().trim()}`;
      if (seen.has(key)) duplicates.push(session.id);
      else seen.add(key);
    }
    return duplicates;
  }, [data?.sessions]);

  const pastIncompleteIds = useMemo(
    () =>
      (data?.sessions || [])
        .filter(session => {
          if (session.isCompleted) return false;
          const date = new Date(session.date);
          date.setHours(0, 0, 0, 0);
          return date < today;
        })
        .map(session => session.id),
    [data?.sessions, today]
  );

  const listGroups = useMemo(
    () => listDays.map(day => ({ day, sessions: sessionIndex.get(format(day, 'yyyy-MM-dd')) || [] })),
    [listDays, sessionIndex]
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      const delta = mode === 'month' ? direction : direction * 7;
      const next = addDays(anchor, delta);
      if (mode === 'month') {
        setAnchor(new Date(next.getFullYear(), next.getMonth() + (delta > 0 ? 1 : -1), 1));
        return;
      }
      setAnchor(next);
      setSelectedDay(next);
    },
    [anchor, mode]
  );

  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDay(new Date());
  }, []);

  const openEditor = useCallback((day?: Date) => {
    let target = day ? new Date(day) : new Date();
    if (target < today) target = new Date();
    if (target.getDay() === REST_DAY) target = addDays(target, 1);
    target.setHours(18, 0, 0, 0);
    setSessionDraft({
      title: '',
      type: 'Strength',
      date: toLocalDateTimeValue(target),
      duration: 60,
      notes: ''
    });
    setIsEditorOpen(true);
  }, [today]);

  const handleComplete = useCallback(
    async (session: WorkoutSession) => {
      gymAudio.triggerSubtleHaptic([30, 50]);
      await finishWorkoutSession({ ...session, isCompleted: true });
      setDayTab('workouts');
      notify(
        isRTL ? 'تم إنهاء التمرين ونقله إلى السجل فوراً!' : 'Workout finished and moved to history!',
        'success'
      );
    },
    [finishWorkoutSession, isRTL]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('deleteSessionConfirm'))) return;
      try {
        await deleteSession(id);
      } catch {
        notify(isRTL ? 'تعذر حذف الجلسة.' : 'Could not delete the session.', 'error');
      }
    },
    [deleteSession, isRTL, t]
  );

  const handleClear = useCallback(
    async (scope: ClearScope) => {
      const targets =
        scope === 'week'
          ? plannedSessions.filter(session => isSameWeek(new Date(session.date), anchor, { weekStartsOn }))
          : scope === 'day'
            ? plannedSessions.filter(session => isSameDay(new Date(session.date), selectedDay))
            : plannedSessions;
      if (targets.length === 0) {
        notify(isRTL ? 'لا توجد تمارين مجدولة للمسح' : 'No planned workouts to clear', 'info');
        setIsClearOpen(false);
        return;
      }
      try {
        setIsClearing(true);
        gymAudio.triggerVibration([30, 50, 30]);
        await deleteSessions(targets.map(session => session.id));
        setIsClearOpen(false);
        notify(isRTL ? `تم مسح ${targets.length} تمرين` : `Cleared ${targets.length} planned workouts`, 'success');
      } catch {
        notify(isRTL ? 'حدث خطأ أثناء المسح' : 'Failed to clear workouts', 'error');
      } finally {
        setIsClearing(false);
      }
    },
    [anchor, deleteSessions, isRTL, plannedSessions, selectedDay, weekStartsOn]
  );

  const handleSaveSession = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!sessionDraft) return;
      if (sessionDraft.date && new Date(sessionDraft.date).getDay() === REST_DAY) {
        notify(t('restDayAlert'), 'warning');
        return;
      }
      const next: WorkoutSession = {
        id: sessionDraft.id || Date.now().toString(),
        title: sessionDraft.title || '',
        date: sessionDraft.date || toLocalDateTimeValue(new Date()),
        duration: sessionDraft.duration || 60,
        type: sessionDraft.type || 'Strength',
        notes: sessionDraft.notes || '',
        isCompleted: sessionDraft.isCompleted || false,
        exercises: sessionDraft.exercises || []
      };
      await saveSession(next);
      setIsEditorOpen(false);
    },
    [saveSession, sessionDraft, t]
  );

  const applyTemplate = useCallback((name: string) => {
    const exercises = ensureCardioWarmup(buildTemplateExercises(name));
    setSessionDraft(prev => ({ ...prev, title: name, type: 'Strength', exercises }));
  }, []);

  const moveRestDaySessionsToSaturday = useCallback(async () => {
    const updated = daySessions.map(session => {
      const saturday = addDays(new Date(session.date), 1);
      saturday.setHours(18, 0, 0, 0);
      return { ...session, date: toLocalDateTimeValue(saturday) };
    });
    if (updated.length === 0) return;
    await saveSessions(updated);
    notify(isRTL ? 'تم نقل جميع الجلسات إلى السبت!' : 'All sessions moved to Saturday!', 'success');
  }, [daySessions, saveSessions]);

  const generatePPL = useCallback(async () => {
    const sessions = buildPPLPlan();
    if (sessions.length === 0) return;
    await saveSessions(sessions);
    notify(isRTL ? `تم إنشاء ${sessions.length} جلسة` : `Generated ${sessions.length} PPL sessions`, 'success');
  }, [saveSessions]);

  const repeatWorkout = useCallback((snapshot: WorkoutSession) => {
    let target = addDays(selectedDay, 1);
    if (target.getDay() === REST_DAY) target = addDays(target, 1);
    target.setHours(18, 0, 0, 0);
    setSessionDraft({
      title: snapshot.title,
      type: snapshot.type,
      duration: snapshot.duration || 60,
      date: toLocalDateTimeValue(target),
      notes: '',
      exercises: (snapshot.exercises || []).map((exercise, exIndex) => ({
        ...exercise,
        id: `ex-${Date.now()}-${exIndex}`,
        sets: (exercise.sets || []).map((set, setIndex) => ({
          ...set,
          id: `s-${Date.now()}-${exIndex}-${setIndex}`,
          repsActual: 0,
          isCompleted: false
        }))
      }))
    });
    setIsEditorOpen(true);
  }, [selectedDay]);

  const rangeLabel =
    mode === 'month'
      ? formatDate(anchor, 'MMMM yyyy')
      : `${formatDate(weekStart, 'd MMM')} – ${formatDate(weekDays[6], 'd MMM yyyy')}`;

  const periodLabel = isSameWeek(anchor, today, { weekStartsOn })
    ? isRTL
      ? 'الأسبوع الحالي'
      : 'Current week'
    : formatDate(anchor, mode === 'month' ? 'yyyy' : 'yyyy');

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="zen-page-container calendar-page"
    >
      <CalendarHeader
        isRTL={isRTL}
        title={t('weeklyCalendar')}
        rangeLabel={rangeLabel}
        periodLabel={periodLabel}
        isCurrentPeriod={isSameWeek(anchor, today, { weekStartsOn })}
        mode={mode}
        plannedCount={plannedSessions.length}
        t={t}
        onStep={step}
        onToday={goToday}
        onModeChange={setMode}
        onAddSession={() => openEditor(selectedDay)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onClearPlanned={() => {
          if (plannedSessions.length === 0) {
            notify(isRTL ? 'لا توجد تمارين مجدولة للمسح' : 'No planned workouts to clear', 'info');
            return;
          }
          setIsClearOpen(true);
        }}
      />

      {(duplicateIds.length > 0 || pastIncompleteIds.length > 0) && (
        <div className="zen-notice calendar-cleanup-notice">
          <span>
            {duplicateIds.length > 0 && `${duplicateIds.length} ${t('duplicateSessionsDetected')}`}
            {duplicateIds.length > 0 && pastIncompleteIds.length > 0 && ' · '}
            {pastIncompleteIds.length > 0 && `${pastIncompleteIds.length} ${t('pastIncompleteDetected')}`}
          </span>
          <span className="calendar-cleanup-actions">
            {duplicateIds.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (confirm(`${t('removeDuplicatesConfirm')} (${duplicateIds.length})`)) {
                    void deleteSessions(duplicateIds);
                  }
                }}
              >
                {t('cleanUpDuplicates')}
              </button>
            )}
            {pastIncompleteIds.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (confirm(`${t('cleanUpPastIncomplete')} (${pastIncompleteIds.length})?`)) {
                    void deleteSessions(pastIncompleteIds);
                  }
                }}
              >
                {t('cleanUpPastIncomplete')}
              </button>
            )}
          </span>
        </div>
      )}

      <WeekRibbon
        days={weekDays}
        selectedDay={selectedDay}
        today={today}
        isRTL={isRTL}
        loadFor={loadFor}
        formatDate={formatDate}
        onSelectDay={setSelectedDay}
      />

      {mode === 'month' && (
        <>
          <MonthLegend isRTL={isRTL} />
          <MonthGrid
            monthAnchor={anchor}
            weekStartsOn={weekStartsOn}
            selectedDay={selectedDay}
            today={today}
            isRTL={isRTL}
            loadFor={loadFor}
            formatDate={formatDate}
            onSelectDay={setSelectedDay}
          />
        </>
      )}

      {mode !== 'list' && (
        <DayDetailPanel
          day={selectedDay}
          today={today}
          tab={dayTab}
          sessions={daySessions}
          history={dayHistory}
          meals={dayMeals}
          nutrition={dayNutrition}
          targets={{
            calories: data.nutritionGoals?.dailyCalories || 2400,
            protein: data.nutritionGoals?.dailyProtein || 160,
            carbs: data.nutritionGoals?.dailyCarbs || 250,
            fats: data.nutritionGoals?.dailyFats || 70,
            water: data.nutritionGoals?.dailyWaterMl || 3000
          }}
          isRTL={isRTL}
          isClearing={isClearing}
          t={t}
          tTitle={tTitle}
          tExercise={tExercise}
          tMuscle={tMuscle}
          formatDate={formatDate}
          onTabChange={setDayTab}
          onOpenSession={id => navigate(`/session/${id}`)}
          onComplete={session => void handleComplete(session)}
          onDelete={id => void handleDelete(id)}
          onAddSession={openEditor}
          onOpenAI={() => setIsAIModalOpen(true)}
          onGeneratePPL={() => void generatePPL()}
          onMoveToSaturday={() => void moveRestDaySessionsToSaturday()}
          onClearDay={() => {
            if (dayPlannedCount > 0) {
              setDayTab('planned');
              setIsClearOpen(true);
            }
          }}
          onRepeatWorkout={repeatWorkout}
          onLogMeal={() => navigate('/nutrition')}
        />
      )}

      {mode === 'list' && (
        <PlanListView
          isRTL={isRTL}
          today={today}
          groups={listGroups}
          formatDate={formatDate}
          tTitle={tTitle}
          tMuscle={tMuscle}
          t={t}
          onOpenSession={id => navigate(`/session/${id}`)}
          onComplete={session => void handleComplete(session)}
          onDelete={id => void handleDelete(id)}
          onAddSession={openEditor}
        />
      )}

      <SessionEditorModal
        isOpen={isEditorOpen}
        draft={sessionDraft}
        isRTL={isRTL}
        t={t}
        tTitle={tTitle}
        tMuscle={tMuscle}
        formatDate={formatDate}
        onPatch={patch => setSessionDraft(prev => ({ ...prev, ...patch }))}
        onApplyTemplate={applyTemplate}
        onSubmit={handleSaveSession}
        onDelete={id => void handleDelete(id)}
        onClose={() => setIsEditorOpen(false)}
      />

      <ClearPlannedModal
        isOpen={isClearOpen}
        isClearing={isClearing}
        counts={{ week: weekPlannedCount, day: dayPlannedCount, all: plannedSessions.length }}
        isRTL={isRTL}
        t={t}
        formatDate={formatDate}
        rangeLabel={rangeLabel}
        day={selectedDay}
        dayLabel={formatDate(selectedDay, 'EEEE')}
        onClear={scope => void handleClear(scope)}
        onClose={() => setIsClearOpen(false)}
      />

      <AIWorkoutGeneratorModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </motion.div>
  );
}
