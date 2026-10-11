import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, Zap, BarChart2, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import type { WorkoutSession, SessionExercise } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';
import { useData } from '../../../hooks/useData';
import { computeMuscleRecovery, MuscleRecoveryStatus } from '../../../lib/recovery';
import { InteractiveMuscleMapModal } from '../../InteractiveMuscleMapModal';

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
  const { data } = useData();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isInteractiveMapOpen, setIsInteractiveMapOpen] = useState(false);

  // Compute physiological recovery from past workout history and completed sessions
  const recoveryOverview = useMemo(() => {
    return computeMuscleRecovery(data?.history || [], data?.sessions || []);
  }, [data?.history, data?.sessions]);

  // Aggregate planned sets per target muscle for the week
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

  // Active view: 'recovery' (heat map) vs 'volume' (sets distribution)
  const [activeTab, setActiveTab] = useState<'recovery' | 'volume'>(() => 
    totalSets === 0 ? 'recovery' : 'recovery'
  );

  // Recovery tone styling helper
  const getToneBadge = (status: MuscleRecoveryStatus['status'], percent: number) => {
    if (status === 'fatigued' || percent < 40) {
      return {
        bg: 'rgba(244, 63, 94, 0.16)',
        border: 'rgba(244, 63, 94, 0.35)',
        color: '#f43f5e',
        label: isRTL ? 'مجهَد (Fatigued)' : 'Fatigued',
        indicator: '🔴'
      };
    }
    if (status === 'recovering' || percent < 80) {
      return {
        bg: 'rgba(245, 158, 11, 0.16)',
        border: 'rgba(245, 158, 11, 0.35)',
        color: '#fbbf24',
        label: isRTL ? 'استشفاء (24-48h)' : 'Recovering',
        indicator: '🟡'
      };
    }
    return {
      bg: 'rgba(16, 185, 129, 0.16)',
      border: 'rgba(16, 185, 129, 0.35)',
      color: '#10b981',
      label: isRTL ? 'جاهز للتمرين (Ready)' : 'Ready',
      indicator: '🟢'
    };
  };

  return (
    <section
      className="weekly-muscle-heatmap-card"
      style={{
        background: 'var(--premium-surface)',
        border: '1px solid var(--premium-line)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        marginBlockEnd: '1.25rem',
        boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.45)'
      }}
      aria-label={isRTL ? 'خريطة استشفاء العضلات والحجم التدريبي' : 'Muscle recovery heatmap and volume'}
    >
      {/* Header with Title and Mode Switcher */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: activeTab === 'recovery' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(0, 242, 254, 0.15)',
              border: activeTab === 'recovery' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 242, 254, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'recovery' ? '#10b981' : 'var(--accent-primary)'
            }}
          >
            {activeTab === 'recovery' ? <ShieldCheck size={18} aria-hidden="true" /> : <Activity size={18} aria-hidden="true" />}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activeTab === 'recovery'
                ? (isRTL ? 'خريطة استشفاء العضلات' : 'Muscle Recovery Heatmap')
                : (isRTL ? 'توزيع الحجم العضلي الأسبوعي' : 'Weekly Muscle Volume')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeTab === 'recovery'
                ? (isRTL ? `معدل الجاهزية العام: ${recoveryOverview.overallScore}%` : `Overall Readiness: ${recoveryOverview.overallScore}%`)
                : (isRTL ? `${totalSets} جولة مجدولة هذا الأسبوع` : `${totalSets} planned sets this week`)}
            </span>
          </div>
        </div>

        {/* Tab Controls + Expand Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            role="tablist"
            style={{
              display: 'inline-flex',
              background: 'var(--bg-tertiary)',
              padding: '0.2rem',
              borderRadius: '12px',
              border: '1px solid var(--premium-line)'
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recovery'}
              onClick={() => setActiveTab('recovery')}
              className="touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'recovery' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: activeTab === 'recovery' ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={14} />
              <span>{isRTL ? 'استشفاء العضلات' : 'Recovery'}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'volume'}
              onClick={() => setActiveTab('volume')}
              className="touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'volume' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: activeTab === 'volume' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart2 size={14} />
              <span>{isRTL ? 'حجم الجولات' : 'Volume'}</span>
            </button>
          </div>

          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(prev => !prev)}
            className="touch-target btn-icon btn-ghost"
            style={{ width: 34, height: 34, color: 'var(--text-muted)' }}
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
        </div>
      </header>

      {/* Main Card Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'recovery' ? (
              /* TAB 1: MUSCLE RECOVERY HEATMAP (Green / Yellow / Red) */
              <div>
                {/* 3-Color Legend Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.6rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--premium-line)',
                    marginBottom: '0.85rem',
                    fontSize: '0.74rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    <span>{isRTL ? 'جاهز للتدريب (80-100%)' : 'Ready (80-100%)'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24', fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                    <span>{isRTL ? 'قيد الاستشفاء (24-48 ساعة)' : 'Recovering (24-48h)'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f43f5e', fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
                    <span>{isRTL ? 'مجهد بحمل عالٍ (<40%)' : 'Fatigued (<40%)'}</span>
                  </div>
                </div>

                {/* Recommended Muscles To Train Callout */}
                {recoveryOverview.recommendedMuscles.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(0, 242, 254, 0.08))',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <Zap size={16} color="#10b981" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isRTL ? 'عضلات مستعدة للتدريب اليوم:' : 'Recommended to hit today:'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {recoveryOverview.recommendedMuscles.slice(0, 3).map(m => (
                          <span
                            key={m.id}
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399',
                              fontWeight: 800,
                              fontSize: '0.74rem'
                            }}
                          >
                            ✓ {isRTL ? m.nameAr : m.nameEn}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6 Muscle Recovery Grid Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                    gap: '0.6rem'
                  }}
                >
                  {recoveryOverview.muscles.map(muscle => {
                    const badge = getToneBadge(muscle.status, muscle.percent);
                    const isSelected = selectedMuscle === muscle.id;

                    return (
                      <button
                        key={muscle.id}
                        type="button"
                        onClick={() => {
                          if (onSelectMuscle) {
                            onSelectMuscle(isSelected ? null : muscle.id);
                          }
                        }}
                        className="touch-target"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.7rem 0.85rem',
                          borderRadius: '14px',
                          background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-secondary)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                          cursor: 'pointer',
                          textAlign: isRTL ? 'right' : 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Muscle Name + Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {isRTL ? muscle.nameAr : muscle.nameEn}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{badge.indicator}</span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '999px',
                            background: 'var(--bg-tertiary)',
                            overflow: 'hidden',
                            marginBottom: '0.4rem'
                          }}
                        >
                          <div
                            style={{
                              width: `${muscle.percent}%`,
                              height: '100%',
                              background: badge.color,
                              borderRadius: '999px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>

                        {/* Bottom Metric & Hours */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span className="tabular-nums font-mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: badge.color }}>
                            {muscle.percent}%
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {muscle.hoursAgo !== null
                              ? (isRTL ? `قبل ${Math.round(muscle.hoursAgo)}h` : `${Math.round(muscle.hoursAgo)}h ago`)
                              : (isRTL ? 'مستشفية' : 'Recovered')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explore Full 3D / Anatomy Map Trigger */}
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsInteractiveMapOpen(true)}
                    className="touch-target btn-icon btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--premium-line)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Layers size={14} />
                    <span>{isRTL ? 'فتح خريطة العضلات التفاعلية الكاملة' : 'Open Full Anatomy Map'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: WEEKLY SETS VOLUME DISTRIBUTION */
              <div>
                {/* Segmented Distribution Bar */}
                {totalSets > 0 ? (
                  <>
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
                        marginBottom: '0.85rem'
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

                    <div
                      className="muscle-volume-chips-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                        gap: '0.5rem'
                      }}
                    >
                      {muscleVolumes.map(({ muscle, sets }) => {
                        const palette = MUSCLE_PALETTE[muscle] || MUSCLE_PALETTE.Other;
                        const isSelected = selectedMuscle === muscle;
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
                              background: isSelected ? palette.bg : 'var(--bg-secondary)',
                              border: isSelected ? `1.5px solid ${palette.hex}` : '1px solid var(--premium-line)',
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
                  </>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.25rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <Sparkles size={20} style={{ margin: '0 auto 0.4rem', opacity: 0.6 }} />
                    <p style={{ margin: 0 }}>
                      {isRTL ? 'لا توجد جولات مجدولة لهذا الأسبوع بعد. اختر يوماً لإضافة تمارين!' : 'No planned sets for this week yet. Select a day to add sessions!'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anatomy Interactive Modal */}
      {isInteractiveMapOpen && (
        <InteractiveMuscleMapModal
          isOpen={isInteractiveMapOpen}
          onClose={() => setIsInteractiveMapOpen(false)}
        />
      )}
    </section>
  );
}
