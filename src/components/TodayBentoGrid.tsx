import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Droplet,
  Dumbbell,
  Flame,
  Inbox,
  Moon,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { HistoryRecord, WorkoutSession } from '../lib/api';
import { Button } from './ui/Button';

export type WidgetStatus = 'loading' | 'ready' | 'empty' | 'error';

const prefersReduced = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const motionAttrReduced = () => {
  if (typeof document === 'undefined') return false;
  const attr = document.documentElement.getAttribute('data-motion');
  // An explicit in-app choice outranks the OS default. The OS setting is a
  // default, not a lock: someone who gets motion sickness will have it on
  // system-wide, and a person who deliberately turns motion ON in Settings
  // should not be overruled by it. `auto`/absent still follows the OS, so
  // nobody who did not ask for motion gets any.
  if (attr === 'reduced') return true;
  if (attr === 'full') return false;
  return prefersReduced();
};

export function useFormaReducedMotion() {
  const [reduced, setReduced] = useState(() => motionAttrReduced());

  useEffect(() => {
    const sync = () => setReduced(motionAttrReduced());
    sync();

    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', sync);

    const observer =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(sync)
        : null;
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });

    return () => {
      query.removeEventListener('change', sync);
      observer?.disconnect();
    };
  }, []);

  return reduced;
}

export function useAnimationActive(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const compute = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        setActive(false);
        return;
      }
      if (typeof IntersectionObserver === 'undefined') {
        setActive(true);
        return;
      }
      setActive(true);
    };

    compute();

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => setActive(entries.some((entry) => entry.isIntersecting)), { rootMargin: '120px' })
        : null;
    observer?.observe(node);

    const onVisibility = () => {
      if (document.hidden) setActive(false);
      else compute();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref]);

  return active;
}

export interface WidgetFrameProps {
  title: string;
  icon?: ReactNode;
  tone?: 'cyan' | 'emerald' | 'lime' | 'amber' | 'rose' | 'purple';
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export interface WidgetHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  iconColor?: string;
  trailing?: ReactNode;
  /** The bento cards sit flush inside their card body and need no padding. */
  flush?: boolean;
  /**
   * `WidgetFrame` has always used `<header>`; the four bento cards this
   * replaced used `<div>`. Same class, same layout, different element - so
   * the element is a parameter rather than being silently normalised. Worth
   * reconciling deliberately: a `<header>` inside an `<article>` is a
   * sectioning-content header and announces as one, which is arguably
   * better, but that is a decision to make on purpose.
   */
  as?: 'header' | 'div';
}

/**
 * The `icon + title + trailing` row shared by every widget on this screen.
 *
 * `WidgetFrame` already rendered this shape, but the four bento cards inside
 * this same file each open-coded it rather than using it, so the title markup
 * had five copies. Extracted so the header is stated once.
 */
export function WidgetHeader({ title, icon, iconColor, trailing, flush = false, as: Tag = 'header' }: WidgetHeaderProps) {
  return (
    <Tag className="forma-widget-header" style={flush ? { padding: 0 } : undefined}>
      <h3 className="forma-widget-title">
        {icon && (
          <span className="forma-widget-icon" style={iconColor ? { color: iconColor } : undefined}>
            {icon}
          </span>
        )}
        <span>{title}</span>
      </h3>
      {trailing}
    </Tag>
  );
}

export function WidgetFrame({
  title,
  icon,
  tone = 'cyan',
  trailing,
  children,
  className = '',
  id,
  style,
}: WidgetFrameProps) {
  return (
    <section id={id} className={`forma-widget is-${tone} ${className}`.trim()} style={style}>
      <WidgetHeader title={title} icon={icon} trailing={trailing} />
      <div className="forma-widget-body">{children}</div>
    </section>
  );
}

export interface WidgetSkeletonProps {
  label?: string;
  rows?: number;
  circular?: boolean;
}

export function WidgetSkeleton({ label, rows = 3, circular = false }: WidgetSkeletonProps) {
  return (
    <div
      className="forma-widget-state"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {circular && <div className="today-skeleton" style={{ width: 96, height: 96, borderRadius: '50%' }} aria-hidden="true" />}
      <div className="today-skeleton-stack" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="today-skeleton"
            style={{ height: '0.75rem', width: `${100 - index * 14}%` }}
          />
        ))}
      </div>
      <span className="forma-sr-only">{label || 'Loading'}</span>
    </div>
  );
}

