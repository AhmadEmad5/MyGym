import { useMemo, useState } from 'react';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import { Flame } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import type { HistoryRecord, WorkoutSession } from '../lib/api';
import { WidgetFrame, WidgetSkeleton, WidgetState } from './TodayBentoGrid';

interface WeeklyProgressChartProps {
  history: HistoryRecord[];
  sessions: WorkoutSession[];
  status?: 'loading' | 'ready' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

interface DayPoint {
  key: string;
  date: Date;
  dayNameShort: string;
  dayNumber: string;
  isToday: boolean;
  isCompleted: boolean;
  duration: number;
  calories: number;
  volumeKg: number;
}

const CHART_HEIGHT = 120;
const CHART_WIDTH = 320;
const BAR_WIDTH = 26;
const MIN_VISIBLE_BAR = 8;

export function WeeklyProgressChart({ history, sessions, status = 'ready', errorMessage, onRetry }: WeeklyProgressChartProps) {
  const { t, formatDate, isRTL } = useTranslation();
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  const weekData = useMemo<DayPoint[]>(() => {
    const today = startOfDay(new Date());
    const days: DayPoint[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const dayDate = subDays(today, i);
      const dayHistory = (history || []).filter((h) => isSameDay(new Date(h.date), dayDate));
      const daySessions = (sessions || []).filter((s) => isSameDay(new Date(s.date), dayDate) && s.isCompleted);

      const isCompleted = dayHistory.length > 0 || daySessions.length > 0;
      const historyMinutes = dayHistory.reduce((acc, h) => acc + (h.snapshot?.duration || 30), 0);
      const sessionMinutes = daySessions.reduce((acc, s) => acc + (s.duration || 30), 0);
      const duration = Math.max(historyMinutes, sessionMinutes);
      const calories = dayHistory.reduce((acc, h) => acc + (h.burnedCalories || 0), 0) || (isCompleted ? duration * 7.5 : 0);

      let volumeKg = 0;
      const allExercises = [
        ...dayHistory.flatMap((h) => h.snapshot?.exercises || []),
        ...daySessions.flatMap((s) => s.exercises || []),
      ];
      allExercises.forEach((exercise) => {
        exercise.sets?.forEach((set) => {
          if (set.isCompleted || set.weight > 0) {
            const weightKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
            const reps = set.repsActual || set.repsTarget || 0;
            volumeKg += Math.round(weightKg * reps);
          }
        });
      });

      days.push({
        key: dayDate.toISOString(),
        date: dayDate,
        dayNameShort: formatDate(dayDate, 'EEE'),
        dayNumber: format(dayDate, 'd'),
        isToday: i === 0,
        isCompleted,
        duration: Math.round(duration),
        calories: Math.round(calories),
        volumeKg: Math.round(volumeKg),
      });
    }

    return days;
  }, [history, sessions, formatDate]);

  const streak = useMemo(() => {
    let count = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < 30; i += 1) {
      const checkDate = subDays(today, i);
      const hasWorkout =
        (history || []).some((h) => isSameDay(new Date(h.date), checkDate)) ||
        (sessions || []).some((s) => s.isCompleted && isSameDay(new Date(s.date), checkDate));
      if (hasWorkout) count += 1;
      else if (i !== 0) break;
    }
    return count;
  }, [history, sessions]);

  const totals = useMemo(
    () =>
      weekData.reduce(
        (acc, day) => ({
          completedDays: acc.completedDays + (day.isCompleted ? 1 : 0),
          duration: acc.duration + day.duration,
          calories: acc.calories + day.calories,
          volumeKg: acc.volumeKg + day.volumeKg,
        }),
        { completedDays: 0, duration: 0, calories: 0, volumeKg: 0 },
      ),
    [weekData],
  );

  const maxDuration = Math.max(...weekData.map((day) => day.duration), 60);
  const isEmpty = totals.completedDays === 0;

  const summary = isRTL
    ? `الأداء خلال 7 أيام: ${totals.completedDays} أيام تدريب، ${totals.duration} دقيقة، ${totals.calories} سعرة. السلسلة ${streak} يوم.`
    : `Seven day performance: ${totals.completedDays} training days, ${totals.duration} minutes, ${totals.calories} calories. Streak ${streak} days.`;

  const statChips = [
    { label: isRTL ? 'التمارين' : 'Sessions', value: `${totals.completedDays} / 7`, tone: 'var(--accent-cyan)' },
    { label: isRTL ? 'الوقت الإجمالي' : 'Total time', value: `${totals.duration} ${t('min')}`, tone: 'var(--accent-purple)' },
    { label: isRTL ? 'السعرات' : 'Calories', value: `${totals.calories} kcal`, tone: 'var(--accent-rose)' },
    ...(totals.volumeKg > 0
      ? [{ label: isRTL ? 'إجمالي الحجم' : 'Total volume', value: totals.volumeKg > 1000 ? `${(totals.volumeKg / 1000).toFixed(1)}t` : `${totals.volumeKg}kg`, tone: 'var(--accent-emerald)' }]
      : []),
  ];

