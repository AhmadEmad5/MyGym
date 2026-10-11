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
import { deriveSessionStatus, resolveDailyTargets, selectDailySummary, selectWorkoutStreak } from '../lib/selectors';
import { formatDuration } from '../lib/formatters';
import { REST_DAY_KEYS, REST_DAY_LABELS, isRestDay, restDayName } from '../lib/restDay';
import { notify } from '../lib/feedback';
import type { WorkoutSession } from '../lib/api';
import { PageFrame } from '../components/layout/PageFrame';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { BackgroundGradient, MovingBorderButton, Meteors, GlowingEffect } from '../components/ui';
import { MetricPair } from '../components/primitives/MetricPair';
import { QuickWorkoutModal } from '../components/QuickWorkoutModal';
import { TodayBentoGrid, WidgetSkeleton, useFormaReducedMotion } from '../components/TodayBentoGrid';
import { TodayTier } from '../components/TodayTier';
import { RecoveryCard } from '../components/RecoveryCard';
import { MuscleRecoveryHeatmapWidget } from '../components/MuscleRecoveryHeatmapWidget';
import { MobileHeroWorkoutCard } from '../components/mobile/MobileHeroWorkoutCard';
import { MobileFloorVitals } from '../components/mobile/MobileFloorVitals';
import { useGsapStagger } from '../lib/useGsapStagger';

const MAX_VISIBLE_EXERCISES = 4;