export interface WidgetStateProps {
  title: string;
  description?: string;
  tone?: 'error' | 'empty';
  icon?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert';
}

export function WidgetState({
  title,
  description,
  tone = 'empty',
  icon,
  action,
  role = 'status',
}: WidgetStateProps) {
  return (
    <div className={`forma-widget-state is-${tone}`} role={role}>
      <span className="forma-widget-state-icon" aria-hidden="true">
        {icon || (tone === 'error' ? <AlertTriangle size={18} /> : <Inbox size={18} />)}
      </span>
      <p className="forma-widget-state-title">{title}</p>
      {description && <p className="forma-widget-state-body">{description}</p>}
      {action && <div className="forma-widget-state-actions">{action}</div>}
    </div>
  );
}

interface FocusMuscle {
  nameAr: string;
  nameEn: string;
  badge: string;
  statusTextAr: string;
  statusTextEn: string;
}

export interface TodayBentoGridProps {
  todayBurnedCalories: number;
  calorieBurnTarget?: number;
  workoutMinutes: number;
  workoutMinutesTarget?: number;
  todayWater: number;
  waterGoal?: number;
  todayCalories: number;
  dailyCaloriesTarget: number;
  todayProtein: number;
  dailyProteinTarget: number;
  activeSession: WorkoutSession | null;
  recoveryScore: number;
  streakDays: number;
  history: HistoryRecord[];
  sessions: WorkoutSession[];
  isFriday: boolean;
  status?: WidgetStatus;
  errorMessage?: string;
  onRetry?: () => void;
  onLogWater: (amount: number) => void;
  onOpenQuickWorkout: () => void;
  onNavigatePlan: () => void;
  onNavigateNutrition: () => void;
  onScrollToHologram: () => void;
}

const RING_RADIUS = { move: 52, exercise: 39, water: 26 } as const;

const ringMetrics = (burned: number, calorieGoal: number, minutes: number, minuteGoal: number, water: number, waterGoal: number) => {
  const safe = (value: number, goal: number) => (goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0);
  return {
    move: safe(burned, calorieGoal),
    exercise: safe(minutes, minuteGoal),
    water: safe(water, waterGoal),
  };
};

const ringSummary = (isRTL: boolean, move: number, exercise: number, water: number) =>
  isRTL
    ? `Ø­Ù„Ù‚Ø§Øª Ø§Ù„Ù†Ø´Ø§Ø·: Ø§Ù„Ø­Ø±Ù‚ ${Math.round(move * 100)}%ØŒ ÙˆÙ‚Øª Ø§Ù„ØªÙ…Ø±ÙŠÙ† ${Math.round(exercise * 100)}%ØŒ Ø§Ù„ØªØ±Ø·ÙŠØ¨ ${Math.round(water * 100)}%.`
    : `Activity rings: ${Math.round(move * 100)}% move, ${Math.round(exercise * 100)}% exercise, ${Math.round(water * 100)}% hydration.`;

