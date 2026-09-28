import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Clock3, Dumbbell, Sparkles, Home, CheckCircle2, History, Sliders } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { WorkoutSession, PersonalRecord, SessionExercise } from '../lib/api';
import { ManualCardioEntryModal, ManualCardioData } from './ManualCardioEntryModal';
import { ModalShell } from './AIMealVisionModal';

interface CelebrationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession;
  burnedCalories?: number;
  newPRs?: PersonalRecord[];
  onOpenShareCard?: () => void;
  onReturnHome?: () => void;
  onViewHistory?: () => void;
  onSaveCardioMetrics?: (exerciseIndex: number, metrics: ManualCardioData) => void;
}

export function CelebrationSummaryModal({
  isOpen,
  onClose,
  session,
  burnedCalories = 0,
  newPRs = [],
  onOpenShareCard,
  onReturnHome,
  onViewHistory,
  onSaveCardioMetrics
}: CelebrationSummaryModalProps) {
  const { t, tTitle, tExercise, isRTL } = useTranslation();
  const [selectedCardioEx, setSelectedCardioEx] = useState<{ ex: SessionExercise; index: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      gymAudio.playCelebrationFanfare();
      gymAudio.triggerVibration([120, 80, 200, 80, 350]);
    }
  }, [isOpen]);

  const stats = useMemo(() => {
    let totalVolKg = 0;
    let completedSetsCount = 0;
    let maxWeight = 0;
    let topLiftName = '';
    let topLiftUnit = 'kg';

    (session.exercises || []).forEach(ex => {
      ex.sets?.forEach(s => {
        if (s.isCompleted || (s.weight > 0 && s.repsActual > 0)) {
          completedSetsCount++;
          const w = s.unit === 'lb' ? s.weight * 0.453592 : s.weight;
          const r = s.repsActual || s.repsTarget || 0;
          totalVolKg += Math.round(w * r);

          if (s.weight > maxWeight) {
            maxWeight = s.weight;
            topLiftName = ex.name;
            topLiftUnit = s.unit || 'kg';
          }
        }
      });
    });

    return {
      totalVolKg,
      tonnes: (totalVolKg / 1000).toFixed(1),
      carsEquivalent: (totalVolKg / 1400).toFixed(1),
      completedSetsCount,
      maxWeight,
      topLiftName,
      topLiftUnit
    };
  }, [session]);

  const durationMin = session.duration || Math.max(25, Math.round((session.exercises?.length || 3) * 8));

  const cardioExercises = useMemo(() => {
    return (session.exercises || [])
      .map((ex, originalIndex) => ({ ex, originalIndex }))
      .filter(({ ex }) => ex.targetMuscle === 'Cardio');
  }, [session.exercises]);

  const statTiles = [
    { label: t('workoutDurationStats'), value: `${durationMin} ${t('min')}`, color: '#38bdf8', icon: <Clock3 size={18} /> },
    { label: t('burnedCaloriesStats'), value: `${burnedCalories || Math.round(durationMin * 7.8)} kcal`, color: '#f97316', icon: <Flame size={18} /> },
    { label: t('completedSetsStats'), value: `${stats.completedSetsCount} ${t('sets')}`, color: '#34d399', icon: <CheckCircle2 size={18} /> },
    {
      label: t('topLiftRecorded'),
      value: stats.maxWeight > 0 ? `${stats.maxWeight} ${stats.topLiftUnit}` : (session.exercises?.[0]?.name || tTitle(session.title)),
      color: '#c084fc',
      icon: <Sparkles size={18} />
    }
  ];

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        titleId="celebration-title"
        title={t('celebrationWorkoutCrushed')}
        subtitle={t('celebrationLegendaryEffort')}
        icon={<Trophy size={19} />}
        accent="#facc15"
        maxWidth={540}
        backdropContent={
          <div className="celebration-confetti-wrap" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ y: -60, opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ y: [0, 400 + (i % 5) * 90], opacity: [0, 1, 0], scale: [0.5, 1, 0.8], rotate: [0, (i * 37) % 360] }}
                transition={{ duration: 2.5 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.15 }}
                style={{
                  position: 'absolute',
                  insetInlineStart: `${(i / 18) * 100}%`,
                  top: '-20px',
                  width: i % 2 === 0 ? '8px' : '12px',
                  height: i % 2 === 0 ? '8px' : '12px',
                  borderRadius: i % 3 === 0 ? '50%' : '3px',
                  background: i % 3 === 0 ? '#38bdf8' : (i % 2 === 0 ? '#facc15' : '#34d399')
                }}
              />
            ))}
          </div>
        }
        footer={
          <>
            {onOpenShareCard && (
              <PrimaryCelebrationButton onClick={onOpenShareCard} icon={<Sparkles size={18} />} primary>
                {t('celebrationStoryBtn')}
              </PrimaryCelebrationButton>
            )}
            {onViewHistory && (
              <SecondaryCelebrationButton onClick={onViewHistory} icon={<History size={17} />}>
                {isRTL ? 'عرض في سجل التمارين' : 'View in workout history'}
              </SecondaryCelebrationButton>
            )}
            <SecondaryCelebrationButton onClick={onReturnHome || onClose} icon={<Home size={16} />} subtle>
              {t('celebrationDoneBtn')}
            </SecondaryCelebrationButton>
          </>
        }
      >
        <section
          aria-label={t('heroTonnageLifted')}
          style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '20px',
            padding: '1.1rem 0.9rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#facc15', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            <Dumbbell size={15} />
            <span>{t('heroTonnageLifted')}</span>
          </div>
          <div style={{ fontSize: 'clamp(2.2rem, 10vw, 3rem)', fontWeight: 950, letterSpacing: '-0.04em', color: '#ffffff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {stats.tonnes}{' '}
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#facc15' }}>{t('tonnesLabel')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>({stats.totalVolKg.toLocaleString()} {t('weight')})</span>
            {parseFloat(stats.carsEquivalent) >= 0.5 && (
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {t('carsEquivalentText')} {stats.carsEquivalent} {t('carsUnit')}
              </span>
            )}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem' }}>
          {statTiles.map((tile, index) => (
            <div
              key={tile.label}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                minWidth: 0
              }}
            >
              <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '10px', background: `${tile.color}22`, color: tile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tile.icon}
              </span>
              <span style={{ minWidth: 0, textAlign: 'start' }}>
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{tile.label}</span>
                <strong style={{ fontSize: index === 3 ? '0.85rem' : '0.92rem', color: '#ffffff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tile.value}
                </strong>
              </span>
            </div>
          ))}
        </div>

        {newPRs.length > 0 && (
          <section aria-label={t('newPersonalRecordsAchieved')} style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '14px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#facc15', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              <Trophy size={14} />
              <span>{t('newPersonalRecordsAchieved')}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {newPRs.map((pr, idx) => (
                <span key={idx} style={{ padding: '0.22rem 0.6rem', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.18)', border: '1px solid rgba(234, 179, 8, 0.45)', color: '#facc15', fontSize: '0.72rem', fontWeight: 750 }}>
                  ✨ {tExercise(pr.exerciseName)}: {pr.maxWeight} {pr.unit}
                </span>
              ))}
            </div>
          </section>
        )}

        {cardioExercises.length > 0 && (
          <section aria-label={isRTL ? 'إحصائيات الكارديو' : 'Cardio stats'} style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08))', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800 }}>
                <span aria-hidden="true">🏃</span>
                <span>{isRTL ? 'إحصائيات الكارديو' : 'Cardio stats'}</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {cardioExercises.length} {isRTL ? 'تمارين' : 'exercise(s)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {cardioExercises.map(({ ex, originalIndex }) => (
                <div
                  key={originalIndex}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '11px',
                    padding: '0.6rem 0.7rem',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ minWidth: 0, textAlign: 'start' }}>
                    <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {tExercise(ex.name)}
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>⏱️ {ex.duration || 15} {t('min')}</span>
                      {ex.distanceKm !== undefined && <span style={{ color: '#38bdf8', fontWeight: 600 }}>📍 {ex.distanceKm} km</span>}
                      {ex.caloriesBurned !== undefined && <span style={{ color: '#f97316', fontWeight: 600 }}>🔥 {ex.caloriesBurned} kcal</span>}
                      {ex.heartRate !== undefined && <span style={{ color: '#f43f5e', fontWeight: 600 }}>❤️ {ex.heartRate} bpm</span>}
                      {ex.pace && <span style={{ color: 'var(--text-muted)' }}>⚡ {ex.pace}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCardioEx({ ex, index: originalIndex })}
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.4rem 0.7rem',
                      borderRadius: '9px',
                      background: 'rgba(56, 189, 248, 0.16)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      fontSize: '0.74rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                      minHeight: 36
                    }}
                  >
                    <Sliders size={13} />
                    <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </ModalShell>

      {selectedCardioEx && (
        <ManualCardioEntryModal
          isOpen={Boolean(selectedCardioEx)}
          onClose={() => setSelectedCardioEx(null)}
          exerciseName={selectedCardioEx.ex.name}
          initialData={{
            durationMinutes: selectedCardioEx.ex.duration || 15,
            distanceKm: selectedCardioEx.ex.distanceKm,
            calories: selectedCardioEx.ex.caloriesBurned,
            heartRate: selectedCardioEx.ex.heartRate,
            pace: selectedCardioEx.ex.pace || '',
            notes: selectedCardioEx.ex.notes || ''
          }}
          onSave={metrics => {
            onSaveCardioMetrics?.(selectedCardioEx.index, metrics);
            setSelectedCardioEx(null);
          }}
        />
      )}
    </>
  );
}

function PrimaryCelebrationButton({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode; primary?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        flex: '1 1 100%',
        width: '100%',
        padding: '0.85rem 1.1rem',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #facc15, #eab308)',
        border: 'none',
        color: '#0f172a',
        fontWeight: 900,
        fontSize: '0.92rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: 48
      }}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}

function SecondaryCelebrationButton({ children, onClick, icon, subtle }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode; subtle?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        flex: '1 1 100%',
        width: '100%',
        padding: '0.75rem 1.1rem',
        borderRadius: '14px',
        background: subtle ? 'rgba(255, 255, 255, 0.06)' : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.35))',
        border: subtle ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(56, 189, 248, 0.45)',
        color: subtle ? '#ffffff' : '#38bdf8',
        fontWeight: subtle ? 750 : 800,
        fontSize: '0.88rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: 46
      }}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}
