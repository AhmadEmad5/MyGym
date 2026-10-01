import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  ChevronDown,
  Zap,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { Modal } from '../../Modal';
import { WORKOUT_SPLIT_PROGRAMS, type SplitProgram } from './splitPrograms';
import { useTranslation } from '../../../lib/i18n';
import { gymAudio } from '../../../lib/audio';

interface WorkoutSplitLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySplit: (program: SplitProgram) => void;
}

export function WorkoutSplitLibraryModal({
  isOpen,
  onClose,
  onApplySplit
}: WorkoutSplitLibraryModalProps) {
  const { isRTL, tMuscle, tExercise } = useTranslation();
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ppl-6day');
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0);
  const [isApplying, setIsApplying] = useState(false);

  const selectedProgram =
    WORKOUT_SPLIT_PROGRAMS.find(p => p.id === selectedProgramId) ||
    WORKOUT_SPLIT_PROGRAMS[0];

  const handleApply = (program: SplitProgram) => {
    setIsApplying(true);
    gymAudio.playCelebrationFanfare();
    gymAudio.triggerSubtleHaptic([40, 60, 40]);
    onApplySplit(program);
    setTimeout(() => {
      setIsApplying(false);
      onClose();
    }, 450);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRTL ? 'مكتبة الجداول التدريبية' : 'Workout Split Templates'}
    >
      <div className="workout-splits-modal-content">
        <header className="workout-splits-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Layers size={17} aria-hidden="true" />
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8' }}>
              {isRTL ? 'خطط تدريبية علمية معتمدة' : 'Science-Backed Program Splits'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isRTL
              ? 'اختر الجدول المناسب لهدفك ووقتك وطبقه بنقرة واحدة على الأسبوع الحالي (مع استبعاد يوم الجمعة للراحة التامة تلقائياً).'
              : 'Choose a program tailored to your goals and apply it to your current week in 1-click (Friday is automatically preserved as rest day).'}
          </p>
        </header>

        {/* Program Selection Tabs */}
        <div
          role="tablist"
          className="workout-splits-tabs"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '0.65rem',
            marginBottom: '1.25rem'
          }}
        >
          {WORKOUT_SPLIT_PROGRAMS.map(program => {
            const isSelected = program.id === selectedProgram.id;
            return (
              <button
                key={program.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  gymAudio.triggerSubtleHaptic([15]);
                  setSelectedProgramId(program.id);
                  setExpandedDayIndex(0);
                }}
                className={`workout-split-tab-card touch-target ${isSelected ? 'is-selected' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'var(--bg-secondary)',
                  border: isSelected
                    ? '1.5px solid #38bdf8'
                    : '1px solid var(--premium-line)',
                  boxShadow: isSelected
                    ? '0 8px 24px -6px rgba(56, 189, 248, 0.35)'
                    : 'none',
                  cursor: 'pointer',
                  textAlign: isRTL ? 'right' : 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: isSelected ? '#38bdf8' : 'var(--bg-tertiary)',
                      color: isSelected ? '#04121b' : 'var(--text-muted)'
                    }}
                  >
                    {isRTL ? `${program.daysPerWeek} أيام / أسبوع` : `${program.daysPerWeek} Days/Wk`}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: isSelected ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                    {isRTL ? program.goalAr : program.goal}
                  </span>
                </div>
                <strong style={{ fontSize: '0.92rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  {isRTL ? program.nameAr : program.name}
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {isRTL ? program.taglineAr : program.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Program Showcase & Day Inspector */}
        <div
          className="workout-split-detail-card"
          style={{
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)',
            borderRadius: '18px',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {isRTL ? selectedProgram.nameAr : selectedProgram.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {isRTL ? selectedProgram.levelAr : selectedProgram.level}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {isRTL ? selectedProgram.descriptionAr : selectedProgram.description}
              </p>
            </div>

            <button
              type="button"
              disabled={isApplying}
              onClick={() => handleApply(selectedProgram)}
              className="touch-target-comfortable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#04121b',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(0, 242, 254, 0.4)',
                minHeight: '44px',
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={16} aria-hidden="true" />
              <span>{isRTL ? 'تطبيق على هذا الأسبوع ⚡' : 'Apply to This Week ⚡'}</span>
            </button>
          </div>

          {/* Days Accordion */}
          <div className="workout-split-days-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              {isRTL ? `تفاصيل الجلسات (${selectedProgram.days.length} أيام تمرين)` : `Program Schedule (${selectedProgram.days.length} Training Days)`}
            </span>

            {selectedProgram.days.map((day, idx) => {
              const isExpanded = expandedDayIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '12px',
                    border: isExpanded ? '1px solid #38bdf8' : '1px solid var(--premium-line)',
                    background: isExpanded ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-secondary)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDayIndex(isExpanded ? null : idx)}
                    className="touch-target"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isExpanded ? '#38bdf8' : 'var(--bg-tertiary)',
                          color: isExpanded ? '#04121b' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.88rem' }}>
                        {isRTL ? day.titleAr : day.title}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {day.targetMuscles.map(m => (
                          <span
                            key={m}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.4rem',
                              borderRadius: '4px',
                              background: 'var(--premium-soft)',
                              color: 'var(--accent-primary)'
                            }}
                          >
                            {tMuscle(m)}
                          </span>
                        ))}
                      </div>
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          padding: '0 1rem 0.85rem',
                          borderTop: '1px solid var(--premium-line)',
                          paddingTop: '0.65rem'
                        }}
                      >
                        <div style={{ display: 'grid', gap: '0.45rem' }}>
                          {day.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '8px',
                                background: 'var(--bg-tertiary)',
                                fontSize: '0.82rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <Dumbbell size={13} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontWeight: 600 }}>{tExercise(ex.name)}</span>
                              </div>
                              <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {ex.sets.length} {isRTL ? 'جولات' : 'sets'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Friday Rest Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            fontSize: '0.78rem'
          }}
        >
          <Sparkles size={14} flex-shrink={0} />
          <span>
            {isRTL
              ? 'تذكير: يوم الجمعة مخصص للراحة والاستشفاء التام (الجيم مغلق)، ولن يتم جدولة أي تمارين فيه.'
              : 'Note: Friday is strictly preserved for full rest & recovery (the gym is closed); no sessions will be scheduled on Friday.'}
          </span>
        </div>
      </div>
    </Modal>
  );
}