export function TodayView() {
  const { data, loading, finishWorkoutSession, saveSession, logWater, forceRefresh } = useData();
  const { formatDate, tExercise, tTitle, t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useFormaReducedMotion();
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const commandGridRef = useGsapStagger<HTMLDivElement>({
    selector: '.gsap-command-item',
    delay: 0.04,
    stagger: 0.08,
    duration: 0.38,
    yOffset: 14
  });

  const locale = isRTL ? 'ar' : 'en-US';
  const today = useMemo(() => new Date(), []);
  const todayKey = format(today, 'yyyy-MM-dd');
  const restDaySettings = useMemo(() => ({ restDay: data?.settings?.restDay }), [data?.settings?.restDay]);
  const isRestDayToday = isRestDay(today, restDaySettings);
  const restDayNameLocal = restDayName(restDaySettings, isRTL);
  const nextDayName = REST_DAY_LABELS[REST_DAY_KEYS[addDays(today, 1).getDay()]];
  const restDayClosedMessage = isRTL
    ? `الجيم مغلق اليوم (${restDayNameLocal}) — استمتع بالراحة التامة والاستشفاء.`
    : `The gym is closed today (${restDayNameLocal}) — enjoy full recovery and rest.`;

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

  const { todayCalories, todayProtein } = useMemo(() => {
    let calories = 0;
    let protein = 0;
    for (const meal of daily?.meals || []) {
      calories += meal.calories || 0;
      protein += meal.protein || 0;
    }
    return { todayCalories: calories, todayProtein: protein };
  }, [daily]);

  const streakDays = useMemo(() => (data ? selectWorkoutStreak(data) : 0), [data]);
  const plannedMinutes = useMemo(
    () => todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0),
    [todaySessions],
  );

  // The bento grid and the nutrition card were each handed the same four
  // targets, with the same four magic-number fallbacks, at two call sites.
  const targets = useMemo(() => resolveDailyTargets(daily?.nutritionGoals), [daily]);

  const scrollToId = useCallback(
    (id: string, block: ScrollLogicalPosition = 'start') => {
      document.getElementById(id)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block,
      });
    },
    [reduceMotion],
  );

  const openQuickWorkout = useCallback(() => {
    if (isRestDayToday) {
      notify(restDayClosedMessage, 'warning');
      return;
    }
    setPanelError(null);
    setIsQuickWorkoutOpen(true);
  }, [isRestDayToday, restDayClosedMessage]);

  const handleQuickWater = useCallback(
    async (amount: number) => {
      try {
        setPanelError(null);
        await logWater(amount, todayKey);
        gymAudio.triggerVibration([15]);
      } catch {
        const message = isRTL ? 'تعذّر تسجيل الماء. حاول مرة أخرى.' : 'Could not log water. Try again.';
        setPanelError(message);
      }
    },
    [isRTL, logWater, todayKey],
  );

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

  const handleMoveToNextDay = useCallback(
    async (session: WorkoutSession) => {
      const next = addDays(new Date(session.date), 1);
      next.setHours(18, 0, 0, 0);
      const dateStr = new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      try {
        setPanelError(null);
        setDashboardError(null);
        await saveSession({ ...session, date: dateStr });
        const label = isRTL ? nextDayName.labelAr : nextDayName.labelEn;
        notify(isRTL ? `تم نقل الجلسة إلى يوم ${label} بنجاح!` : `Session rescheduled to ${label} successfully!`, 'success');
      } catch {
        const message = isRTL ? 'تعذّر نقل الجلسة. حاول مرة أخرى.' : 'Could not reschedule the session.';
        setDashboardError(message);
        setPanelError(message);
      }
    },
    [isRTL, nextDayName, saveSession],
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
      if (isRestDayToday) {
        notify(restDayClosedMessage, 'warning');
      } else if (activeSession) {
        navigate(`/session/${activeSession.id}`);
      } else {
        setIsQuickWorkoutOpen(true);
      }
    }
    if (shortcut === 'water-500') void handleQuickWater(500);
    if (shortcut === 'scan-meal') navigate('/nutrition?action=scan-meal');
  }, [activeSession, handleQuickWater, isRestDayToday, restDayClosedMessage, navigate]);

  if (!data || !daily) {
    return (
      <PageFrame
        routeId="today"
        title={isRTL ? 'الخطوة التالية' : 'The next move'}
        eyebrow={formatDate(today, 'EEEE · MMMM d')}
        subtitle={isRTL ? 'جارٍ تجهيز لوحة اليوم…' : 'Preparing your dashboard…'}
      >
        <div className="today-dashboard-stack" aria-busy="true">
          <div className="forma-widget today-skeleton-hero is-cyan">
            <div className="forma-widget-header">
              <h2 className="forma-widget-title">
                <span className="forma-widget-icon">
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
      : isRestDayToday
        ? isRTL ? 'عطلة أسبوعية' : 'Off-Day (Gym Closed)'
        : isRTL ? 'لا توجد جلسة' : 'No session';

  const statusTone = activeSession ? 'is-active' : isDayCompleted ? 'is-complete' : 'is-muted';

  const commandHeading = activeSession
    ? tTitle(activeSession.title)
    : isDayCompleted
      ? todayHistory[0] ? tTitle(todayHistory[0].title) : isRTL ? 'تمرين مكتمل' : 'Workout complete'
      : isRestDayToday
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
          <MovingBorderButton
            as="button"
            containerClassName="h-8.5 w-auto"
            className="px-3.5 py-1.5 text-xs font-semibold gap-1.5 bg-[var(--surface-sunken)] border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] transition-colors text-[var(--text-primary)]"
            borderClassName="bg-[radial-gradient(var(--accent-cyan)_40%,transparent_60%)]"
            duration={3200}
            animate={!reduceMotion}
            onClick={openQuickWorkout}
            disabled={isRestDayToday}
            title={isRestDayToday ? (isRTL ? 'الجيم مغلق اليوم (عطلة أسبوعية)' : 'Gym is closed today (Weekly off-day)') : undefined}
          >
            <Zap width={14} height={14} className="text-[var(--accent-cyan)]" />
            <span>{isRestDayToday ? (isRTL ? 'الجيم مغلق' : 'Gym closed') : isRTL ? 'تمرين سريع' : 'Quick workout'}</span>
          </MovingBorderButton>
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

      <div className="today-dashboard-stack">
        {/* Mobile-first trainee hero & vitals (< 768px) */}
        <section className="today-mobile-section" aria-label={isRTL ? 'تمرين اليوم ومؤشرات السرعة' : 'Today workout and vitals'}>
          <div className="mobile-athlete-header">
            <div>
              <span className="mobile-greeting-label">
                {isRTL ? 'مرحباً، يا بطل' : 'Welcome back,'}
              </span>
              <h2 className="mobile-athlete-name">
                {data?.user?.name || (isRTL ? 'الرياضي' : 'Athlete')}
              </h2>
            </div>
            {streakDays > 0 && (
              <div
                className="mobile-streak-ring"
                role="status"
                aria-label={isRTL ? `${streakDays} أيام تدريب متتالية` : `${streakDays} day training streak`}
              >
                <Flame size={15} aria-hidden="true" />
                <span className="mobile-streak-text tabular-nums">{streakDays}d</span>
              </div>
            )}
          </div>

          <MobileHeroWorkoutCard
            session={activeSession}
            isCompletedToday={isDayCompleted}
            onQuickWorkout={openQuickWorkout}
          />

          <MobileFloorVitals
            waterAmount={daily?.waterMl || 0}
            waterGoal={daily?.waterTargetMl || 3000}
            onQuickWater={handleQuickWater}
            calories={todayCalories}
            calorieGoal={targets.calories}
            protein={todayProtein}
            proteinGoal={targets.protein}
            onOpenNutrition={() => navigate('/nutrition')}
          />
        </section>

        {/* Desktop-tier command grid (>= 769px) */}
        <section className="today-tier today-tier-training today-desktop-section" aria-labelledby="today-command-title">
          <h2 className="forma-sr-only" id="today-command-title">
            {isRTL ? 'إجراء اليوم' : 'Today’s action'}
          </h2>

          <div ref={commandGridRef} className="today-command-grid" id="today-command" data-tour="today-workout">
            <div className="today-active-column gsap-command-item">
              <BackgroundGradient
                animate={!reduceMotion}
                containerClassName="w-full flex-1 flex flex-col rounded-[var(--radius-xl)]"
                className="w-full flex-1 flex flex-col rounded-[calc(var(--radius-xl)-2px)]"
              >
                <div className={`today-active-surface ${isDayCompleted ? 'is-complete' : ''}`.trim()}>
                  <div className="today-surface-topline">
                    <span className={`forma-status-label ${statusTone}`}>{statusLabel}</span>
                    <span className="today-surface-date tabular-nums">{format(today, 'dd.MM')}</span>
                  </div>

                  {activeSession ? (
                    <>
                      {isRestDayToday && (
                        <div className="today-friday-notice">
                          <span className="today-friday-notice-copy">
                            <Moon size={15} aria-hidden="true" />
                            {isRTL
                              ? `الجيم مغلق اليوم (${restDayNameLocal}) — يُنصح بنقل هذه الجلسة إلى الغد (${nextDayName.labelAr}).`
                              : `Gym is closed today (${restDayNameLocal}) — we recommend moving this session to ${nextDayName.labelEn}.`}
                          </span>
                          <Button variant="secondary" size="sm" onClick={() => void handleMoveToNextDay(activeSession)}>
                            {isRTL ? `نقل إلى ${nextDayName.labelAr}` : `Move to ${nextDayName.labelEn}`}
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
                        <MovingBorderButton
                          as="button"
                          containerClassName="h-11 w-auto"
                          className="px-5 py-2 font-bold text-sm gap-2 bg-[var(--accent-lime)] text-[var(--text-on-accent-deep)] hover:brightness-110 shadow-[0_0_24px_rgba(163,230,53,0.35)]"
                          borderClassName="bg-[radial-gradient(var(--accent-emerald)_40%,transparent_60%)]"
                          duration={3000}
                          animate={!reduceMotion}
                          disabled={isRestDayToday}
                          onClick={() => navigate(`/session/${activeSession.id}`)}
                        >
                          <Play width={16} height={16} fill="currentColor" />
                          <span>{isRTL ? 'ابدأ التمرين' : 'Start workout'}</span>
                        </MovingBorderButton>
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
                    <div className="today-celebration relative overflow-hidden">
                      {!reduceMotion && (
                        <Meteors number={24} className="opacity-70 pointer-events-none" />
                      )}
                      <div className="today-surface-topline relative z-10">
                        <div className="today-celebration-heading">
                          <span className="today-celebration-icon" aria-hidden="true">
                            <Trophy size={20} />
                          </span>
                          <span className="today-celebration-kicker">
                            {isRTL ? 'إنجاز تدريب اليوم' : "Today’s session is done"}
                          </span>
                        </div>
                        <span className="forma-badge is-success">
                          <CheckCircle2 size={13} aria-hidden="true" />
                          {isRTL ? 'محفوظ في السجل' : 'Logged to history'}
                        </span>
                      </div>

                      <h3 className="today-celebration-title relative z-10">{commandHeading}</h3>

                      <dl className="today-celebration-grid relative z-10">
                        <div className="today-celebration-cell is-warning">
                          <dt>{isRTL ? 'السعرات المحروقة' : 'Burned'}</dt>
                          <dd>
                            <Flame size={14} aria-hidden="true" />
                            <span className="tabular-nums">~{todayBurnedCalories} kcal</span>
                          </dd>
                        </div>
                        <div className="today-celebration-cell is-cyan">
                          <dt>{isRTL ? 'التمارين المنجزة' : 'Exercises'}</dt>
                          <dd>
                            <Dumbbell size={14} aria-hidden="true" />
                            <span className="tabular-nums">{todayHistory[0]?.snapshot?.exercises?.length || 0}</span>
                          </dd>
                        </div>
                        <div className="today-celebration-cell is-success">
                          <dt>{isRTL ? 'الحالة' : 'Status'}</dt>
                          <dd>{isRTL ? 'مكتمل' : '100% done'}</dd>
                        </div>
                      </dl>

                      <div className="today-primary-row relative z-10">
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
                      icon={isRestDayToday ? <Moon size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
                      title={
                        isRestDayToday
                          ? isRTL
                            ? `${restDayNameLocal} — عطلة أسبوعية`
                            : `${restDayNameLocal} — weekly off-day`
                          : isRTL ? 'لا يوجد تمرين مخطط اليوم' : 'No workout planned today'
                      }
                      description={
                        isRestDayToday
                          ? isRTL
                            ? `الجيم مغلق دائماً كل يوم ${restDayNameLocal}. استغل اليوم للراحة التامة، تغذية العضلات، وإعادة شحن طاقتك.`
                            : `The gym is closed every ${restDayNameLocal}. Use it for full rest, proper nutrition, and recovery for the week ahead.`
                          : isRTL
                            ? 'اختر روتيناً أو أضف جلسة عندما تكون مستعداً.'
                            : 'Pick a routine or schedule a session when you are ready to train.'
                      }
                      action={
                        <Button variant="primary" size="md" leftIcon={<Dumbbell width={16} height={16} />} onClick={() => navigate(isRestDayToday ? '/plan' : '/routines')}>
                          {isRestDayToday ? (isRTL ? 'عرض جدول الأسبوع' : 'View weekly schedule') : isRTL ? 'اختر روتيناً' : 'Choose a routine'}
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
              </BackgroundGradient>
            </div>

            <aside className="today-sessions-sidebar gsap-command-item" aria-label={isRTL ? 'مسار الجلسات' : 'Sessions timeline'}>
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
                      <p>{t('todayTimelineEmpty')}</p>
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

        <TodayTier
          name="targets"
          id="today-targets"
          titleId="today-targets-title"
          label={isRTL ? 'مستهدف اليوم' : 'Today’s targets'}
        >
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
            dailyCaloriesTarget={targets.calories}
            todayProtein={todayProtein}
            dailyProteinTarget={targets.protein}
            activeSession={activeSession}
            recoveryScore={recoveryOverview.overallScore}
            streakDays={streakDays}
            history={data.history || []}
            sessions={data.sessions || []}
            isRestDay={isRestDayToday}
            restDaySettings={restDaySettings}
            onLogWater={(amount) => void handleQuickWater(amount)}
            onOpenQuickWorkout={openQuickWorkout}
            onNavigatePlan={() => navigate('/plan')}
            onNavigateNutrition={() => navigate('/nutrition?action=scan-meal')}
            onScrollToHologram={() => scrollToId('today-recovery')}
          />
        </TodayTier>

        <TodayTier
          name="recovery"
          id="today-recovery"
          tone="is-lime"
          titleId="today-recovery-title"
          label={isRTL ? 'الجاهزية واستشفاء العضلات' : 'Recovery & readiness'}
        >
          <div className={`today-recovery-stack ${completedTrainingRecords > 0 ? '' : 'is-stacked'}`.trim()}>
            {completedTrainingRecords > 0 ? (
              <>
                <RecoveryCard
                  recovery={recoveryOverview}
                  onExploreMuscles={() => scrollToId('today-muscle-hologram-section', 'center')}
                />
                <MuscleRecoveryHeatmapWidget />
              </>
            ) : (
              <div className="today-recovery-empty relative overflow-hidden" role="status">
                <GlowingEffect spread={35} glow={true} disabled={reduceMotion} proximity={60} inactiveZone={0.01} borderWidth={1.5} variant="lime" />
                <div className="today-recovery-icon-badge relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--accent-lime)] shadow-[0_0_14px_rgba(163,230,53,0.18)]">
                  <Moon size={20} aria-hidden="true" />
                </div>
                <div className="today-recovery-copy relative z-10">
                  <strong>{isRTL ? 'لا توجد بيانات استشفاء بعد' : 'Recovery not logged yet'}</strong>
                  <span>
                    {isRTL
                      ? 'أكمل جلسة تدريب لتظهر حالة العضلات الفعلية هنا.'
                      : 'Complete a workout to see muscle recovery from your actual training history.'}
                  </span>
                </div>
                <div className="today-recovery-action relative z-10">
                  <MovingBorderButton
                    as="button"
                    containerClassName="h-9 w-auto"
                    className="px-3.5 py-1.5 text-xs font-semibold gap-1.5 bg-[var(--surface-sunken)] border-[var(--border-subtle)] hover:border-[var(--accent-lime)] text-[var(--text-primary)]"
                    borderClassName="bg-[radial-gradient(var(--accent-lime)_40%,transparent_60%)]"
                    duration={3000}
                    animate={!reduceMotion}
                    onClick={openQuickWorkout}
                  >
                    <RotateCcw size={14} className="text-[var(--accent-lime)]" />
                    <span>{isRTL ? 'ابدأ تمريناً' : 'Start a session'}</span>
                  </MovingBorderButton>
                </div>
              </div>
            )}
          </div>
        </TodayTier>
      </div>

      <QuickWorkoutModal
        isOpen={isQuickWorkoutOpen}
        onClose={() => setIsQuickWorkoutOpen(false)}
        onAdd={handleQuickWorkout}
        weightUnit={data.settings?.weightUnit || 'kg'}
        restSeconds={data.settings?.restTimerSeconds || 90}
        restDaySettings={restDaySettings}
      />
    </PageFrame>
  );
}