export function TodayBentoGrid({
  todayBurnedCalories,
  calorieBurnTarget = 500,
  workoutMinutes,
  workoutMinutesTarget = 45,
  todayWater,
  waterGoal = 2500,
  todayCalories,
  dailyCaloriesTarget,
  todayProtein,
  dailyProteinTarget,
  activeSession,
  recoveryScore,
  streakDays,
  history,
  sessions,
  isFriday,
  status = 'ready',
  errorMessage,
  onRetry,
  onLogWater,
  onOpenQuickWorkout,
  onNavigatePlan,
  onNavigateNutrition,
  onScrollToHologram,
}: TodayBentoGridProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();
  const [activeRing, setActiveRing] = useState<'move' | 'exercise' | 'water' | null>(null);

  const progress = useMemo(
    () => ringMetrics(todayBurnedCalories, calorieBurnTarget, workoutMinutes, workoutMinutesTarget, todayWater, waterGoal),
    [todayBurnedCalories, calorieBurnTarget, workoutMinutes, workoutMinutesTarget, todayWater, waterGoal],
  );
  const allRingsClosed = progress.move >= 1 && progress.exercise >= 1 && progress.water >= 1;

  const focusMuscle = useMemo<FocusMuscle>(() => {
    if (isFriday) {
      return {
        nameAr: 'Ø§Ø³ØªØ´ÙØ§Ø¡ ÙƒØ§Ù…Ù„ (Ø¹Ø·Ù„Ø© Ø§Ù„Ø¬Ù…Ø¹Ø©)',
        nameEn: 'Full Recovery (Friday Off-Day)',
        badge: isRTL ? 'Ø±Ø§Ø­Ø© ÙˆÙ†Ù…Ùˆ' : 'Rest & Grow',
        statusTextAr: 'Ø§Ù„Ø¬ÙŠÙ… Ù…ØºÙ„Ù‚ â€” Ø±ÙƒØ² Ø¹Ù„Ù‰ Ø§Ù„ØªØºØ°ÙŠØ© ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø£Ù„ÙŠØ§Ù Ø§Ù„Ø¹Ø¶Ù„ÙŠØ©',
        statusTextEn: 'Gym is closed â€” prioritize nutrition & tissue regeneration',
      };
    }

    if (!activeSession) {
      return {
        nameAr: 'ÙŠÙˆÙ… Ø§Ø³ØªØ´ÙØ§Ø¡ Ù†Ø´Ø·',
        nameEn: 'Active Recovery Day',
        badge: isRTL ? 'Ø¥Ø·Ø§Ù„Ø© ÙˆØ±Ø§Ø­Ø©' : 'Mobility & Rest',
        statusTextAr: 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø© Ù…Ø¬Ø¯ÙˆÙ„Ø© Ù„Ù„ÙŠÙˆÙ… â€” Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ø¬Ø³Ù… Ù…Ù…ØªØ§Ø²Ø©',
        statusTextEn: 'No session planned today â€” physical readiness is high',
      };
    }

    const title = activeSession.title.toLowerCase();
    const exerciseText = (activeSession.exercises || []).map((item) => item.name.toLowerCase()).join(' ');
    const count = activeSession.exercises?.length || 0;

    if (title.includes('chest') || title.includes('push') || exerciseText.includes('bench') || exerciseText.includes('press')) {
      return {
        nameAr: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„ØµØ¯Ø± ÙˆØ§Ù„Ø¯ÙØ¹',
        nameEn: 'Chest & Push Muscles',
        badge: isRTL ? 'ØµØ¯Ø± / ØªØ±Ø§ÙŠØ³Ø¨Ø³' : 'Pectorals / Triceps',
        statusTextAr: `Ù…Ø³ØªÙ‡Ø¯Ù Ø§Ù„ÙŠÙˆÙ… Ø¹Ø¨Ø± ${count} ØªÙ…Ø§Ø±ÙŠÙ† Ù…ØªØ®ØµØµØ©`,
        statusTextEn: `Targeted today across ${count} dedicated exercises`,
      };
    }
    if (title.includes('back') || title.includes('pull') || exerciseText.includes('row') || exerciseText.includes('pull')) {
      return {
        nameAr: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø¸Ù‡Ø± ÙˆØ§Ù„Ø³Ø­Ø¨',
        nameEn: 'Back & Pull Muscles',
        badge: isRTL ? 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø¬Ù†Ø§Ø­' : 'Lats / Rhomboids',
        statusTextAr: `Ù…Ø³ØªÙ‡Ø¯Ù Ø§Ù„ÙŠÙˆÙ… Ø¹Ø¨Ø± ${count} ØªÙ…Ø§Ø±ÙŠÙ† Ù…ØªØ®ØµØµØ©`,
        statusTextEn: `Targeted today across ${count} dedicated exercises`,
      };
    }
    if (title.includes('leg') || exerciseText.includes('squat') || exerciseText.includes('leg')) {
      return {
        nameAr: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø£Ø±Ø¬Ù„ ÙˆØ§Ù„Ù‚ÙˆØ©',
        nameEn: 'Legs & Lower Body',
        badge: isRTL ? 'ÙØ®Ø° / Ø±Ø§Ø­Ø©' : 'Quads / Hamstrings',
        statusTextAr: `Ù…Ø³ØªÙ‡Ø¯Ù Ø§Ù„ÙŠÙˆÙ… Ø¹Ø¨Ø± ${count} ØªÙ…Ø§Ø±ÙŠÙ† Ù…ØªØ®ØµØµØ©`,
        statusTextEn: `Targeted today across ${count} dedicated exercises`,
      };
    }
    if (title.includes('shoulder') || exerciseText.includes('delt')) {
      return {
        nameAr: 'Ø§Ù„Ø£ÙƒØªØ§Ù ÙˆØ§Ù„Ù…Ø«Ù„Ø«Ø§Øª',
        nameEn: 'Shoulders & Deltoids',
        badge: isRTL ? 'Ù…Ø«Ù„Ø«Ø§Øª' : 'Deltoids',
        statusTextAr: `Ù…Ø³ØªÙ‡Ø¯Ù Ø§Ù„ÙŠÙˆÙ… Ø¹Ø¨Ø± ${count} ØªÙ…Ø§Ø±ÙŠÙ† Ù…ØªØ®ØµØµØ©`,
        statusTextEn: `Targeted today across ${count} dedicated exercises`,
      };
    }

    return {
      nameAr: activeSession.title,
      nameEn: activeSession.title,
      badge: `${activeSession.type}`,
      statusTextAr: `${count} ØªÙ…Ø§Ø±ÙŠÙ† Ù…Ø®Ø·Ø· Ù„Ù‡Ø§ Ø§Ù„ÙŠÙˆÙ…`,
      statusTextEn: `${count} exercises planned today`,
    };
  }, [activeSession, isFriday, isRTL]);

  const weekDays = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 6 });
    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = addDays(start, index);
      const hasWorkout =
        (history || []).some((record) => isSameDay(new Date(record.date), dayDate)) ||
        (sessions || []).some((session) => session.isCompleted && isSameDay(new Date(session.date), dayDate));
      return {
        key: dayDate.toISOString(),
        dayName: format(dayDate, 'EEE'),
        dayNumber: format(dayDate, 'd'),
        isCurrentDay: isSameDay(dayDate, now),
        dayIsFriday: dayDate.getDay() === 5,
        hasWorkout,
      };
    });
  }, [history, sessions]);

  const netCalories = todayCalories - todayBurnedCalories;
  const proteinPct = Math.min(100, Math.round((todayProtein / (dailyProteinTarget || 1)) * 100));
  const caloriePct = Math.min(100, Math.round((todayCalories / (dailyCaloriesTarget || 1)) * 100));

  const ringRows = useMemo(
    () => [
      { id: 'move' as const, tone: 'rose', labelAr: 'Ø­Ø±Ù‚ Ø§Ù„Ø³Ø¹Ø±Ø§Øª', labelEn: 'Move (kcal)', value: todayBurnedCalories, target: `${calorieBurnTarget} kcal`, progress: progress.move },
      { id: 'exercise' as const, tone: 'lime', labelAr: 'Ø§Ù„ØªÙ…Ø§Ø±ÙŠÙ†', labelEn: 'Exercise (min)', value: workoutMinutes, target: `${workoutMinutesTarget} min`, progress: progress.exercise },
      { id: 'water' as const, tone: 'cyan', labelAr: 'Ø§Ù„ØªØ±Ø·ÙŠØ¨', labelEn: 'Hydration (ml)', value: todayWater, target: `${waterGoal} ml`, progress: progress.water },
    ],
    [calorieBurnTarget, dailyCaloriesTarget, progress, todayBurnedCalories, todayWater, workoutMinutes, workoutMinutesTarget, waterGoal],
  );

  const weekSummary = useMemo(() => {
    const done = weekDays.filter((day) => day.hasWorkout).length;
    return isRTL
      ? `${done} Ø£ÙŠØ§Ù… ØªØ¯Ø±ÙŠØ¨ Ù…Ù† Ø£ØµÙ„ 7 ÙÙŠ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ø­Ø§Ù„ÙŠ.`
      : `${done} of 7 training days completed this week.`;
  }, [weekDays, isRTL]);

  const renderCardStates = (label: string) => {
    if (status === 'loading') return <WidgetSkeleton label={label} />;
    if (status === 'error') {
      return (
        <WidgetState
          tone="error"
          role="alert"
          title={isRTL ? 'ØªØ¹Ø°Ù‘Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª' : 'Could not load data'}
          description={errorMessage || (isRTL ? 'Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø£Ùˆ ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø§ØªØµØ§Ù„.' : 'Retry, or check your connection.')}
          action={
            onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {isRTL ? 'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©' : 'Retry'}
              </Button>
            )
          }
        />
      );
    }
    return null;
  };

  const isNothingLogged = !activeSession && streakDays === 0 && todayBurnedCalories === 0 && todayWater === 0;
  const cardState = status === 'ready' && isNothingLogged ? 'empty' : null;

  return (
    <div className="forma-bento-section">
      <div className="forma-bento-grid is-layered" role="group" aria-label={isRTL ? 'Ù…Ù„Ø®Øµ Ø§Ù„ÙŠÙˆÙ…' : 'Today at a glance'}>
        <article className="forma-bento-card" data-tier="secondary" data-span="2">
          <div className="forma-bento-card-body">
            <WidgetHeader
              as="div"
              flush
              icon={<Activity size={15} aria-hidden="true" />}
              iconColor="var(--accent-rose)"
              title={isRTL ? 'Ø­Ù„Ù‚Ø§Øª Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„ÙŠÙˆÙ…ÙŠ' : 'Daily Activity Rings'}
              trailing={
                allRingsClosed ? (
                  <span className="forma-badge" style={{ color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.32)' }}>
                    <Trophy size={12} aria-hidden="true" />
                    {isRTL ? 'Ù…ÙƒØªÙ…Ù„Ø© 100%' : '100% Closed'}
                  </span>
                ) : (
                  <span className="today-surface-date">{format(new Date(), 'EEEE')}</span>
                )
              }
            />

            {status !== 'ready' ? (
              renderCardStates(isRTL ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø­Ù„Ù‚Ø§Øª Ø§Ù„Ù†Ø´Ø§Ø·' : 'Loading activity rings')
            ) : cardState === 'empty' ? (
              <WidgetState
                title={isRTL ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙŠÙˆÙ… Ø¨Ø¹Ø¯' : 'Nothing logged today yet'}
                description={isRTL ? 'Ø§Ø¨Ø¯Ø£ ØªÙ…Ø±ÙŠÙ†Ùƒ Ø£Ùˆ Ø³Ø¬Ù‘Ù„ Ø§Ù„Ù…Ø§Ø¡ Ù„ØªØ¸Ù‡Ø± Ø§Ù„Ø­Ù„Ù‚Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø©.' : 'Start a workout or log water to fill the rings.'}
                action={
                  <Button variant="secondary" size="sm" onClick={onOpenQuickWorkout} leftIcon={<Zap size={14} />}>
                    {isRTL ? 'ØªÙ…Ø±ÙŠÙ† Ø³Ø±ÙŠØ¹' : 'Quick workout'}
                  </Button>
                }
              />
            ) : (
              <div className="today-bento-rings-layout">
                <div
                  className="today-bento-rings-visual"
                  role="img"
                  aria-label={ringSummary(isRTL, progress.move, progress.exercise, progress.water)}
                >
                  <svg viewBox="0 0 130 130" aria-hidden="true" focusable="false">
                    <defs>
                      <linearGradient id="bentoRingMove" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                      <linearGradient id="bentoRingExercise" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-lime)" />
                        <stop offset="100%" stopColor="var(--accent-emerald)" />
                      </linearGradient>
                      <linearGradient id="bentoRingWater" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-cyan)" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <g transform="rotate(-90 65 65)">
                      <circle cx="65" cy="65" r={RING_RADIUS.move} fill="none" stroke="var(--accent-rose)" strokeOpacity="0.16" strokeWidth="10" />
                      <circle cx="65" cy="65" r={RING_RADIUS.exercise} fill="none" stroke="var(--accent-lime)" strokeOpacity="0.16" strokeWidth="9" />
                      <circle cx="65" cy="65" r={RING_RADIUS.water} fill="none" stroke="var(--accent-cyan)" strokeOpacity="0.16" strokeWidth="8" />

                      {ringRows.map((row, index) => {
                        const circumference = 2 * Math.PI * RING_RADIUS[row.id];
                        const offset = circumference * (1 - row.progress);
                        const stroke = row.id === 'move' ? 'url(#bentoRingMove)' : row.id === 'exercise' ? 'url(#bentoRingExercise)' : 'url(#bentoRingWater)';
                        const common = {
                          cx: 65,
                          cy: 65,
                          r: RING_RADIUS[row.id],
                          fill: 'none',
                          stroke,
                          strokeWidth: 10 - index,
                          strokeLinecap: 'round' as const,
                          strokeDasharray: circumference,
                          strokeDashoffset: offset,
                          style: {
                            filter: activeRing === row.id ? `drop-shadow(0 0 6px var(--accent-${row.tone === 'rose' ? 'rose' : row.tone}))` : 'none',
                            transition: reduceMotion ? 'none' : 'filter 0.18s ease',
                          },
                        };
                        return reduceMotion ? (
                          <circle key={row.id} {...common} />
                        ) : (
                          <motion.circle
                            key={row.id}
                            {...common}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 0.9, delay: index * 0.1, ease: 'easeOut' }}
                          />
                        );
                      })}
                    </g>
                  </svg>
                  <span className="today-bento-rings-center tabular-nums" aria-hidden="true">
                    {Math.round(progress.move * 100)}%
                  </span>
                </div>

                <ul className="today-bento-legend">
                  {ringRows.map((row) => (
                    <li
                      key={row.id}
                      className="today-bento-legend-row"
                      data-active={activeRing === row.id ? 'true' : 'false'}
                      data-tone={row.tone}
                      onMouseEnter={() => setActiveRing(row.id)}
                      onMouseLeave={() => setActiveRing(null)}
                    >
                      <span className="today-bento-legend-label">
                        <span className="today-bento-legend-dot" aria-hidden="true" />
                        {isRTL ? row.labelAr : row.labelEn}
                      </span>
                      <span className="today-bento-legend-value tabular-nums" dir="ltr">
                        {row.value}
                        <small> / {row.target}</small>
                      </span>
                    </li>
                  ))}
                </ul>

                <table className="forma-sr-only">
                  <caption>{isRTL ? 'ØªÙØ§ØµÙŠÙ„ Ø­Ù„Ù‚Ø§Øª Ø§Ù„Ù†Ø´Ø§Ø·' : 'Activity ring breakdown'}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{isRTL ? 'Ø§Ù„Ù…Ø¤Ø´Ø±' : 'Metric'}</th>
                      <th scope="col">{isRTL ? 'Ø§Ù„Ù‚ÙŠÙ…Ø©' : 'Value'}</th>
                      <th scope="col">{isRTL ? 'Ø§Ù„Ù‡Ø¯Ù' : 'Goal'}</th>
                      <th scope="col">{isRTL ? 'Ø§Ù„Ù†Ø³Ø¨Ø©' : 'Progress'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringRows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{isRTL ? row.labelAr : row.labelEn}</th>
                        <td>{row.value}</td>
                        <td>{row.target}</td>
                        <td>{Math.round(row.progress * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>

        <article className="forma-bento-card" data-tier="secondary" data-span="2">
          <div className="forma-bento-card-body">
            <WidgetHeader
              as="div"
              flush
              icon={<Zap size={15} aria-hidden="true" />}
              iconColor="var(--accent-emerald)"
              title={isRTL ? 'ØªÙˆØ§Ø²Ù† Ø§Ù„Ø·Ø§Ù‚Ø© ÙˆØ§Ù„Ø¨Ø±ÙˆØªÙŠÙ†' : 'Energy & Protein Balance'}
              trailing={
                <span
                  className="forma-badge"
                  style={
                    netCalories <= dailyCaloriesTarget
                      ? { color: 'var(--color-success)', background: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.32)' }
                      : { color: 'var(--color-warning)', background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.32)' }
                  }
                >
                  {netCalories <= dailyCaloriesTarget ? (isRTL ? 'ÙÙŠ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù‡Ø¯Ù' : 'On track') : (isRTL ? 'ÙØ§Ø¦Ø¶ Ø³Ø¹Ø±Ø§Øª' : 'Surplus')}
                </span>
              }
            />

            {status !== 'ready' ? (
              renderCardStates(isRTL ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ ØªÙˆØ§Ø²Ù† Ø§Ù„Ø·Ø§Ù‚Ø©' : 'Loading energy balance')
            ) : (
              <>
                <div className="today-bento-fuel-grid">
                  <div className="today-bento-metric">
                    <span className="today-bento-metric-label">{isRTL ? 'Ø§Ù„Ø³Ø¹Ø±Ø§Øª' : 'Calories'}</span>
                    <strong className="today-bento-metric-value tabular-nums" dir="ltr">
                      {todayCalories}
                      <small> / {dailyCaloriesTarget}</small>
                    </strong>
                    <div className="today-progress-track" role="img" aria-label={`${isRTL ? 'Ø§Ù„Ø³Ø¹Ø±Ø§Øª' : 'Calories'}: ${caloriePct}%`}>
                      <span style={{ width: `${caloriePct}%`, background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))' }} />
                    </div>
                  </div>
                  <div className="today-bento-metric">
                    <span className="today-bento-metric-label">{isRTL ? 'Ø§Ù„Ø¨Ø±ÙˆØªÙŠÙ†' : 'Protein'}</span>
                    <strong className="today-bento-metric-value tabular-nums" dir="ltr">
                      {todayProtein}
                      <small> / {dailyProteinTarget} g</small>
                    </strong>
                    <div className="today-progress-track" role="img" aria-label={`${isRTL ? 'Ø§Ù„Ø¨Ø±ÙˆØªÙŠÙ†' : 'Protein'}: ${proteinPct}%`}>
                      <span style={{ width: `${proteinPct}%`, background: 'linear-gradient(90deg, var(--accent-emerald), #059669)' }} />
                    </div>
                  </div>
                </div>

                <div className="today-bento-quick-actions" role="group" aria-label={isRTL ? 'Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø³Ø±ÙŠØ¹Ø©' : 'Quick actions'}>
                  <button
                    type="button"
                    className="forma-quick-tile is-cyan"
                    onClick={() => {
                      gymAudio.triggerVibration([15]);
                      onLogWater(250);
                    }}
                  >
                    <Droplet size={15} aria-hidden="true" />
                    <span>{isRTL ? 'Ù…Ø§Ø¡ +250 Ù…Ù„' : '+250 ml water'}</span>
                  </button>
                  <button type="button" className="forma-quick-tile is-emerald" onClick={onNavigateNutrition}>
                    <Camera size={15} aria-hidden="true" />
                    <span>{isRTL ? 'Ù…Ø³Ø­ ÙˆØ¬Ø¨Ø©' : 'Scan meal'}</span>
                  </button>
                  <button type="button" className="forma-quick-tile is-lime" onClick={onOpenQuickWorkout}>
                    <Zap size={15} aria-hidden="true" />
                    <span>{isRTL ? 'ØªÙ…Ø±ÙŠÙ† Ø­Ø±' : 'Quick workout'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </article>

        <article className="forma-bento-card" data-tier="tertiary">
          <div className="forma-bento-card-body">
            <WidgetHeader
              as="div"
              flush
              icon={<Dumbbell size={15} aria-hidden="true" />}
              iconColor="var(--accent-lime)"
              title={isRTL ? 'Ø§Ù„Ø¹Ø¶Ù„Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ø¯ÙØ©' : 'Target focus'}
              trailing={
                <span
                  className="forma-badge"
                  style={{ color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.14)', borderColor: 'rgba(56,189,248,0.32)' }}
                >
                  <ShieldCheck size={12} aria-hidden="true" />
                  <span className="tabular-nums">{isRTL ? `Ø¬Ø§Ù‡Ø²ÙŠØ© ${recoveryScore}%` : `${recoveryScore}% ready`}</span>
                </span>
              }
            />

            {status !== 'ready' ? (
              renderCardStates(isRTL ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¹Ø¶Ù„Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ø¯ÙØ©' : 'Loading focus muscle')
            ) : (
              <>
                <p className="today-bento-focus-name">{isRTL ? focusMuscle.nameAr : focusMuscle.nameEn}</p>
                <p className="today-bento-focus-body">{isRTL ? focusMuscle.statusTextAr : focusMuscle.statusTextEn}</p>
                <div className="forma-bento-card-footer">
                  <span className="forma-chip">{focusMuscle.badge}</span>
                  <button
                    type="button"
                    className="forma-quiet-button"
                    onClick={() => {
                      gymAudio.triggerSubtleHaptic([15]);
                      onScrollToHologram();
                    }}
                  >
                    <span>{isRTL ? 'Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø¹Ø¶Ù„Ø§Øª' : 'Muscle map'}</span>
                    <ArrowUpRight size={14} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </article>

        <article className="forma-bento-card" data-tier="tertiary">
          <div className="forma-bento-card-body">
            <WidgetHeader
              as="div"
              flush
              icon={<Flame size={15} aria-hidden="true" />}
              iconColor="var(--accent-amber)"
              title={isRTL ? 'Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ' : 'Weekly consistency'}
              trailing={
                <span className="forma-badge is-amber">
                  <Flame size={12} aria-hidden="true" />
                  <span className="tabular-nums">{streakDays}</span>
                  <span>{isRTL ? 'ÙŠÙˆÙ…' : 'd'}</span>
                </span>
              }
            />

            {status !== 'ready' ? (
              renderCardStates(isRTL ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø³Ø¬Ù„ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…' : 'Loading streak')
            ) : (
              <>
                <p className="today-bento-focus-body">
                  {streakDays > 0
                    ? isRTL
                      ? 'Ø£Ø¯Ø§Ø¡ Ø±Ø§Ø¦Ø¹! Ø­Ø§ÙØ¸ Ø¹Ù„Ù‰ Ø§Ù„Ø²Ø®Ù… ÙˆØ³Ù„Ø³Ù„Ø© Ø§Ù„ØªÙ…Ø§Ø±ÙŠÙ†.'
                      : 'Crushing it. Keep the training momentum going.'
                    : isRTL
                      ? 'Ø§Ø¨Ø¯Ø£ Ø¬Ù„Ø³ØªÙƒ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ÙŠØ© Ø§Ù„ÙŠÙˆÙ… Ù„Ø¨Ø¯Ø¡ Ø³Ù„Ø³Ù„ØªÙƒ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.'
                      : 'Start todayâ€™s session to ignite a new streak.'}
                </p>
                <ol className="today-week-strip" aria-label={isRTL ? 'Ø£ÙŠØ§Ù… Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹' : 'Days of the week'}>
                  {weekDays.map((day) => (
                    <li key={day.key} className="today-week-day" data-state={day.hasWorkout ? 'done' : day.dayIsFriday ? 'rest' : day.isCurrentDay ? 'today' : 'idle'}>
                      <span className="today-week-day-name">{day.dayName}</span>
                      <span className="today-week-day-marker">
                        {day.hasWorkout ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : day.dayIsFriday ? (
                          <Moon size={12} aria-hidden="true" />
                        ) : (
                          <span className="tabular-nums">{day.dayNumber}</span>
                        )}
                      </span>
                      <span className="forma-sr-only">
                        {day.hasWorkout
                          ? isRTL ? ' ØªÙ… Ø§Ù„ØªØ¯Ø±ÙŠØ¨' : ' completed'
                          : day.dayIsFriday
                            ? isRTL ? ' Ø¹Ø·Ù„Ø©' : ' rest day'
                            : isRTL ? ' Ù„Ù… ÙŠØªÙ… Ø§Ù„ØªØ¯Ø±ÙŠØ¨' : ' not trained'}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="forma-sr-only">{weekSummary}</p>
                <div className="forma-bento-card-footer">
                  <span className="today-bento-footnote">{isRTL ? 'Ø§Ù„Ø¬Ù…Ø¹Ø© Ø¹Ø·Ù„Ø© Ø§Ø³ØªØ´ÙØ§Ø¡' : 'Friday is a recovery day'}</span>
                  <button type="button" className="forma-quiet-button" onClick={onNavigatePlan}>
                    <span>{isRTL ? 'Ø§Ù„Ø¬Ø¯ÙˆÙ„ Ø§Ù„ÙƒØ§Ù…Ù„' : 'Full schedule'}</span>
                    <ArrowUpRight size={14} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default TodayBentoGrid;
