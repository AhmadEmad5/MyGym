import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Droplets, Flame, Play, Smartphone, Zap } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { HistoryRecord, WorkoutSession } from '../lib/api';
import { WidgetFrame, WidgetSkeleton, WidgetState } from './TodayBentoGrid';

interface HomeScreenQuickActionsWidgetProps {
  todaySessions: WorkoutSession[];
  history: HistoryRecord[];
  onLogWater: (amount: number) => Promise<void>;
  onOpenQuickWorkout: () => void;
  burnedCaloriesToday: number;
  status?: 'loading' | 'ready' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

const FEEDBACK_MS = 2000;

export function HomeScreenQuickActionsWidget({
  todaySessions,
  onLogWater,
  onOpenQuickWorkout,
  burnedCaloriesToday,
  status = 'ready',
  errorMessage,
  onRetry,
}: HomeScreenQuickActionsWidgetProps) {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [waterLogged, setWaterLogged] = useState(false);
  const [isLoggingWater, setIsLoggingWater] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showShortcutTip, setShowShortcutTip] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const uncompletedToday = todaySessions.find((session) => !session.isCompleted);

  const handleStartWorkout = () => {
    gymAudio.triggerVibration([20]);
    if (uncompletedToday) navigate(`/session/${uncompletedToday.id}`);
    else onOpenQuickWorkout();
  };

  const handleQuickWater = async () => {
    if (isLoggingWater) return;
    setIsLoggingWater(true);
    setActionError(null);
    gymAudio.triggerVibration([25, 40]);
    try {
      await onLogWater(500);
      setWaterLogged(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setWaterLogged(false), FEEDBACK_MS);
    } catch {
      setActionError(isRTL ? 'تعذّر تسجيل الماء. حاول مرة أخرى.' : 'Could not log water. Try again.');
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handleScanMeal = () => {
    gymAudio.triggerVibration([15]);
    navigate('/nutrition?action=scan-meal');
  };

  const effectiveStatus = actionError ? 'error' : status;

  return (
    <WidgetFrame
      title={t('quickWidgetsTitle')}
      icon={<Zap size={15} aria-hidden="true" />}
      tone="cyan"
      trailing={
        <span className="forma-badge" style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.14)', borderColor: 'rgba(244,63,94,0.32)' }}>
          <Flame size={12} aria-hidden="true" />
          <span className="tabular-nums">{burnedCaloriesToday} kcal</span>
        </span>
      }
    >
      {effectiveStatus === 'loading' ? (
        <WidgetSkeleton rows={2} label={isRTL ? 'جارٍ تحميل الإجراءات السريعة' : 'Loading quick actions'} />
      ) : effectiveStatus === 'error' ? (
        <WidgetState
          tone="error"
          role="alert"
          title={isRTL ? 'تعذّر تنفيذ الإجراء' : 'That action did not go through'}
          description={actionError || errorMessage || (isRTL ? 'أعد المحاولة.' : 'Please try again.')}
          action={
            onRetry && (
              <button type="button" className="forma-quiet-button" onClick={onRetry}>
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </button>
            )
          }
        />
      ) : (
        <div className="home-quick-actions-grid" role="group" aria-label={isRTL ? 'إجراءات سريعة' : 'Quick actions'}>
          <button type="button" className="quick-action-card-btn is-cyan" onClick={handleStartWorkout}>
            <span className="quick-action-icon" aria-hidden="true">
              <Play size={14} fill="currentColor" />
            </span>
            <strong>{t('quickWidgetWorkout')}</strong>
            <small>{uncompletedToday ? uncompletedToday.title : isRTL ? 'ابدأ الآن بنقرة' : 'Tap to start'}</small>
          </button>

          <button
            type="button"
            className="quick-action-card-btn is-cyan"
            onClick={handleQuickWater}
            aria-busy={isLoggingWater}
            disabled={isLoggingWater}
          >
            <span className="quick-action-icon" aria-hidden="true" data-active={waterLogged ? 'true' : 'false'}>
              {waterLogged ? <Check size={15} /> : <Droplets size={15} />}
            </span>
            <strong>
              {waterLogged
                ? isRTL ? 'تم تسجيل +500 مل' : '+500 ml added'
                : t('quickWidgetWater')}
            </strong>
            <small>{isRTL ? 'تسجيل ترطيب سريع' : 'Instant hydration'}</small>
          </button>

          <button type="button" className="quick-action-card-btn is-purple" onClick={handleScanMeal}>
            <span className="quick-action-icon" aria-hidden="true">
              <Camera size={14} />
            </span>
            <strong>{t('quickWidgetScanMeal')}</strong>
            <small>{isRTL ? 'مسح الوجبة بالكاميرا' : 'Instant macro analysis'}</small>
          </button>
        </div>
      )}

      <div className="home-quick-actions-foot">
        <span>
          <Smartphone size={13} aria-hidden="true" />
          {t('pwaShortcutTip')}
        </span>
        <button
          type="button"
          className="forma-quiet-button"
          style={{ minHeight: '2rem', padding: '0.2rem 0.55rem' }}
          aria-expanded={showShortcutTip}
          onClick={() => setShowShortcutTip((prev) => !prev)}
        >
          {showShortcutTip ? (isRTL ? 'إخفاء' : 'Hide') : isRTL ? 'تفاصيل' : 'Details'}
        </button>
      </div>

      {showShortcutTip && (
        <p className="home-quick-actions-tip">
          {isRTL
            ? 'ثبّت التطبيق على شاشتك، ثم اضغط مطولاً على الأيقونة للوصول إلى: بدء تمرين اليوم، تسجيل 500 مل ماء، أو مسح وجبة ذكي.'
            : 'Install FORMA on your home screen, then press and hold the icon to jump to: Start workout, +500 ml water, or AI meal scanner.'}
        </p>
      )}
    </WidgetFrame>
  );
}
