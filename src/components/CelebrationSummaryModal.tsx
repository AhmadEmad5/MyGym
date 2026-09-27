import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Clock3, Dumbbell, Sparkles, Home, CheckCircle2, History, Sliders } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';
import type { WorkoutSession, PersonalRecord, SessionExercise } from '../lib/api';
import { ManualCardioEntryModal, ManualCardioData } from './ManualCardioEntryModal';

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

  // Play celebratory sound & vibration when modal opens
  useEffect(() => {
    if (isOpen) {
      gymAudio.playCelebrationFanfare();
      gymAudio.triggerVibration([120, 80, 200, 80, 350]);
    }
  }, [isOpen]);

  // Compute total volume & top lift
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

    const tonnes = (totalVolKg / 1000).toFixed(1);
    const carsEquivalent = (totalVolKg / 1400).toFixed(1);

    return {
      totalVolKg,
      tonnes,
      carsEquivalent,
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

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="portal-modal-backdrop celebration-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Floating Confetti Elements */}
        <div className="celebration-confetti-wrap" pointer-events="none">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className="celebration-spark"
              initial={{ y: -60, opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ 
                y: [0, 400 + Math.random() * 200], 
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.8],
                rotate: [0, Math.random() * 360] 
              }}
              transition={{ 
                duration: 2.5 + Math.random() * 1.5, 
                repeat: Infinity,
                delay: i * 0.15 
              }}
              style={{
                position: 'absolute',
                left: `${(i / 18) * 100}%`,
                top: '-20px',
                width: i % 2 === 0 ? '8px' : '12px',
                height: i % 2 === 0 ? '8px' : '12px',
                borderRadius: i % 3 === 0 ? '50%' : '3px',
                background: i % 3 === 0 ? '#38bdf8' : (i % 2 === 0 ? '#facc15' : '#34d399')
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="celebration-card-modal"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '92vh',
            overflowY: 'auto',
            borderRadius: '26px',
            background: 'linear-gradient(145deg, rgba(17, 24, 43, 0.96), rgba(9, 13, 24, 0.98))',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(234, 179, 8, 0.25)',
            padding: '2rem 1.6rem',
            textAlign: 'center',
            zIndex: 10001
          }}
        >
          {/* Trophy Header Icon */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.1rem' }}>
            <motion.div
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #facc15, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45)',
                color: '#111827',
                margin: '0 auto',
                position: 'relative'
              }}
            >
              <Trophy size={38} strokeWidth={2.2} />
              <div 
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '28px',
                  background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.4), rgba(217, 119, 6, 0.1))',
                  filter: 'blur(8px)',
                  zIndex: -1
                }} 
              />
            </motion.div>
          </div>

          {/* Title & Subtitle */}
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 3.5vw, 1.95rem)', 
            fontWeight: 900, 
            margin: '0 0 0.4rem',
            background: 'linear-gradient(180deg, #ffffff 30%, #facc15 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            {t('celebrationWorkoutCrushed')}
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
            {t('celebrationLegendaryEffort')}
          </p>

          {/* Hero Tonnage Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '20px',
            padding: '1.25rem 1rem',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              color: '#facc15',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem'
            }}>
              <Dumbbell size={15} />
              <span>{t('heroTonnageLifted')}</span>
            </div>

            <div style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.2rem)',
              fontWeight: 950,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              lineHeight: 1.1
            }}>
              {stats.tonnes}{' '}
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#facc15' }}>
                {t('tonnesLabel')}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.45rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <span>({stats.totalVolKg.toLocaleString()} {t('weight')})</span>
              {parseFloat(stats.carsEquivalent) >= 0.5 && (
                <>
                  <span>·</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {t('carsEquivalentText')} {stats.carsEquivalent} {t('carsUnit')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 4-Stat Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.65rem',
            marginBottom: '1.25rem'
          }}>
            {/* Duration */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock3 size={18} />
              </div>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {t('workoutDurationStats')}
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                  {durationMin} {t('min')}
                </strong>
              </div>
            </div>

            {/* Calories */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Flame size={18} />
              </div>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {t('burnedCaloriesStats')}
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                  {burnedCalories || Math.round(durationMin * 7.8)} kcal
                </strong>
              </div>
            </div>

            {/* Completed Sets */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={18} />
              </div>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {t('completedSetsStats')}
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                  {stats.completedSetsCount} {t('sets')}
                </strong>
              </div>
            </div>

            {/* Top Lift */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>
              <div style={{ textAlign: isRTL ? 'right' : 'left', minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {t('topLiftRecorded')}
                </span>
                <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stats.maxWeight > 0 ? `${stats.maxWeight} ${stats.topLiftUnit}` : session.exercises?.[0]?.name || tTitle(session.title)}
                </strong>
              </div>
            </div>
          </div>

          {/* New PRs Badges (if any) */}
          {newPRs.length > 0 && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '16px',
              padding: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                justifyContent: 'center',
                color: '#facc15',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '0.4rem'
              }}>
                <Trophy size={14} />
                <span>{t('newPersonalRecordsAchieved')}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {newPRs.map((pr, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(234, 179, 8, 0.18)',
                      border: '1px solid rgba(234, 179, 8, 0.45)',
                      color: '#facc15',
                      fontSize: '0.74rem',
                      fontWeight: 750
                    }}
                  >
                    ✨ {pr.exerciseName}: {pr.maxWeight} {pr.unit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cardio Exercises Summary & Manual Entry Option */}
          {cardioExercises.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08))',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '16px',
              padding: '0.9rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 800 }}>
                  <span>🏃</span>
                  <span>{isRTL ? 'إحصائيات الكارديو (تعديل أو إدخال يدوي)' : 'Cardio Stats (Manual Entry / Edit)'}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {cardioExercises.length} {isRTL ? 'تمارين كارديو' : 'exercise(s)'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {cardioExercises.map(({ ex, originalIndex }) => (
                  <div
                    key={originalIndex}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      padding: '0.65rem 0.8rem',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {tExercise(ex.name)}
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          ⏱️ {ex.duration || 15} {t('min')}
                        </span>
                        {ex.distanceKm !== undefined && (
                          <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                            📍 {ex.distanceKm} km
                          </span>
                        )}
                        {ex.caloriesBurned !== undefined && (
                          <span style={{ fontSize: '0.74rem', color: '#f97316', fontWeight: 600 }}>
                            🔥 {ex.caloriesBurned} kcal
                          </span>
                        )}
                        {ex.heartRate !== undefined && (
                          <span style={{ fontSize: '0.74rem', color: '#f43f5e', fontWeight: 600 }}>
                            ❤️ {ex.heartRate} bpm
                          </span>
                        )}
                        {ex.pace && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            ⚡ {ex.pace}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCardioEx({ ex, index: originalIndex })}
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '9px',
                        background: 'rgba(56, 189, 248, 0.16)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: '0.76rem',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                      title={isRTL ? 'إدخال أو تعديل أرقام الكارديو يدويًا' : 'Enter or edit cardio metrics'}
                    >
                      <Sliders size={13} />
                      <span>{isRTL ? 'تعديل / إدخال' : 'Edit / Log'}</span>
                    </button>
                  </div>
                ))}
              </div>

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
                  onSave={(metrics) => {
                    onSaveCardioMetrics?.(selectedCardioEx.index, metrics);
                    setSelectedCardioEx(null);
                  }}
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {onOpenShareCard && (
              <motion.button
                type="button"
                className="celebration-share-btn"
                onClick={onOpenShareCard}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '0.88rem 1.25rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #facc15, #eab308)',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 8px 24px -4px rgba(234, 179, 8, 0.45)'
                }}
              >
                <Sparkles size={18} />
                <span>{t('celebrationStoryBtn')}</span>
              </motion.button>
            )}

            {onViewHistory && (
              <motion.button
                type="button"
                className="celebration-history-btn"
                onClick={onViewHistory}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '0.82rem 1.25rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.35))',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 4px 16px -2px rgba(56, 189, 248, 0.25)'
                }}
              >
                <History size={17} />
                <span>{isRTL ? 'عرض في سجل التمارين' : 'View in Workout History'}</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              className="celebration-done-btn"
              onClick={onReturnHome || onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '0.78rem 1.25rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                fontWeight: 750,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem'
              }}
            >
              <Home size={16} />
              <span>{t('celebrationDoneBtn')}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
