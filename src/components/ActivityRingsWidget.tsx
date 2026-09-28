import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Trophy } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { useFormaReducedMotion, WidgetFrame, WidgetSkeleton, WidgetState } from './TodayBentoGrid';

interface ActivityRingsProps {
  burnedCalories: number;
  calorieGoal?: number;
  activeMinutes: number;
  minuteGoal?: number;
  waterMl: number;
  waterGoal?: number;
  status?: 'loading' | 'ready' | 'empty' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

const RING_SPECS = [
  { id: 'move', radius: 52, width: 10, from: 'var(--accent-amber)', to: 'var(--color-danger)' },
  { id: 'exercise', radius: 39, width: 9, from: 'var(--accent-lime)', to: 'var(--accent-emerald)' },
  { id: 'water', radius: 26, width: 8, from: 'var(--accent-cyan)', to: '#06b6d4' },
] as const;

const clampPercent = (value: number, goal: number) =>
  goal > 0 ? Math.min(100, Math.max(0, Math.round((value / goal) * 100))) : 0;

export function ActivityRingsWidget({
  burnedCalories,
  calorieGoal = 500,
  activeMinutes,
  minuteGoal = 45,
  waterMl,
  waterGoal = 2500,
  status = 'ready',
  errorMessage,
  onRetry,
}: ActivityRingsProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();

  const rows = useMemo(
    () => [
      {
        id: 'move' as const,
        labelAr: 'حرق السعرات',
        labelEn: 'Move calories',
        value: burnedCalories,
        target: `${calorieGoal} kcal`,
        percent: clampPercent(burnedCalories, calorieGoal),
      },
      {
        id: 'exercise' as const,
        labelAr: 'وقت التمرين',
        labelEn: 'Exercise time',
        value: activeMinutes,
        target: `${minuteGoal} min`,
        percent: clampPercent(activeMinutes, minuteGoal),
      },
      {
        id: 'water' as const,
        labelAr: 'الترطيب',
        labelEn: 'Hydration',
        value: waterMl,
        target: `${waterGoal} ml`,
        percent: clampPercent(waterMl, waterGoal),
      },
    ],
    [activeMinutes, burnedCalories, calorieGoal, minuteGoal, waterGoal, waterMl],
  );

  const totalScore = Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length);
  const isComplete = totalScore >= 100;
  const isEmpty = rows.every((row) => row.percent === 0);

  const summary = isRTL
    ? `حلقات النشاط: ${rows.map((row) => `${row.labelAr} ${row.percent} بالمئة`).join('، ')}. الدرجة ${totalScore}.`
    : `Activity rings: ${rows.map((row) => `${row.labelEn} ${row.percent} percent`).join(', ')}. Overall score ${totalScore}.`;

  return (
    <WidgetFrame
      title={isRTL ? 'حلقات النشاط اليومي' : 'Daily Activity Rings'}
      icon={<Sparkles size={15} aria-hidden="true" />}
      tone="lime"
      trailing={
        <span
          className="forma-badge"
          style={
            isComplete
              ? { color: 'var(--color-success)', background: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.34)' }
              : undefined
          }
        >
          <span className="tabular-nums">{totalScore}%</span>
          <span>{isRTL ? 'إنجاز' : 'Score'}</span>
        </span>
      }
    >
      {status === 'loading' ? (
        <WidgetSkeleton circular label={isRTL ? 'جارٍ تحميل حلقات النشاط' : 'Loading activity rings'} />
      ) : status === 'error' ? (
        <WidgetState
          tone="error"
          role="alert"
          title={isRTL ? 'تعذّر تحميل الحلقات' : 'Could not load the rings'}
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
          title={isRTL ? 'لا توجد بيانات اليوم بعد' : 'Nothing logged today yet'}
          description={isRTL ? 'ابدأ تمرينك أو سجّل الماء لتظهر الحلقات.' : 'Start a workout or log water to fill the rings.'}
        />
      ) : (
        <div className="today-bento-rings-layout">
          <div className="today-bento-rings-visual" role="img" aria-label={summary}>
            <svg viewBox="0 0 130 130" aria-hidden="true" focusable="false">
              <defs>
                {RING_SPECS.map((ring) => (
                  <linearGradient key={ring.id} id={`activityRing-${ring.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={ring.from} />
                    <stop offset="100%" stopColor={ring.to} />
                  </linearGradient>
                ))}
              </defs>
              <g transform="rotate(-90 65 65)">
                {RING_SPECS.map((ring) => (
                  <circle
                    key={`${ring.id}-track`}
                    cx="65"
                    cy="65"
                    r={ring.radius}
                    fill="none"
                    stroke={ring.from}
                    strokeOpacity="0.14"
                    strokeWidth={ring.width}
                  />
                ))}
                {RING_SPECS.map((ring, index) => {
                  const row = rows.find((item) => item.id === ring.id);
                  const percent = row ? row.percent / 100 : 0;
                  const circumference = 2 * Math.PI * ring.radius;
                  const common = {
                    cx: 65,
                    cy: 65,
                    r: ring.radius,
                    fill: 'none' as const,
                    stroke: `url(#activityRing-${ring.id})`,
                    strokeWidth: ring.width,
                    strokeLinecap: 'round' as const,
                    strokeDasharray: circumference,
                    strokeDashoffset: circumference * (1 - percent),
                  };
                  return reduceMotion ? (
                    <circle key={ring.id} {...common} />
                  ) : (
                    <motion.circle
                      key={ring.id}
                      {...common}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: circumference * (1 - percent) }}
                      transition={{ duration: 0.9, delay: index * 0.1, ease: 'easeOut' }}
                    />
                  );
                })}
              </g>
            </svg>
            <span className="today-bento-rings-center" aria-hidden="true">
              {isComplete ? <Trophy size={18} /> : <Flame size={18} />}
            </span>
          </div>

          <ul className="today-bento-legend">
            {rows.map((row) => (
              <li key={row.id} className="today-bento-legend-row" data-tone={row.id === 'move' ? 'rose' : row.id === 'exercise' ? 'lime' : 'cyan'}>
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
            <caption>{isRTL ? 'تفاصيل حلقات النشاط' : 'Activity ring breakdown'}</caption>
            <thead>
              <tr>
                <th scope="col">{isRTL ? 'المؤشر' : 'Metric'}</th>
                <th scope="col">{isRTL ? 'القيمة' : 'Value'}</th>
                <th scope="col">{isRTL ? 'الهدف' : 'Goal'}</th>
                <th scope="col">{isRTL ? 'النسبة' : 'Progress'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{isRTL ? row.labelAr : row.labelEn}</th>
                  <td>{row.value}</td>
                  <td>{row.target}</td>
                  <td>{row.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  );
}
