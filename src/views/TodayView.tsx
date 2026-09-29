import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  Flame,
  History,
  Lightbulb,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { computeMuscleRecovery } from '../lib/recovery';
import { deriveSessionStatus, selectDailySummary, selectWorkoutStreak } from '../lib/selectors';
import { formatDuration } from '../lib/formatters';
import { notify } from '../lib/feedback';
import type { WorkoutSession } from '../lib/api';
import { PageFrame } from '../components/layout/PageFrame';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { MetricPair } from '../components/primitives/MetricPair';
import { QuickWorkoutModal } from '../components/QuickWorkoutModal';
import { DailyNutritionTargetsCard } from '../components/DailyNutritionTargetsCard';
import { TodayBentoGrid, WidgetSkeleton, useFormaReducedMotion } from '../components/TodayBentoGrid';
import { RecoveryCard } from '../components/RecoveryCard';
import { MuscleRecoveryHeatmapWidget } from '../components/MuscleRecoveryHeatmapWidget';
import { InteractiveHydrationWaveCard } from '../components/InteractiveHydrationWaveCard';
import { MobileHeroWorkoutCard } from '../components/mobile/MobileHeroWorkoutCard';
import { MobileFloorVitals } from '../components/mobile/MobileFloorVitals';

const MAX_VISIBLE_EXERCISES = 4;

