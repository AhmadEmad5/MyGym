import { useMemo, useRef } from 'react';
import { Droplets, RotateCcw } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import { useAnimationActive, useFormaReducedMotion, WidgetFrame } from './TodayBentoGrid';

interface InteractiveHydrationWaveCardProps {
  todayWater: number;
  waterGoal: number;
  onLogWater: (amount: number) => void;
  onResetWater: () => void;
  status?: 'ready' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

const WAVE_SPAN = 240;

const quickCups = [
  { amount: 250, label: '+250ml', icon: '🥛' },
  { amount: 500, label: '+500ml', icon: '🧴' },
  { amount: 1000, label: '+1L', icon: '🫗' },
];

export function InteractiveHydrationWaveCard({
  todayWater,
  waterGoal,
  onLogWater,
  onResetWater,
  status = 'ready',
  errorMessage,
  onRetry,
}: InteractiveHydrationWaveCardProps) {
  const { isRTL } = useTranslation();
  const reduceMotion = useFormaReducedMotion();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const animating = useAnimationActive(frameRef);

  const waterPct = useMemo(() => {
    if (waterGoal <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((todayWater / waterGoal) * 100)));
  }, [todayWater, waterGoal]);

  const remaining = Math.max(0, waterGoal - todayWater);
  const isComplete = waterPct >= 100;

  const handleAdd = (amount: number) => {
    gymAudio.triggerSubtleHaptic([30, 45]);
    onLogWater(amount);
    if (todayWater + amount >= waterGoal && todayWater < waterGoal) {
      gymAudio.playCelebrationFanfare();
    }
  };

  const handleReset = () => {
    if (window.confirm(isRTL ? 'هل تريد تصفير عداد الماء لليوم؟' : 'Reset today\'s hydration log?')) {
      gymAudio.triggerSubtleHaptic([20]);
      onResetWater();
    }
  };

  const pauseAnimation = reduceMotion || !animating;

  return (
    <WidgetFrame
      title={isRTL ? 'وعاء الترطيب' : 'Hydration chamber'}
      icon={<Droplets size={15} aria-hidden="true" />}
      tone="cyan"
      className="today-hydration-widget"
      trailing={
        <>
          <span
            className="forma-badge"
            style={
              isComplete
                ? { color: 'var(--color-success)', background: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.34)' }
                : { color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.14)', borderColor: 'rgba(56,189,248,0.32)' }
            }
          >
            <span className="tabular-nums">{waterPct}%</span>
            {isComplete && <span aria-hidden="true">✓</span>}
            <span>{isRTL ? 'مكتمل' : 'Goal'}</span>
          </span>
          <button
            type="button"
            className="forma-quiet-button"
            onClick={handleReset}
            title={isRTL ? 'تصفير' : 'Reset'}
            aria-label={isRTL ? 'تصفير عداد الترطيب لليوم' : 'Reset today’s hydration log'}
            style={{ minHeight: '2rem', padding: '0.25rem 0.5rem' }}
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </>
      }
    >
      <div
        className="today-hydration-layout"
        ref={frameRef}
        data-motion-paused={pauseAnimation ? 'true' : 'false'}
      >
        <div
          className="today-hydration-flask"
          role="img"
          aria-label={
            isRTL
              ? `مستوى الترطيب ${waterPct} بالمئة من ${waterGoal} مل.`
              : `Hydration level ${waterPct} percent of ${waterGoal} millilitres.`
          }
        >
          <span className="today-hydration-tick" style={{ insetBlockStart: '25%' }} aria-hidden="true" />
          <span className="today-hydration-tick is-major" style={{ insetBlockStart: '50%' }} aria-hidden="true" />
          <span className="today-hydration-tick" style={{ insetBlockStart: '75%' }} aria-hidden="true" />

          <div className="today-hydration-liquid" style={{ blockSize: `${Math.max(6, waterPct)}%` }}>
            <svg
              className="today-hydration-wave"
              viewBox={`0 0 ${WAVE_SPAN} 28`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d={`M -120,14 C -90,5 -60,23 -30,14 C 0,5 30,23 60,14 C 90,5 120,23 150,14 C 180,5 210,23 240,14 C 270,5 300,23 330,14 L 360,28 L -120,28 Z`}
                fill="var(--accent-cyan)"
                fillOpacity="0.85"
              />
            </svg>
            <span className="today-hydration-bubble bubble-a" aria-hidden="true" />
            <span className="today-hydration-bubble bubble-b" aria-hidden="true" />
          </div>

          <span className="today-hydration-flask-value tabular-nums" aria-hidden="true">
            {waterPct}%
          </span>
        </div>

        <div className="today-hydration-metrics">
          <p className="today-hydration-amount tabular-nums" dir="ltr">
            {todayWater.toLocaleString()}
            <small> / {waterGoal.toLocaleString()} ml</small>
          </p>
          <p className="today-hydration-note">
            {isComplete
              ? isRTL ? 'أحسنت! حققت هدف الترطيب اليومي.' : 'Hydration target reached.'
              : isRTL
                ? `المتبقي للوصول للهدف: ${remaining} مل`
                : `${remaining.toLocaleString()} ml to go today.`}
          </p>

          <div className="today-hydration-cups" role="group" aria-label={isRTL ? 'أكواب سريعة' : 'Quick add'}>
            {quickCups.map((cup) => (
              <button key={cup.amount} type="button" className="forma-quick-tile is-cyan" onClick={() => handleAdd(cup.amount)}>
                <span aria-hidden="true">{cup.icon}</span>
                <span className="tabular-nums">{cup.label}</span>
                <span className="forma-sr-only">
                  {isRTL ? ` أضف ${cup.amount} مل` : ` Add ${cup.amount} millilitres`}
                </span>
              </button>
            ))}
          </div>
        </div>

        <table className="forma-sr-only">
          <caption>{isRTL ? 'ملخص الترطيب' : 'Hydration summary'}</caption>
          <tbody>
            <tr>
              <th scope="row">{isRTL ? 'المسجّل' : 'Logged'}</th>
              <td>{todayWater} ml</td>
            </tr>
            <tr>
              <th scope="row">{isRTL ? 'الهدف' : 'Goal'}</th>
              <td>{waterGoal} ml</td>
            </tr>
            <tr>
              <th scope="row">{isRTL ? 'المتبقي' : 'Remaining'}</th>
              <td>{remaining} ml</td>
            </tr>
          </tbody>
        </table>
      </div>

      {status === 'error' && errorMessage && (
        <p className="today-widget-error" role="alert">
          {errorMessage}
          {onRetry && (
            <button type="button" className="forma-quiet-button" onClick={onRetry}>
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </button>
          )}
        </p>
      )}
    </WidgetFrame>
  );
}
