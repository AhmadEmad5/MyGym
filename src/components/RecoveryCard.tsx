import { ChevronDown, Zap } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import type { RecoveryOverview, MuscleRecoveryStatus } from '../lib/recovery';
import { WidgetFrame } from './TodayBentoGrid';

export interface RecoveryCardProps {
  recovery: RecoveryOverview;
  onExploreMuscles?: () => void;
  status?: 'loading' | 'ready' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

const statusTone = (score: number) => (score >= 80 ? 'lime' : score >= 50 ? 'amber' : 'rose');

export function RecoveryCard({ recovery, onExploreMuscles, status = 'ready', errorMessage, onRetry }: RecoveryCardProps) {
  const { isRTL } = useTranslation();

  const statusLabel =
    recovery.overallScore >= 80
      ? isRTL ? 'جاهز' : 'Ready'
      : recovery.overallScore >= 50
        ? isRTL ? 'متوسط' : 'Moderate'
        : isRTL ? 'متعب' : 'Fatigued';

  const ready = status === 'ready';
  const tone = ready ? statusTone(recovery.overallScore) : 'cyan';
  const recommended = (recovery.recommendedMuscles || []).slice(0, 3);

  return (
    <WidgetFrame
      title={isRTL ? 'الاستشفاء' : 'Recovery'}
      icon={<Zap size={15} aria-hidden="true" />}
      tone={tone}
      trailing={
        onExploreMuscles && ready ? (
          <button type="button" className="forma-quiet-button" onClick={onExploreMuscles}>
            <span>{isRTL ? 'المجسم' : '3D body'}</span>
            <ChevronDown size={14} aria-hidden="true" style={{ transform: isRTL ? 'rotate(90deg)' : 'none' }} />
          </button>
        ) : undefined
      }
    >
      <div
        className="today-recovery-score"
        role="img"
        aria-label={
          isRTL
            ? `مؤشر الاستشفاء ${recovery.overallScore} بالمئة، الحالة ${statusLabel}.`
            : `Recovery score ${recovery.overallScore} percent, status ${statusLabel}.`
        }
      >
        <strong className="tabular-nums">{recovery.overallScore}%</strong>
        <span>{statusLabel}</span>
      </div>

      {recommended.length > 0 && (
        <ul className="today-recovery-tags" aria-label={isRTL ? 'العضلات المقترحة' : 'Recommended muscles'}>
          {recommended.map((muscle: MuscleRecoveryStatus) => (
            <li key={muscle.id}>
              {isRTL ? muscle.nameAr : muscle.nameEn}
              <span className="forma-sr-only">
                {isRTL ? ` — ${muscle.percent} بالمئة` : ` — ${muscle.percent} percent`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="forma-sr-only">
        {isRTL
          ? 'العضلات المقترحة للاستشفاء الكامل أو الجاهزة للتدريب.'
          : 'Muscles recommended as fully recovered or ready to train.'}
      </p>

      {status === 'error' && errorMessage && (
        <p className="today-recovery-error" role="alert">
          {errorMessage}
        </p>
      )}

      {onRetry && status === 'error' && (
        <button type="button" className="forma-quiet-button" onClick={onRetry}>
          {isRTL ? 'إعادة المحاولة' : 'Retry'}
        </button>
      )}
    </WidgetFrame>
  );
}
