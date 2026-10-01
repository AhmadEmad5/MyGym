import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown } from 'lucide-react';
import type { WorkoutSession, SessionExercise } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';

interface WeeklyMuscleVolumeHeatmapProps {
  sessions: WorkoutSession[];
  isRTL: boolean;
  selectedMuscle?: string | null;
  onSelectMuscle?: (muscle: string | null) => void;
}

const MUSCLE_PALETTE: Record<string, { bg: string; text: string; hex: string }> = {
  Chest: { bg: 'rgba(56, 189, 248, 0.16)', text: '#38bdf8', hex: '#38bdf8' },
  Back: { bg: 'rgba(129, 140, 248, 0.16)', text: '#818cf8', hex: '#818cf8' },
  Legs: { bg: 'rgba(168, 85, 247, 0.16)', text: '#a855f7', hex: '#a855f7' },
  Shoulders: { bg: 'rgba(251, 146, 60, 0.16)', text: '#fb923c', hex: '#fb923c' },
  Biceps: { bg: 'rgba(52, 211, 153, 0.16)', text: '#34d399', hex: '#34d399' },
  Triceps: { bg: 'rgba(236, 72, 153, 0.16)', text: '#ec4899', hex: '#ec4899' },
  Core: { bg: 'rgba(250, 204, 21, 0.16)', text: '#facc15', hex: '#facc15' },
  Cardio: { bg: 'rgba(244, 63, 94, 0.16)', text: '#f43f5e', hex: '#f43f5e' },
  Other: { bg: 'rgba(148, 163, 184, 0.16)', text: '#94a3b8', hex: '#94a3b8' }
};

export function WeeklyMuscleVolumeHeatmap({
  sessions,
  isRTL,
  selectedMuscle,
  onSelectMuscle
}: WeeklyMuscleVolumeHeatmapProps) {
  const { tMuscle } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  // Aggregate planned sets per target muscle
  const { muscleVolumes, totalSets } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    sessions.forEach(session => {
      (session.exercises || []).forEach((ex: SessionExercise) => {
        const muscle = ex.targetMuscle || 'Other';
        const setsCount = ex.sets?.length || 0;
        counts[muscle] = (counts[muscle] || 0) + setsCount;
        total += setsCount;
      });
    });

    const sorted = Object.entries(counts)
      .map(([muscle, sets]) => ({ muscle, sets, percentage: total > 0 ? (sets / total) * 100 : 0 }))
      .sort((a, b) => b.sets - a.sets);

    return { muscleVolumes: sorted, totalSets: total };
  }, [sessions]);

  if (totalSets === 0) {
    return null;
  }

  return (
    <section
      className="weekly-muscle-heatmap-card"
      style={{
        background: 'var(--premium-surface)',
        border: '1px solid var(--premium-line)',
        borderRadius: '16px',
        padding: '0.9rem 1.15rem',
        marginBlockEnd: '1.25rem',
        boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.4)'
      }}
      aria-label={isRTL ? 'توزيع الحجم العضلي الأسبوعي' : 'Weekly muscle volume distribution'}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}
          >
            <Activity size={16} aria-hidden="true" />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'توزيع الحجم العضلي الأسبوعي' : 'Weekly Muscle Volume & Distribution'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL
                ? `${totalSets} جولة مجدولة هذا الأسبوع عبر ${sessions.length} جلسات`
                : `${totalSets} planned sets across ${sessions.length} sessions this week`}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={isExpanded}
          className="touch-target btn-icon btn-ghost"
          style={{ width: 32, height: 32, color: 'var(--text-muted)' }}
          aria-label={isExpanded ? (isRTL ? 'طي' : 'Collapse') : (isRTL ? 'توسيع' : 'Expand')}
        >
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>
      </header>

      {/* Segmented Distribution Bar (Always visible) */}
      <div
        className="muscle-volume-distribution-bar"
        role="progressbar"
        aria-label={isRTL ? 'شريط توزيع الحجم العضلي' : 'Muscle volume distribution bar'}
        style={{
          display: 'flex',
          height: '10px',
          borderRadius: '999px',
          overflow: 'hidden',
          background: 'var(--bg-tertiary)',
          marginTop: '0.75rem',
          marginBottom: isExpanded ? '0.85rem' : '0.2rem'
        }}
      >
        {muscleVolumes.map(({ muscle, percentage, sets }) => {
          const palette = MUSCLE_PALETTE[muscle] || MUSCLE_PALETTE.Other;
          return (
            <div
              key={muscle}
              title={`${tMuscle(muscle)}: ${sets} sets (${Math.round(percentage)}%)`}
              style={{
                width: `${percentage}%`,
                height: '100%',
                background: palette.hex,
                transition: 'width 0.4s ease'
              }}
            />
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Muscle Volume Grid */}
            <div
              className="muscle-volume-chips-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                gap: '0.5rem',
                marginTop: '0.4rem'
              }}
            >
              {muscleVolumes.map(({ muscle, sets }) => {
                const palette = MUSCLE_PALETTE[muscle] || MUSCLE_PALETTE.Other;
                const isSelected = selectedMuscle === muscle;

                // Optimal volume range benchmark:
                // < 8 sets: Maintenance / Light
                // 8 - 20 sets: Optimal Hypertrophy (Science benchmark)
                // > 20 sets: High Volume / Advanced
                const isOptimal = sets >= 8 && sets <= 20;
                const isHigh = sets > 20;

                const statusLabel = isHigh
                  ? (isRTL ? 'حجم مكثف' : 'High Volume')
                  : isOptimal
                    ? (isRTL ? 'مثالي للبناء' : 'Optimal Hypertrophy')
                    : (isRTL ? 'صيانة' : 'Maintenance');

                const statusBg = isHigh
                  ? 'rgba(245, 158, 11, 0.18)'
                  : isOptimal
                    ? 'rgba(16, 185, 129, 0.18)'
                    : 'rgba(56, 189, 248, 0.12)';

                const statusColor = isHigh
                  ? '#f59e0b'
                  : isOptimal
                    ? '#10b981'
                    : '#38bdf8';

                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => {
                      if (onSelectMuscle) {
                        onSelectMuscle(isSelected ? null : muscle);
                      }
                    }}
                    className={`muscle-volume-card touch-target ${isSelected ? 'is-active' : ''}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      background: isSelected
                        ? palette.bg
                        : 'var(--bg-secondary)',
                      border: isSelected
                        ? `1.5px solid ${palette.hex}`
                        : '1px solid var(--premium-line)',
                      cursor: onSelectMuscle ? 'pointer' : 'default',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: palette.text }}>
                        {tMuscle(muscle)}
                      </span>
                      <span className="font-mono tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {sets}
                        <small style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginInlineStart: '0.2rem' }}>
                          {isRTL ? 'جولة' : 'sets'}
                        </small>
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        background: statusBg,
                        color: statusColor
                      }}
                    >
                      {statusLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Science Benchmark Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--premium-line)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                <span>{isRTL ? '< 8 جولات: صيانة' : '< 8 sets: Maintenance'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span>{isRTL ? '8-20 جولة: تضخيم مثالي' : '8–20 sets: Optimal Hypertrophy'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                <span>{isRTL ? '> 20 جولة: حجم عالي' : '> 20 sets: High Volume'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