  return (
    <WidgetFrame
      title={isRTL ? 'النشاط الأسبوعي والاستمرارية' : 'Weekly activity & streak'}
      icon={<Flame size={15} aria-hidden="true" />}
      tone="rose"
      trailing={
        <span
          className="forma-badge"
          style={
            streak > 0
              ? { color: 'var(--color-warning)', background: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.34)' }
              : undefined
          }
        >
          <Flame size={12} aria-hidden="true" />
          <span className="tabular-nums">{streak}</span>
          <span>{isRTL ? 'أيام' : 'day streak'}</span>
        </span>
      }
    >
      {status === 'loading' ? (
        <WidgetSkeleton rows={4} label={isRTL ? 'جارٍ تحميل الأداء الأسبوعي' : 'Loading weekly performance'} />
      ) : status === 'error' ? (
        <WidgetState
          tone="error"
          role="alert"
          title={isRTL ? 'تعذّر تحميل الأداء الأسبوعي' : 'Could not load weekly performance'}
          description={errorMessage || (isRTL ? 'أعد المحاولة أو تحقق من الاتصال.' : 'Retry, or check your connection.')}
          action={
            onRetry && (
              <button type="button" className="forma-quiet-button" onClick={onRetry}>
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </button>
            )
          }
        />
      ) : isEmpty ? (
        <WidgetState
          title={isRTL ? 'لا يوجد تدريب هذا الأسبوع' : 'No training logged this week'}
          description={isRTL ? 'أكمل أول جلسة لتظهر أعمدة الأداء هنا.' : 'Complete your first session and the weekly bars will appear here.'}
        />
      ) : (
        <>
          <div className="today-week-stats">
            {statChips.map((chip) => (
              <div key={chip.label} className="today-week-stat">
                <span>{chip.label}</span>
                <strong className="tabular-nums" style={{ color: chip.tone }}>
                  {chip.value}
                </strong>
              </div>
            ))}
          </div>

          <div className="today-week-chart" role="img" aria-label={summary}>
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <line x1="0" y1={CHART_HEIGHT - 1} x2={CHART_WIDTH} y2={CHART_HEIGHT - 1} stroke="var(--border-card)" strokeWidth="1" />
              {weekData.map((day, index) => {
                const slot = CHART_WIDTH / weekData.length;
                const barHeight = day.isCompleted
                  ? Math.max(MIN_VISIBLE_BAR, (day.duration / maxDuration) * (CHART_HEIGHT - 12))
                  : MIN_VISIBLE_BAR;
                const x = index * slot + (slot - BAR_WIDTH) / 2;
                const fill = day.isToday ? 'var(--accent-cyan)' : day.isCompleted ? 'var(--accent-emerald)' : 'var(--border-card)';
                return (
                  <rect
                    key={day.key}
                    x={x}
                    y={CHART_HEIGHT - 1 - barHeight}
                    width={BAR_WIDTH}
                    height={barHeight}
                    rx="6"
                    fill={fill}
                    fillOpacity={day.isCompleted || day.isToday ? 0.9 : 1}
                  />
                );
              })}
            </svg>
            <ul className="today-week-chart-axis">
              {weekData.map((day, index) => {
                const selected = activeDayIndex === index;
                return (
                  <li key={day.key}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setActiveDayIndex(selected ? null : index)}
                      className="today-week-axis-button"
                      data-today={day.isToday ? 'true' : 'false'}
                      data-empty={day.isCompleted ? 'false' : 'true'}
                    >
                      <span className="tabular-nums">{day.dayNumber}</span>
                      <span className="forma-sr-only">
                        {day.dayNameShort} —{' '}
                        {day.isCompleted
                          ? isRTL ? `${day.duration} دقيقة، ${day.calories} سعرة` : `${day.duration} min, ${day.calories} kcal`
                          : isRTL ? 'يوم راحة' : 'rest day'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {activeDayIndex !== null && weekData[activeDayIndex] && (
            <p className="today-week-tooltip" role="status">
              {weekData[activeDayIndex].dayNameShort} {weekData[activeDayIndex].dayNumber} ·{' '}
              {weekData[activeDayIndex].isCompleted
                ? `${weekData[activeDayIndex].duration} ${t('min')} · ${weekData[activeDayIndex].calories} kcal`
                : isRTL ? 'يوم راحة' : 'Rest day'}
            </p>
          )}

          <table className="forma-sr-only">
            <caption>{isRTL ? 'تفاصيل الأيام السبعة' : 'Seven day detail'}</caption>
            <thead>
              <tr>
                <th scope="col">{isRTL ? 'اليوم' : 'Day'}</th>
                <th scope="col">{isRTL ? 'الحالة' : 'Status'}</th>
                <th scope="col">{t('min')}</th>
                <th scope="col">kcal</th>
                <th scope="col">{isRTL ? 'الحجم' : 'Volume'}</th>
              </tr>
            </thead>
            <tbody>
              {weekData.map((day) => (
                <tr key={day.key}>
                  <th scope="row">
                    {day.dayNameShort} {day.dayNumber}
                  </th>
                  <td>{day.isCompleted ? (isRTL ? 'مكتمل' : 'Completed') : isRTL ? 'راحة' : 'Rest'}</td>
                  <td>{day.duration}</td>
                  <td>{day.calories}</td>
                  <td>{day.volumeKg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </WidgetFrame>
  );
}
