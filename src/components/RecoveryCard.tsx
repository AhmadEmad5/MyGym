import { Zap, ChevronDown } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import type { RecoveryOverview, MuscleRecoveryStatus } from '../lib/recovery';

export interface RecoveryCardProps {
  recovery: RecoveryOverview;
  onExploreMuscles?: () => void;
}

export function RecoveryCard({ recovery, onExploreMuscles }: RecoveryCardProps) {
  const { isRTL } = useTranslation();

  const statusLabel = recovery.overallScore >= 80 
    ? (isRTL ? 'جاهز' : 'Ready') 
    : recovery.overallScore >= 50 
      ? (isRTL ? 'متوسط' : 'Moderate') 
      : (isRTL ? 'متعب' : 'Fatigued');

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(16, 24, 42, 0.88) 0%, rgba(10, 15, 26, 0.95) 100%)',
      border: '1px solid var(--border-card)',
      borderRadius: '24px',
      padding: '1.35rem 1.45rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      marginBottom: '0.85rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'rgba(163, 230, 53, 0.16)',
            border: '1px solid rgba(163, 230, 53, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bef264'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
              {isRTL ? 'الاستشفاء' : 'Recovery'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'من السجل التدريبي الفعلي' : 'From logged training'}
            </span>
          </div>
        </div>

        {onExploreMuscles && (
          <button
            type="button"
            onClick={onExploreMuscles}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid rgba(198, 244, 50, 0.28)',
              background: 'rgba(198, 244, 50, 0.08)',
              color: '#bef264',
              fontSize: '0.72rem',
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            <span>{isRTL ? 'المجسم' : '3D Body'}</span>
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Big Score Row */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.65rem',
        margin: '1.15rem 0 1rem'
      }}>
        <strong style={{
          fontSize: '2.4rem',
          fontWeight: 950,
          color: '#bef264',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {recovery.overallScore}%
        </strong>
        <span style={{
          fontSize: '1.05rem',
          fontWeight: 750,
          color: '#f1f5f9'
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Recommended Muscle Tags */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {(recovery.recommendedMuscles || []).slice(0, 3).map((muscle: MuscleRecoveryStatus) => (
          <span
            key={muscle.id}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9px',
              background: 'rgba(163, 230, 53, 0.08)',
              border: '1px solid rgba(163, 230, 53, 0.3)',
              color: '#bef264',
              fontSize: '0.78rem',
              fontWeight: 750,
              letterSpacing: '0.01em'
            }}
          >
            {isRTL ? muscle.nameAr : muscle.nameEn}
          </span>
        ))}
      </div>
    </div>
  );
}