export function TodayView() {
  const { data, loading, finishWorkoutSession, saveSession, logWater, resetWater, forceRefresh } = useData();
  const { formatDate, tExercise, tTitle, t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useFormaReducedMotion();
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const locale = isRTL ? 'ar' : 'en-US';
  const today = useMemo(() => new Date(), []);
  const todayKey = format(today, 'yyyy-MM-dd');
  const isFriday = today.getDay() === 5;

  const daily = useMemo(
    () => (data ? selectDailySummary(data, today) : null),
    [data, todayKey],
  );

  const todaySessions = useMemo(
    () => (daily ? daily.sessions.filter((session) => !session.isCompleted) : []),
    [daily],
  );
  const todayHistory = daily ? daily.history : [];
  const activeSession = todaySessions[0] || null;
  const isDayCompleted = todaySessions.length === 0 && todayHistory.length > 0;

  const heroSession = useMemo(() => {
    if (activeSession) return activeSession;
    if (todayHistory[0]?.snapshot) return todayHistory[0].snapshot;
    if (data?.sessions && data.sessions.length > 0) return data.sessions[0];
    return null;
  }, [activeSession, todayHistory, data?.sessions]);

  const todayBurnedCalories = useMemo(
    () => todayHistory.reduce((total, record) => total + (record.burnedCalories || 0), 0),
    [todayHistory],
  );

  const completedTrainingRecords = useMemo(
    () =>
      (data?.history || []).filter((record) => record.snapshot?.exercises?.some((exercise) => Boolean(exercise.targetMuscle))).length +
      (data?.sessions || []).filter((session) => session.isCompleted && session.exercises?.some((exercise) => Boolean(exercise.targetMuscle))).length,
    [data?.history, data?.sessions],
  );

  const recoveryOverview = useMemo(
    () => computeMuscleRecovery(data?.history || [], data?.sessions || []),
    [data?.history, data?.sessions],
  );

  const { todayCalories, todayProtein, todayCarbs, todayFats } = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    for (const meal of daily?.meals || []) {
      calories += meal.calories || 0;
      protein += meal.protein || 0;
      carbs += meal.carbs || 0;
      fats += meal.fats || 0;
    }
    return { todayCalories: calories, todayProtein: protein, todayCarbs: carbs, todayFats: fats };
  }, [daily]);

  const streakDays = useMemo(() => (data ? selectWorkoutStreak(data) : 0), [data]);
  const plannedMinutes = useMemo(
    () => todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0),
    [todaySessions],
  );

  const openQuickWorkout = useCallback(() => {
    if (isFriday) {
      notify(
        isRTL ? 'الجيم مغلق اليوم الجمعة — استمتع بالراحة التامة والاستشفاء.' : 'The gym is closed on Friday — enjoy full recovery and rest.',
        'warning',
      );
      return;
    }
    setPanelError(null);
    setIsQuickWorkoutOpen(true);
  }, [isFriday, isRTL]);

  const handleQuickWater = useCallback(
    async (amount: number) => {
      try {
        setPanelError(null);
        setHydrationError(null);
        await logWater(amount, todayKey);
        gymAudio.triggerVibration([15]);
      } catch {
        const message = isRTL ? 'تعذّر تسجيل الماء. حاول مرة أخرى.' : 'Could not log water. Try again.';
        setHydrationError(message);
        setPanelError(message);
      }
    },
    [isRTL, logWater, todayKey],
  );

  const handleResetWater = useCallback(async () => {
    try {
      setPanelError(null);
      setHydrationError(null);
      await resetWater(todayKey);
      gymAudio.triggerVibration([10]);
    } catch {
      const message = isRTL ? 'تعذّر تصفير عداد الماء.' : 'Could not reset the hydration log.';
      setHydrationError(message);
      setPanelError(message);
    }
  }, [isRTL, resetWater, todayKey]);

  const handleCompleteSession = useCallback(
    async (session: WorkoutSession) => {
      if (isFinishing) return;
      setIsFinishing(true);
      setPanelError(null);
      setDashboardError(null);
      try {
        gymAudio.triggerSubtleHaptic([30, 50]);
        await finishWorkoutSession({ ...session, isCompleted: true });
        notify(isRTL ? 'تم إنهاء التمرين وحفظه في السجل بنجاح!' : 'Workout finished and logged to history!', 'success');
      } catch {
        const message = isRTL ? 'تعذّر حفظ التمرين. لم تتغيّر بياناتك.' : 'Could not save the workout. Your data is unchanged.';
        setDashboardError(message);
        setPanelError(message);
      } finally {
        setIsFinishing(false);
      }
    },
    [finishWorkoutSession, isFinishing, isRTL],
  );

  const handleMoveToSaturday = useCallback(
    async (session: WorkoutSession) => {
      const saturday = addDays(new Date(session.date), 1);
      saturday.setHours(18, 0, 0, 0);
      const dateStr = new Date(saturday.getTime() - saturday.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      try {
        setPanelError(null);
        setDashboardError(null);
        await saveSession({ ...session, date: dateStr });
        notify(isRTL ? 'تم نقل الجلسة إلى يوم السبت بنجاح!' : 'Session rescheduled to Saturday successfully!', 'success');
      } catch {
        const message = isRTL ? 'تعذّر نقل الجلسة. حاول مرة أخرى.' : 'Could not reschedule the session.';
        setDashboardError(message);
        setPanelError(message);
      }
    },
    [isRTL, saveSession],
  );

  const handleQuickWorkout = useCallback(
    async (session: Partial<WorkoutSession>) => {
      const full = session as WorkoutSession;
      setIsQuickWorkoutOpen(false);
      await saveSession(full);
      navigate(`/session/${full.id}`);
    },
    [navigate, saveSession],
  );

  useEffect(() => {
    const shortcut = new URLSearchParams(window.location.search).get('shortcut');
    if (!shortcut) return;
    window.history.replaceState({}, document.title, window.location.pathname);
    if (shortcut === 'start-workout') {
      if (isFriday) {
        notify(isRTL ? 'الجيم مغلق اليوم الجمعة — استمتع بالراحة التامة والاستشفاء.' : 'The gym is closed on Friday — enjoy full recovery and rest.', 'warning');
      } else if (activeSession) {
        navigate(`/session/${activeSession.id}`);
      } else {
        setIsQuickWorkoutOpen(true);
      }
    }
    if (shortcut === 'water-500') void handleQuickWater(500);
    if (shortcut === 'scan-meal') navigate('/nutrition?action=scan-meal');
  }, [activeSession, handleQuickWater, isFriday, isRTL, navigate]);

  if (!data || !daily) {
    return (
      <PageFrame
        routeId="today"
        title={isRTL ? 'الخطوة التالية' : 'The next move'}
        eyebrow={formatDate(today, 'EEEE · MMMM d')}
        subtitle={isRTL ? 'جارٍ تجهيز لوحة اليوم…' : 'Preparing your dashboard…'}
      >
        <div className="today-dashboard-stack" aria-busy="true">
          <div className="forma-widget" style={{ minHeight: '16rem' }}>
            <div className="forma-widget-header">
              <h2 className="forma-widget-title">
                <span className="forma-widget-icon" style={{ color: 'var(--accent-cyan)' }}>
                  <Dumbbell size={15} aria-hidden="true" />
                </span>
                <span>{isRTL ? 'تمرين اليوم' : "Today's workout"}</span>
              </h2>
            </div>
            <div className="forma-widget-body">
              <WidgetSkeleton rows={4} label={isRTL ? 'جارٍ تحميل بيانات اليوم' : 'Loading today'} />
            </div>
          </div>
          <div className="forma-bento-grid">
            {[0, 1, 2].map((index) => (
              <div className="forma-bento-card" data-tier="tertiary" key={index}>
                <div className="forma-bento-card-body">
                  <WidgetSkeleton rows={3} label={isRTL ? 'جارٍ تحميل البطاقات' : 'Loading cards'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageFrame>
    );
  }

  const statusLabel = activeSession
    ? isRTL ? 'مخطط اليوم' : 'Planned today'
    : isDayCompleted
      ? isRTL ? 'مكتمل' : 'Complete'
      : isFriday
        ? isRTL ? 'عطلة أسبوعية' : 'Off-Day (Gym Closed)'
        : isRTL ? 'لا توجد جلسة' : 'No session';

  const statusTone = activeSession ? 'is-active' : isDayCompleted ? 'is-complete' : 'is-muted';

  const commandHeading = activeSession
    ? tTitle(activeSession.title)
    : isDayCompleted
      ? todayHistory[0] ? tTitle(todayHistory[0].title) : isRTL ? 'تمرين مكتمل' : 'Workout complete'
      : isFriday
        ? isRTL ? 'يوم راحة أسبوعي' : 'Weekly recovery day'
        : isRTL ? 'لا يوجد تمرين مخطط' : 'Nothing scheduled yet';

  return (
    <PageFrame
      routeId="today"
      title={isRTL ? 'الخطوة التالية' : 'The next move'}
      subtitle={isRTL ? 'سجّل ما يحتاجه تمرينك الآن، واترك التحليلات للتقرير.' : 'Log what your training needs now. Keep the analysis in the report.'}
      eyebrow={formatDate(today, 'EEEE · MMMM d')}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/plan')}
            leftIcon={<CalendarDays width={15} height={15} />}
          >
            {isRTL ? 'الخطة الأسبوعية' : 'Weekly plan'}
          </Button>
          <Button
            variant="cyan"
            size="sm"
            onClick={openQuickWorkout}
            leftIcon={<Zap width={15} height={15} />}
            disabled={isFriday}
            title={isFriday ? (isRTL ? 'الجيم مغلق اليوم (عطلة أسبوعية)' : 'Gym is closed today (Weekly off-day)') : undefined}
          >
            {isFriday ? (isRTL ? 'الجيم مغلق' : 'Gym closed') : isRTL ? 'تمرين سريع' : 'Quick workout'}
          </Button>
        </>
      }
    >
      {panelError && (
        <div className="today-inline-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{panelError}</span>
          <button type="button" className="forma-quiet-button" onClick={() => setPanelError(null)}>
            {isRTL ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}

      <a className="forma-skip-link" href="#today-command">
        {isRTL ? 'تخطَّ إلى التمرين' : 'Skip to workout'}
      </a>

      <div className="today-dashboard-stack">
        <div className="today-mobile-hero-stack">
          <div className="mobile-athlete-header">
            <div>
              <div className="mobile-greeting-label">{isRTL ? 'مرحباً بعودتك،' : 'Welcome back,'}</div>
              <div className="mobile-athlete-name">{data.user?.name || (isRTL ? 'البطل' : 'Athlete')}</div>
            </div>
            <div
              className="mobile-streak-ring"
              title={isRTL ? 'السلسلة الحالية' : 'Current streak'}
              aria-describedby="today-streak-hint"
            >
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" aria-hidden="true" />
              <span className="mobile-streak-text tabular-nums">{Math.max(1, streakDays)}d</span>
              <span className="forma-sr-only">
                {isRTL ? `${streakDays} يوم متتالي` : `${streakDays} day streak`}
              </span>
            </div>
          </div>
          <p id="today-streak-hint" className="ui-empty-description" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', margin: '0.35rem 0 0', fontSize: '0.74rem' }}>
            <Lightbulb size={13} aria-hidden="true" style={{ color: 'var(--color-warning)', flexShrink: 0, marginBlockStart: '0.15rem' }} />
            <span>{t('todayStreakHint')}</span>
          </p>

          <MobileHeroWorkoutCard
            session={heroSession}
            isCompletedToday={isDayCompleted}
            onQuickWorkout={openQuickWorkout}
          />
          <MobileFloorVitals
            waterAmount={daily.waterMl}
            waterGoal={daily.waterTargetMl}
            onQuickWater={handleQuickWater}
            calories={todayCalories}
            calorieGoal={daily.nutritionGoals.dailyCalories}
            protein={todayProtein}
            proteinGoal={daily.nutritionGoals.dailyProtein}
            onOpenNutrition={() => navigate('/nutrition')}
            isBusy={isFinishing}
            errorMessage={hydrationError || undefined}
          />
        </div>

        <section className="today-tier today-tier-training" aria-labelledby="today-command-title">
          <h2 className="forma-sr-only" id="today-command-title">
            {isRTL ? 'إجراء اليوم' : 'Today’s action'}
          </h2>

          <div className="today-command-grid" id="today-command">
            <div className="today-active-column">
              <div className={`today-active-surface ${isDayCompleted ? 'is-complete' : ''}`.trim()}>
                <div className="today-surface-topline">
                  <span className={`forma-status-label ${statusTone}`}>{statusLabel}</span>
                  <span className="today-surface-date tabular-nums">{format(today, 'dd.MM')}</span>
                </div>

                {activeSession ? (
                  <>
                    {isFriday && (
                      <div className="today-friday-notice">
                        <span className="today-friday-notice-copy">
                          <Moon size={15} aria-hidden="true" />
                          {isRTL
                            ? 'الجيم مغلق اليوم الجمعة — يُنصح بنقل هذه الجلسة إلى الغد (السبت).'
                            : 'Gym is closed today (Friday) — we recommend moving this session to Saturday.'}
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => void handleMoveToSaturday(activeSession)}>
                          {isRTL ? 'نقل للسبت' : 'Move to Saturday'}
                        </Button>
                      </div>
                    )}

                    <div className="today-active-heading">
                      <div>
                        <h3>{commandHeading}</h3>
                        <p>
                          {activeSession.type} · {formatDuration(activeSession.duration, locale)}
                        </p>
                      </div>
                      <div className="today-active-index" aria-label={isRTL ? 'عدد التمارين' : 'Exercise count'}>
                        <strong className="tabular-nums">{activeSession.exercises?.length || 0}</strong>
                        <span>{isRTL ? 'تمارين' : 'exercises'}</span>
                      </div>
                    </div>

                    <div className="today-exercise-list">
                      {(activeSession.exercises || []).slice(0, MAX_VISIBLE_EXERCISES).map((exercise, index) => (
                        <div className="today-exercise-row" key={exercise.id || `${exercise.name}-${index}`}>
                          <span className="today-exercise-number tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                          <span className="today-exercise-name">{tExercise(exercise.name)}</span>
                          <span className="today-exercise-meta tabular-nums">
                            {exercise.sets?.length || 0} {isRTL ? 'جولات' : 'sets'}
                          </span>
                        </div>
                      ))}
                      {(activeSession.exercises?.length || 0) > MAX_VISIBLE_EXERCISES && (
                        <span className="today-more-exercises">
                          +{(activeSession.exercises?.length || 0) - MAX_VISIBLE_EXERCISES} {isRTL ? 'تمارين أخرى' : 'more exercises'}
                        </span>
                      )}
                    </div>

                    <div className="today-primary-row">
                      <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<Play width={16} height={16} fill="currentColor" />}
                        disabled={isFriday}
                        onClick={() => navigate(`/session/${activeSession.id}`)}
                      >
                        {isRTL ? 'ابدأ التمرين' : 'Start workout'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        isLoading={isFinishing}
                        leftIcon={<Check width={16} height={16} />}
                        onClick={() => void handleCompleteSession(activeSession)}
                      >
                        {isRTL ? 'تم' : 'Mark complete'}
                      </Button>
                    </div>
                  </>
                ) : isDayCompleted ? (
                  <div className="today-celebration">
                    <div className="today-surface-topline">
                      <div className="today-celebration-heading">
                        <span className="today-celebration-icon" aria-hidden="true">
                          <Trophy size={20} />
                        </span>
                        <span className="today-celebration-kicker">
                          {isRTL ? 'إنجاز تدريب اليوم' : "Today’s session is done"}
                        </span>
                      </div>
                      <span className="forma-badge" style={{ color: 'var(--color-success)', background: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.34)' }}>
                        <CheckCircle2 size={13} aria-hidden="true" />
                        {isRTL ? 'محفوظ في السجل' : 'Logged to history'}
                      </span>
                    </div>

                    <h3 className="today-celebration-title">{commandHeading}</h3>

                    <dl className="today-celebration-grid">
                      <div className="today-celebration-cell">
                        <dt>{isRTL ? 'السعرات المحروقة' : 'Burned'}</dt>
                        <dd style={{ color: 'var(--color-warning)' }}>
                          <Flame size={14} aria-hidden="true" />
                          <span className="tabular-nums">~{todayBurnedCalories} kcal</span>
                        </dd>
                      </div>
                      <div className="today-celebration-cell">
                        <dt>{isRTL ? 'التمارين المنجزة' : 'Exercises'}</dt>
                        <dd style={{ color: 'var(--accent-cyan)' }}>
                          <Dumbbell size={14} aria-hidden="true" />
                          <span className="tabular-nums">{todayHistory[0]?.snapshot?.exercises?.length || 0}</span>
                        </dd>
                      </div>
                      <div className="today-celebration-cell">
                        <dt>{isRTL ? 'الحالة' : 'Status'}</dt>
                        <dd style={{ color: 'var(--color-success)' }}>{isRTL ? 'مكتمل' : '100% done'}</dd>
                      </div>
                    </dl>

                    <div className="today-primary-row">
                      <Button variant="primary" size="md" leftIcon={<History width={16} height={16} />} onClick={() => navigate('/plan?tab=workouts')}>
                        {isRTL ? 'عرض في السجل' : 'View in history'}
                      </Button>
                      <Button variant="secondary" size="md" leftIcon={<Plus width={16} height={16} />} onClick={openQuickWorkout}>
                        {isRTL ? 'تمرين إضافي' : 'Log extra workout'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    className="today-empty-state"
                    icon={isFriday ? <Moon size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
                    title={
                      isFriday
                        ? isRTL ? 'الجمعة — عطلة أسبوعية' : 'Friday — weekly off-day'
                        : isRTL ? 'لا يوجد تمرين مخطط اليوم' : 'No workout planned today'
                    }
                    description={
                      isFriday
                        ? isRTL
                          ? 'الجيم مغلق دائماً كل يوم جمعة. استغل اليوم للراحة التامة، تغذية العضلات، وإعادة شحن طاقتك.'
                          : 'The gym is closed every Friday. Use it for full rest, proper nutrition, and recovery for the week ahead.'
                        : isRTL
                          ? 'اختر روتيناً أو أضف جلسة عندما تكون مستعداً.'
                          : 'Pick a routine or schedule a session when you are ready to train.'
                    }
                    action={
                      <Button variant="primary" size="md" leftIcon={<Dumbbell width={16} height={16} />} onClick={() => navigate(isFriday ? '/plan' : '/routines')}>
                        {isFriday ? (isRTL ? 'عرض جدول الأسبوع' : 'View weekly schedule') : isRTL ? 'اختر روتيناً' : 'Choose a routine'}
                      </Button>
                    }
                    secondaryAction={
                      <Button variant="secondary" size="md" leftIcon={<CalendarDays width={16} height={16} />} onClick={() => navigate('/plan')}>
                        {isRTL ? 'استكشاف الجداول' : 'Browse schedule'}
                      </Button>
                    }
                  />
                )}
              </div>
            </div>

            <aside className="today-sessions-sidebar" aria-label={isRTL ? 'مسار الجلسات' : 'Sessions timeline'}>
              <div>
                <div className="forma-section-heading today-queue-heading">
                  <div>
                    <span className="forma-section-kicker-text">{isRTL ? 'المسار الزمني' : 'Training line'}</span>
                    <h3>{isRTL ? 'جلسات اليوم' : 'Today’s sessions'}</h3>
                  </div>
                  <span className="forma-count-label tabular-nums">
                    {todaySessions.length} {isRTL ? 'مخطط' : 'planned'}
                  </span>
                </div>

                <div className="today-session-line">
                  {todaySessions.slice(1).map((session) => {
                    const status = deriveSessionStatus(session, data);
                    return (
                      <button
                        type="button"
                        className="today-session-line-item"
                        key={session.id}
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        <span className={`today-line-marker is-${status}`} aria-hidden="true" />
                        <span className="today-line-copy">
                          <strong>{tTitle(session.title)}</strong>
                          <small>
                            {formatDuration(session.duration, locale)} · {session.exercises?.length || 0} {isRTL ? 'تمارين' : 'exercises'}
                          </small>
                        </span>
                        <ArrowUpRight width={15} height={15} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                      </button>
                    );
                  })}
                  {todayHistory.map((record) => (
                    <div className="today-session-line-item is-complete" key={record.id}>
                      <span className="today-line-marker is-completed" aria-hidden="true">
                        <Check width={11} height={11} />
                      </span>
                      <span className="today-line-copy">
                        <strong>{tTitle(record.title)}</strong>
                        <small>
                          {isRTL ? 'تمت الجلسة' : 'Completed'} · {record.burnedCalories || 0} kcal
                        </small>
                      </span>
                    </div>
                  ))}
                  {todaySessions.length <= 1 && todayHistory.length === 0 && (
                    <div className="today-line-empty">
                      <p style={{ margin: 0 }}>{t('todayTimelineEmpty')}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        leftIcon={<CalendarDays width={14} height={14} />}
                        onClick={() => navigate('/plan')}
                      >
                        {t('todayTimelineAction')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="today-mini-stats">
                <MetricPair label={isRTL ? 'الحرق' : 'Burned'} value={todayBurnedCalories} unit="kcal" tone="emerald" />
                <MetricPair label={isRTL ? 'المدة' : 'Planned'} value={plannedMinutes} unit={isRTL ? 'د' : 'min'} />
              </div>
            </aside>
          </div>
        </section>

        <section className="today-tier today-tier-targets" aria-labelledby="today-targets-title">
          <p className="today-tier-kicker" id="today-targets-title">
            <span className="today-tier-kicker-line" aria-hidden="true" />
            {isRTL ? 'مستهدف اليوم' : 'Today’s targets'}
          </p>
          <TodayBentoGrid
            status={loading ? 'loading' : dashboardError ? 'error' : 'ready'}
            errorMessage={dashboardError || undefined}
            onRetry={() => {
              setDashboardError(null);
              setPanelError(null);
              void forceRefresh();
            }}
            todayBurnedCalories={todayBurnedCalories}
            calorieBurnTarget={500}
            workoutMinutes={plannedMinutes}
            workoutMinutesTarget={45}
            todayWater={daily.waterMl}
            waterGoal={daily.waterTargetMl}
            todayCalories={todayCalories}
            dailyCaloriesTarget={daily.nutritionGoals?.dailyCalories || 2154}
            todayProtein={todayProtein}
            dailyProteinTarget={daily.nutritionGoals?.dailyProtein || 162}
            activeSession={activeSession}
            recoveryScore={recoveryOverview.overallScore}
            streakDays={streakDays}
            history={data.history || []}
            sessions={data.sessions || []}
            isFriday={isFriday}
            onLogWater={(amount) => void handleQuickWater(amount)}
            onOpenQuickWorkout={openQuickWorkout}
            onNavigatePlan={() => navigate('/plan')}
            onNavigateNutrition={() => navigate('/nutrition?action=scan-meal')}
            onScrollToHologram={() => {
              document.getElementById('today-recovery')?.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start',
              });
            }}
          />
        </section>

        <section className="today-tier today-tier-recovery" id="today-recovery" aria-labelledby="today-recovery-title">
          <p className="today-tier-kicker is-lime" id="today-recovery-title">
            <span className="today-tier-kicker-line" aria-hidden="true" />
            {isRTL ? 'الجاهزية واستشفاء العضلات' : 'Recovery & readiness'}
          </p>

          <div className={`today-recovery-stack ${completedTrainingRecords > 0 ? '' : 'is-stacked'}`.trim()}>
            {completedTrainingRecords > 0 ? (
              <>
                <RecoveryCard
                  recovery={recoveryOverview}
                  onExploreMuscles={() => {
                    document.getElementById('today-muscle-hologram-section')?.scrollIntoView({
                      behavior: reduceMotion ? 'auto' : 'smooth',
                      block: 'center',
                    });
                  }}
                />
                <MuscleRecoveryHeatmapWidget />
              </>
            ) : (
              <div className="today-recovery-empty" role="status">
                <Moon size={20} aria-hidden="true" />
                <div>
                  <strong>{isRTL ? 'لا توجد بيانات استشفاء بعد' : 'Recovery not logged yet'}</strong>
                  <span>
                    {isRTL
                      ? 'أكمل جلسة تدريب لتظهر حالة العضلات الفعلية هنا.'
                      : 'Complete a workout to see muscle recovery from your actual training history.'}
                  </span>
                </div>
                <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={openQuickWorkout}>
                  {isRTL ? 'ابدأ تمريناً' : 'Start a session'}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="today-tier today-tier-fuel" aria-labelledby="today-fuel-title">
          <p className="today-tier-kicker is-emerald" id="today-fuel-title">
            <span className="today-tier-kicker-line" aria-hidden="true" />
            {isRTL ? 'الوقود اليومي' : 'Daily fuel'}
          </p>

          <div className="today-fuel-grid">
            <div className="today-fuel-column">
              <DailyNutritionTargetsCard
                todayCalories={todayCalories}
                todayBurnedCalories={todayBurnedCalories}
                dailyCaloriesTarget={daily.nutritionGoals?.dailyCalories || 2154}
                todayProtein={todayProtein}
                dailyProteinTarget={daily.nutritionGoals?.dailyProtein || 162}
                todayCarbs={todayCarbs}
                dailyCarbsTarget={daily.nutritionGoals?.dailyCarbs || 242}
                todayFats={todayFats}
                dailyFatsTarget={daily.nutritionGoals?.dailyFats || 60}
                onEdit={() => navigate('/nutrition')}
              />
            </div>

            <div className="today-hydration-column">
              <InteractiveHydrationWaveCard
                todayWater={daily.waterMl}
                waterGoal={daily.waterTargetMl}
                onLogWater={(amount) => void handleQuickWater(amount)}
                onResetWater={() => void handleResetWater()}
                status={hydrationError ? 'error' : 'ready'}
                errorMessage={hydrationError || undefined}
                onRetry={() => {
                  setHydrationError(null);
                  setPanelError(null);
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <QuickWorkoutModal
        isOpen={isQuickWorkoutOpen}
        onClose={() => setIsQuickWorkoutOpen(false)}
        onAdd={handleQuickWorkout}
        weightUnit={data.settings?.weightUnit || 'kg'}
        restSeconds={data.settings?.restTimerSeconds || 90}
      />
    </PageFrame>
  );
}
