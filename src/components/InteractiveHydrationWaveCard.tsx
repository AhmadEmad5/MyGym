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

/* Four pre-drawn sine bands make up the water surface.
   Each band is static; only its transform changes, so the whole loop stays on the
   compositor. Every `<svg>` is rendered at 200% of the flask and centred, and its
   viewBox holds N whole wavelengths, so the flask always shows N/2 of them and a
   `translate3d(-1/N)` travels exactly one wavelength. The pattern therefore lands
   on itself every cycle and the seam is invisible. */
const waveLayers = [
  {
    id: 'swell',
    viewBox: '0 0 600 26',
    d: 'M 0,7 C 30,7 90,19 120,19 C 150,19 210,7 240,7 C 270,7 330,19 360,19 C 390,19 450,7 480,7 C 510,7 570,19 600,19 L 600,26 L 0,26 Z',
  },
  {
    id: 'ripple',
    viewBox: '0 0 576 26',
    d: 'M 0,8.5 C 24,8.5 72,17.5 96,17.5 C 120,17.5 168,8.5 192,8.5 C 216,8.5 264,17.5 288,17.5 C 312,17.5 360,8.5 384,8.5 C 408,8.5 456,17.5 480,17.5 C 504,17.5 552,8.5 576,8.5 L 576,26 L 0,26 Z',
  },
  {
    id: 'crest',
    viewBox: '0 0 576 26',
    d: 'M 0,10.5 C 18,10.5 54,15.5 72,15.5 C 90,15.5 126,10.5 144,10.5 C 162,10.5 198,15.5 216,15.5 C 234,15.5 270,10.5 288,10.5 C 306,10.5 342,15.5 360,15.5 C 378,15.5 414,10.5 432,10.5 C 450,10.5 486,15.5 504,15.5 C 522,15.5 558,10.5 576,10.5 L 576,26 L 0,26 Z',
  },
  {
    id: 'glint',
    viewBox: '0 0 528 26',
    d: 'M 0,9.5 C 22,9.5 66,16.5 88,16.5 C 110,16.5 154,9.5 176,9.5 C 198,9.5 242,16.5 264,16.5 C 286,16.5 330,9.5 352,9.5 C 374,9.5 418,16.5 440,16.5 C 462,16.5 506,9.5 528,9.5',
  },
];

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
        data-hydration-motion={reduceMotion ? 'reduced' : 'full'}
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
            <div className="today-hydration-bubbles" aria-hidden="true">
              <span className="today-hydration-bubble bubble-a" />
              <span className="today-hydration-bubble bubble-b" />
              <span className="today-hydration-bubble bubble-c" />
            </div>

            <div className="today-hydration-surface" aria-hidden="true">
              {waveLayers.map((layer) => (
                <div key={layer.id} className={`today-hydration-surface-track is-${layer.id}`}>
                  <svg
                    className="today-hydration-wave"
                    viewBox={layer.viewBox}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path className={`today-hydration-wave-path is-${layer.id}`} d={layer.d} />
                  </svg>
                </div>
              ))}
            </div>

            <span className="today-hydration-seal" aria-hidden="true" />
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
