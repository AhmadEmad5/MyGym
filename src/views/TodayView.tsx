import { useEffect, useMemo, useState } from 'react';
import { format, addDays } from 'date-fns';
import { notify } from '../lib/feedback';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  History,
  Moon,
  Play,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QuickWorkoutModal } from '../components/QuickWorkoutModal';
import { InteractiveHydrationWaveCard } from '../components/InteractiveHydrationWaveCard';
import { RecoveryCard } from '../components/RecoveryCard';
import { MuscleRecoveryHeatmapWidget } from '../components/MuscleRecoveryHeatmapWidget';
import { DailyNutritionTargetsCard } from '../components/DailyNutritionTargetsCard';
import { MetricPair } from '../components/primitives/MetricPair';
import { PageFrame } from '../components/layout/PageFrame';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useData } from '../hooks/useData';
import { selectDailySummary, deriveSessionStatus, selectWorkoutStreak } from '../lib/selectors';
import { formatDuration } from '../lib/formatters';
import type { WorkoutSession } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { computeMuscleRecovery } from '../lib/recovery';
import { MobileHeroWorkoutCard } from '../components/mobile/MobileHeroWorkoutCard';
import { MobileFloorVitals } from '../components/mobile/MobileFloorVitals';

export function TodayView() {
  const { data, finishWorkoutSession, saveSession, logWater, resetWater } = useData();
  const { formatDate, tExercise, tTitle, isRTL, language } = useTranslation();
  const navigate = useNavigate();
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);

  if (!data) return null;

  const today = useMemo(() => new Date(), []);
  const todayKey = format(today, 'yyyy-MM-dd');
  const isFriday = today.getDay() === 5;
  const daily = useMemo(() => selectDailySummary(data, today), [data, todayKey]);
  const todaySessions = useMemo(() => daily.sessions.filter((session) => !session.isCompleted), [daily.sessions]);
  const todayHistory = daily.history;
  const activeSession = todaySessions[0] || null;
  const isDayCompleted = todaySessions.length === 0 && todayHistory.length > 0;
  
  // Hero session to display on mobile: active uncompleted session, or today's completed session, or scheduled session
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
  const completedTrainingRecords = (data.history || []).filter((record) => record.snapshot?.exercises?.some((exercise) => Boolean(exercise.targetMuscle))).length
    + (data.sessions || []).filter((session) => session.isCompleted && session.exercises?.some((exercise) => Boolean(exercise.targetMuscle))).length;
  const recoveryOverview = useMemo(
    () => computeMuscleRecovery(data?.history || [], data?.sessions || []),
    [data?.history, data?.sessions]
  );
  const { todayCalories, todayProtein, todayCarbs, todayFats } = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    for (const meal of daily.meals) {
      cal += meal.calories || 0;
      pro += meal.protein || 0;
      carb += meal.carbs || 0;
      fat += meal.fats || 0;
    }
    return { todayCalories: cal, todayProtein: pro, todayCarbs: carb, todayFats: fat };
  }, [daily.meals]);
  const streakDays = useMemo(() => selectWorkoutStreak(data), [data]);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const handleQuickWater = async (amount: number) => {
    await logWater(amount, todayKey);
    gymAudio.triggerVibration([15]);
  };

  const handleResetWater = async () => {
    await resetWater(todayKey);
    gymAudio.triggerVibration([10]);
  };

  const handleCompleteSession = async (session: WorkoutSession) => {
    gymAudio.triggerSubtleHaptic([30, 50]);
    await finishWorkoutSession({ ...session, isCompleted: true });
    notify(isRTL ? 'تم إنهاء التمرين وحفظه في السجل بنجاح!' : 'Workout finished and logged to history!', 'success');
  };

  const handleQuickWorkout = async (session: Partial<WorkoutSession>) => {
    const full = session as WorkoutSession;
    await saveSession(full);
    navigate(`/session/${full.id}`);
  };

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
    // PWA shortcuts intentionally run once for the current route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageFrame
      routeId="today"
      title={isRTL ? 'الخطوة التالية' : 'The next move'}
      subtitle={isRTL ? 'سجل ما يحتاجه تمرينك الآن، واترك التحليلات للتقرير.' : 'Log what your training needs now. Keep the analysis in the report.'}
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
            onClick={() => {
              if (isFriday) {
                notify(isRTL ? 'الجيم مغلق اليوم الجمعة — استمتع بالراحة التامة.' : 'The gym is closed on Friday — enjoy your rest day.', 'warning');
                return;
              }
              setIsQuickWorkoutOpen(true);
            }}
            leftIcon={<Zap width={15} height={15} />}
            disabled={isFriday}
            title={isFriday ? (isRTL ? 'الجيم مغلق اليوم (عطلة أسبوعية)' : 'Gym is closed today (Weekly off-day)') : undefined}
          >
            {isFriday ? (isRTL ? '🔒 الجيم مغلق' : '🔒 Gym Closed') : (isRTL ? 'تمرين سريع' : 'Quick workout')}
          </Button>
        </>
      }
    >
      <div className="today-dashboard-stack">
        {/* Mobile-First Floor Hero & Vitals Stack */}
        <div className="today-mobile-hero-stack">
          {/* Top Athlete Greeting with Flame Streak (Matches Mockup) */}
          <div className="mobile-athlete-header">
            <div>
              <div className="mobile-greeting-label">{isRTL ? 'مرحباً بعودتك،' : 'Welcome back,'}</div>
              <div className="mobile-athlete-name">{data?.user?.name || (isRTL ? 'البطل' : 'Athlete')}</div>
            </div>
            <div className="mobile-streak-ring" title="Current streak">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span className="mobile-streak-text">{Math.max(1, streakDays)}d</span>
            </div>
          </div>

          <MobileHeroWorkoutCard
            session={heroSession}
            isCompletedToday={isDayCompleted}
            onQuickWorkout={() => setIsQuickWorkoutOpen(true)}
            streakDays={streakDays}
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
          />
        </div>

        {/* Tier 1: Training & Today's Workout Hero - Front & Center */}
        <section className="today-training-section" aria-labelledby="today-training-title">
          <div className="forma-section-kicker">
            <span className="forma-section-line" />
            <span id="today-training-title">{isRTL ? 'تمرين اليوم والنشاط التدريبي' : 'Daily Workout & Training'}</span>
          </div>

          <div className="today-training-layout">
            <div className="today-active-column" aria-labelledby="today-active-title">
              <div className="today-active-surface">
                <div className="today-surface-topline">
                  <span className={`forma-status-label ${activeSession ? 'is-active' : isDayCompleted ? 'is-complete' : isFriday ? 'is-muted' : 'is-muted'}`}>
                    {activeSession 
                      ? (isRTL ? 'مخطط اليوم' : 'Planned today') 
                      : isDayCompleted 
                      ? (isRTL ? 'مكتمل' : 'Complete') 
                      : isFriday
                      ? (isRTL ? 'عطلة أسبوعية (الجيم مغلق)' : 'Off-Day (Gym Closed)')
                      : (isRTL ? 'لا توجد جلسة' : 'No session')}
                  </span>
                  <span className="today-surface-date tabular-nums">{format(today, 'dd.MM')}</span>
                </div>

                {activeSession ? (
                  <>
                    {isFriday && (
                      <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>🔒</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>
                            {isRTL ? 'الجيم مغلق اليوم الجمعة — يُنصح بنقل هذه الجلسة إلى الغد (السبت).' : 'Gym is closed today (Friday) — we recommend moving this session to Saturday.'}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            const sat = addDays(new Date(activeSession.date), 1);
                            sat.setHours(18, 0, 0, 0);
                            const dateStr = new Date(sat.getTime() - (sat.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                            await saveSession({ ...activeSession, date: dateStr });
                            notify(isRTL ? 'تم نقل الجلسة إلى يوم السبت بنجاح!' : 'Session rescheduled to Saturday successfully!', 'success');
                          }}
                        >
                          {isRTL ? 'نقل للسبت' : 'Move to Saturday'}
                        </Button>
                      </div>
                    )}

                    <div className="today-active-heading">
                      <div>
                        <h2 id="today-active-title">{tTitle(activeSession.title)}</h2>
                        <p>{activeSession.type} · {formatDuration(activeSession.duration, language === 'ar' ? 'ar' : 'en-US')}</p>
                      </div>
                      <div className="today-active-index" aria-label={isRTL ? 'عدد التمارين' : 'Exercise count'}>
                        <strong className="tabular-nums">{activeSession.exercises?.length || 0}</strong>
                        <span>{isRTL ? 'تمارين' : 'exercises'}</span>
                      </div>
                    </div>

                    <div className="today-exercise-list">
                      {(activeSession.exercises || []).slice(0, 4).map((exercise, index) => (
                        <div className="today-exercise-row" key={exercise.id || `${exercise.name}-${index}`}>
                          <span className="today-exercise-number tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                          <span className="today-exercise-name">{tExercise(exercise.name)}</span>
                          <span className="today-exercise-meta tabular-nums">{exercise.sets?.length || 0} {isRTL ? 'جولات' : 'sets'}</span>
                        </div>
                      ))}
                      {(activeSession.exercises?.length || 0) > 4 && (
                        <span className="today-more-exercises">+{(activeSession.exercises?.length || 0) - 4} {isRTL ? 'تمارين أخرى' : 'more exercises'}</span>
                      )}
                    </div>

                    <div className="today-primary-row">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Play width={16} height={16} fill="currentColor" />}
                        disabled={isFriday}
                        onClick={() => navigate(`/session/${activeSession.id}`)}
                      >
                        {isRTL ? 'ابدأ التمرين' : 'Start workout'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        leftIcon={<Check width={16} height={16} />}
                        onClick={() => void handleCompleteSession(activeSession)}
                      >
                        {isRTL ? 'تم' : 'Mark complete'}
                      </Button>
                    </div>
                  </>
                ) : isDayCompleted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="today-completed-celebration-hero"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%)',
                      border: '1.5px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      boxShadow: '0 20px 45px -10px rgba(16, 185, 129, 0.22)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                        }}>
                          <Trophy width={24} height={24} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isRTL ? 'إنجاز تدريب اليوم' : "TODAY'S MISSION COMPLETE"}
                          </div>
                          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {todayHistory[0]?.title || (isRTL ? 'تمرين مكتمل' : 'Workout Complete')}
                          </h2>
                        </div>
                      </div>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <CheckCircle2 width={14} height={14} />
                        {isRTL ? 'محفوظ في السجل' : 'Logged to History'}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.85rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          {isRTL ? 'السعرات المحروقة' : 'Burned Calories'}
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <Flame width={15} height={15} />
                          <span>~{todayBurnedCalories} kcal</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          {isRTL ? 'التمارين المنجزة' : 'Exercises Done'}
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <Dumbbell width={15} height={15} />
                          <span>{todayHistory[0]?.snapshot?.exercises?.length || 0}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          {isRTL ? 'الحالة' : 'Status'}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                          {isRTL ? '100% مكتمل' : '100% Done'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<History width={16} height={16} />}
                        onClick={() => navigate('/plan?tab=workouts')}
                        style={{ flex: 1, minWidth: '160px' }}
                      >
                        {isRTL ? 'عرض في سجل التمارين' : 'View in Workout History'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        leftIcon={<Plus width={16} height={16} />}
                        onClick={() => setIsQuickWorkoutOpen(true)}
                        style={{ flex: 1, minWidth: '160px' }}
                      >
                        {isRTL ? 'تسجيل تمرين إضافي' : 'Log Extra Workout'}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={
                      isFriday 
                        ? <Moon width={24} height={24} style={{ color: '#38bdf8' }} /> 
                        : <Sparkles width={24} height={24} />
                    }
                    title={
                      isFriday 
                        ? (isRTL ? 'اليوم الجمعة — الجيم مغلق (عطلة أسبوعية)' : 'Friday — Gym Closed (Weekly Off-Day)')
                        : (isRTL ? 'لا يوجد تمرين مخطط اليوم' : 'No workout planned today')
                    }
                    description={
                      isFriday 
                        ? (isRTL ? 'الجيم مغلق دائماً كل يوم جمعة. استغل اليوم للراحة التامة، تغذية العضلات، وإعادة شحن طاقتك.' : 'The gym is closed every Friday. Enjoy full rest, optimal nutrition, and recovery for upcoming sessions.')
                        : (isRTL ? 'اختر روتيناً أو أضف جلسة عندما تكون مستعداً.' : 'Choose a routine or add a session when you are ready.')
                    }
                    action={
                      <div className="today-empty-actions flex flex-wrap gap-2.5 justify-center">
                        {isFriday ? (
                          <>
                            <Button
                              variant="primary"
                              size="md"
                              leftIcon={<CalendarDays width={16} height={16} />}
                              onClick={() => navigate('/plan')}
                            >
                              {isRTL ? 'عرض جدول الأسبوع' : 'View Weekly Schedule'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="md"
                              leftIcon={<Dumbbell width={16} height={16} />}
                              onClick={() => navigate('/routines')}
                            >
                              {isRTL ? 'استكشاف الجداول' : 'Browse Routines'}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="primary"
                              size="md"
                              leftIcon={<Dumbbell width={16} height={16} />}
                              onClick={() => navigate('/routines')}
                            >
                              {isRTL ? 'اختر روتيناً' : 'Choose a routine'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="md"
                              leftIcon={<CalendarDays width={16} height={16} />}
                              onClick={() => navigate('/plan')}
                            >
                              {isRTL ? 'أضف جلسة' : 'Add session'}
                            </Button>
                          </>
                        )}
                      </div>
                    }
                  />
                )}
              </div>
            </div>

            <aside className="today-sessions-sidebar" aria-label={isRTL ? 'مسار الجلسات' : 'Sessions timeline'}>
              <div>
                <div className="forma-section-heading today-queue-heading" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
                  <div>
                    <span className="forma-section-kicker-text">{isRTL ? 'المسار الزمني' : 'Training line'}</span>
                    <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{isRTL ? 'جلسات اليوم' : 'Today’s sessions'}</h2>
                  </div>
                  <span className="forma-count-label tabular-nums">{todaySessions.length} {isRTL ? 'مخطط' : 'planned'}</span>
                </div>

                <div className="today-session-line">
                  {todaySessions.length > 1 && todaySessions.slice(1).map((session) => {
                    const status = deriveSessionStatus(session, data);
                    return (
                      <button type="button" className="today-session-line-item" key={session.id} onClick={() => navigate(`/session/${session.id}`)}>
                        <span className={`today-line-marker is-${status}`} aria-hidden="true" />
                        <span className="today-line-copy">
                          <strong>{tTitle(session.title)}</strong>
                          <small>{formatDuration(session.duration, language === 'ar' ? 'ar' : 'en-US')} · {session.exercises?.length || 0} {isRTL ? 'تمارين' : 'exercises'}</small>
                        </span>
                        <ArrowUpRight width={15} height={15} aria-hidden="true" />
                      </button>
                    );
                  })}
                  {todayHistory.map((record) => (
                    <div className="today-session-line-item is-complete" key={record.id}>
                      <span className="today-line-marker is-completed" aria-hidden="true"><Check width={11} height={11} /></span>
                      <span className="today-line-copy">
                        <strong>{tTitle(record.title)}</strong>
                        <small>{isRTL ? 'تمت الجلسة' : 'Completed'} · {record.burnedCalories || 0} kcal</small>
                      </span>
                    </div>
                  ))}
                  {todaySessions.length <= 1 && todayHistory.length === 0 && (
                    <div className="today-line-empty">{isRTL ? 'ستظهر الجلسات والإنجازات هنا.' : 'Sessions and completed work will appear here.'}</div>
                  )}
                </div>
              </div>

              <div className="today-mini-stats">
                <MetricPair label={isRTL ? 'الحرق' : 'Burned'} value={todayBurnedCalories} unit="kcal" tone="emerald" />
                <MetricPair label={isRTL ? 'المدة' : 'Planned'} value={todaySessions.reduce((sum, session) => sum + session.duration, 0)} unit={isRTL ? 'د' : 'min'} />
              </div>
            </aside>
          </div>
        </section>

        {/* Tier 2: Unified Muscle Recovery & Physical Readiness */}
        <section className="today-recovery-section" id="today-muscle-hologram-section" aria-labelledby="today-recovery-title">
          <div className="forma-section-kicker">
            <span className="forma-section-line" style={{ background: '#bef264', boxShadow: '0 0 10px #bef264' }} />
            <span id="today-recovery-title">{isRTL ? 'مؤشر الجاهزية واستشفاء العضلات' : 'Muscle Recovery & Physical Readiness'}</span>
          </div>

          <div className="today-recovery-stack">
            {completedTrainingRecords > 0 ? (
              <>
                <RecoveryCard
                  recovery={recoveryOverview}
                  onExploreMuscles={() => {
                    document.getElementById('today-muscle-hologram-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
                <MuscleRecoveryHeatmapWidget />
              </>
            ) : (
              <div className="today-recovery-empty" role="status">
                <Moon width={20} height={20} />
                <div>
                  <strong>{isRTL ? 'لا توجد بيانات استشفاء بعد' : 'Recovery not logged yet'}</strong>
                  <span>{isRTL ? 'أكمل جلسة تدريب لتظهر حالة العضلات الفعلية هنا.' : 'Complete a workout to see muscle recovery from your actual training history.'}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tier 3: Daily Fuel, Nutrition & Hydration */}
        <section className="today-fuel-section" aria-labelledby="today-fuel-title">
          <div className="forma-section-kicker">
            <span className="forma-section-line" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span id="today-fuel-title">{isRTL ? 'الوقود اليومي والتغذية والترطيب' : 'Daily Fuel, Nutrition & Hydration'}</span>
          </div>

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
