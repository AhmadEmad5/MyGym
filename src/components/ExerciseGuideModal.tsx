import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, Wind, Sparkles, CheckCircle2,
  Activity, Video, ChevronDown, ChevronUp
} from 'lucide-react';
import { getExerciseTutorial } from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';
import { ExerciseMuscleHologram } from './ExerciseMuscleHologram';
import { InAppYouTubePlayer } from './InAppYouTubePlayer';
import { useReducedMotion } from './performance/useReducedMotion';
import { useModalA11y } from './AIMealVisionModal';

interface ExerciseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  targetMuscle?: string;
  customVideoUrl?: string;
  customNotes?: string;
}

export function ExerciseGuideModal({
  isOpen,
  onClose,
  exerciseName,
  targetMuscle,
  customVideoUrl,
  customNotes
}: ExerciseGuideModalProps) {
  const { t, isRTL, tExercise } = useTranslation();
  const reducedMotion = useReducedMotion();
  // Video is the default because it is what an athlete opens mid-set; anatomy
  // is the deliberate second choice.
  const [visualMode, setVisualMode] = useState<'video' | 'anatomy'>('video');
  // Collapsed sections rather than tabs: the steps stay on screen as the
  // primary reference, and the rest is one tap away instead of competing.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ steps: true });
  const toggleSection = (id: string) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  // Escape, focus containment, focus restore and the scroll lock all come from
  // the shared hook so this dialog behaves like every other FORMA modal.
  const { panelRef } = useModalA11y(isOpen, onClose);

  const tutorial = useMemo(() => {
    return getExerciseTutorial(exerciseName, targetMuscle);
  }, [exerciseName, targetMuscle]);

  const rawVideo = customVideoUrl || tutorial.videoUrl;
  const equipmentAlternatives = useMemo(() => {
    const muscle = tutorial.targetMuscle.toLowerCase();
    if (muscle.includes('chest')) return isRTL ? ['ضغط دمبل على مقعد', 'ضغط أرضي', 'جهاز ضغط الصدر'] : ['Dumbbell bench press', 'Push-ups', 'Chest press machine'];
    if (muscle.includes('back') || muscle.includes('lat')) return isRTL ? ['سحب دمبل أحادي', 'سحب كابل جالس', 'عقلة بمساعدة'] : ['One-arm dumbbell row', 'Seated cable row', 'Assisted pull-up'];
    if (muscle.includes('leg') || muscle.includes('quad')) return isRTL ? ['سكوات كوبلت', 'اندفاعات', 'ضغط الأرجل'] : ['Goblet squat', 'Lunges', 'Leg press'];
    if (muscle.includes('shoulder')) return isRTL ? ['ضغط دمبل جالس', 'رفرفة جانبية بالكابل', 'جهاز الكتف'] : ['Seated dumbbell press', 'Cable lateral raise', 'Shoulder press machine'];
    if (muscle.includes('bicep')) return isRTL ? ['كيرل دمبل بالتبادل', 'كيرل كابل', 'كيرل مطرقة'] : ['Alternating dumbbell curl', 'Cable curl', 'Hammer curl'];
    if (muscle.includes('tricep')) return isRTL ? ['تمديد كابل بالحبل', 'ضغط ضيق', 'تمديد دمبل فوق الرأس'] : ['Rope pushdown', 'Close-grip push-up', 'Overhead dumbbell extension'];
    return isRTL ? ['نسخة بالدمبل', 'نسخة بالكابل', 'نسخة بوزن الجسم'] : ['Dumbbell variation', 'Cable variation', 'Bodyweight variation'];
  }, [tutorial.targetMuscle, isRTL]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="portal-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-modal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem',
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={panelRef}
          className="forma-exercise-guide forma-exercise-guide-panel ui-modal-panel"
          data-modal-state="open"
          role="dialog"
          aria-modal="true"
          aria-label={isRTL ? `دليل التمرين: ${tExercise(exerciseName)}` : `Exercise guide: ${exerciseName}`}
          tabIndex={-1}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          transition={reducedMotion ? { duration: 0.12 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // Never wider than the viewport minus its gutters, so a 375px phone
            // gets a full-bleed panel instead of a horizontal scrollbar.
            maxWidth: 'min(720px, 100%)',
            maxHeight: 'min(90dvh, 85vh)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            className="ui-modal-body min-h-0 overflow-y-auto overscroll-contain flex-1"
            style={{
              padding: '1.75rem',
              paddingBlockEnd: 'calc(1.75rem + max(12px, env(safe-area-inset-bottom, 0px)))'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(70, 217, 255, 0.12)',
                    color: '#46d9ff',
                    border: '1px solid rgba(70, 217, 255, 0.3)'
                  }}>
                    {isRTL ? tutorial.targetMuscleAr : tutorial.targetMuscle}
                  </span>

                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}>
                    {isRTL ? tutorial.equipmentAr : tutorial.equipment}
                  </span>

                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981'
                  }}>
                    {isRTL ? tutorial.difficultyAr : tutorial.difficulty}
                  </span>
                </div>

                <h2 className="font-display-semibold text-display-h2" style={{ margin: 0, color: 'var(--text-primary)' }}>
                  {tExercise(exerciseName)}
                </h2>
                {isRTL && tutorial.name !== exerciseName && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {tutorial.name}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn-icon btn-ghost touch-target"
                aria-label={t('close')}
                style={{
                  borderRadius: '10px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Overview text */}
            <p style={{ 
              fontSize: '0.92rem', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.6, 
              marginBottom: '1.25rem',
              background: 'var(--bg-tertiary)',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              borderLeft: isRTL ? 'none' : '3px solid var(--accent-primary)',
              borderRight: isRTL ? '3px solid var(--accent-primary)' : 'none'
            }}>
              {isRTL ? tutorial.overviewAr : tutorial.overview}
            </p>

            {/* Visual Presentation Mode Switcher */}
            <div
              className="forma-exercise-guide-switch"
              data-reduced-motion={reducedMotion ? 'true' : undefined}
              style={{
                display: 'flex',
                gap: '0.45rem',
                marginBottom: '1rem',
                padding: '0.35rem',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                onClick={() => setVisualMode('video')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  border: visualMode === 'video' ? '1px solid rgba(234, 179, 8, 0.45)' : '1px solid transparent',
                  background: visualMode === 'video' ? 'rgba(234, 179, 8, 0.18)' : 'transparent',
                  color: visualMode === 'video' ? '#facc15' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: visualMode === 'video' ? 800 : 600,
                  cursor: 'pointer',
                  transition: reducedMotion ? 'none' : 'all 0.18s'
                }}
              >
                <Video size={16} />
                <span>{isRTL ? 'فيديو الشرح المباشر' : 'Video Form Tutorial'}</span>
              </button>

              <button
                type="button"
                onClick={() => setVisualMode('anatomy')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  border: visualMode === 'anatomy' ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid transparent',
                  background: visualMode === 'anatomy' ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
                  color: visualMode === 'anatomy' ? '#ff6b6b' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: visualMode === 'anatomy' ? 800 : 600,
                  cursor: 'pointer',
                  transition: reducedMotion ? 'none' : 'all 0.18s'
                }}
              >
                <Activity size={16} />
                <span>{t('anatomyTab')}</span>
              </button>
            </div>

            {/* Visual Presentation Body */}
            <div style={{ marginBottom: '1.5rem' }}>
              {visualMode === 'anatomy' ? (
                <ExerciseMuscleHologram tutorial={tutorial} />
              ) : (
                <InAppYouTubePlayer
                  exerciseName={exerciseName}
                  targetMuscle={targetMuscle || tutorial.targetMuscle}
                  initialVideoUrl={rawVideo}
                />
              )}
            </div>

            {/* Collapsible reference sections */}
            <div className="forma-guide-sections" style={{ display: 'grid', gap: '0.6rem' }}>
              {[
                {
                  id: 'steps',
                  icon: CheckCircle2,
                  tone: 'var(--accent-primary)',
                  label: t('executionSteps'),
                  count: (isRTL ? tutorial.stepsAr : tutorial.steps).length
                },
                {
                  id: 'mistakes',
                  icon: AlertTriangle,
                  tone: 'var(--color-danger-ink)',
                  label: t('commonMistakes'),
                  count: (isRTL ? tutorial.commonMistakesAr : tutorial.commonMistakes).length
                },
                {
                  id: 'breathing',
                  icon: Wind,
                  tone: 'var(--color-info-ink)',
                  label: t('breathingGuide'),
                  count: null
                },
                {
                  id: 'proTip',
                  icon: Sparkles,
                  tone: 'var(--color-pr-hit)',
                  label: t('coachTips'),
                  count: null
                }
              ].map(section => {
                const Icon = section.icon;
                const isOpen = !!openSections[section.id];
                return (
                  <section
                    key={section.id}
                    className="forma-guide-section"
                    style={{
                      border: '1px solid var(--premium-line)',
                      borderRadius: '14px',
                      background: 'var(--bg-tertiary)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isOpen}
                      aria-controls={`forma-guide-section-${section.id}`}
                      className="touch-target"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        inlineSize: '100%',
                        minHeight: '52px',
                        padding: '0.6rem 0.9rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: isRTL ? 'right' : 'left',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Icon size={17} aria-hidden="true" style={{ color: section.tone, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem' }}>{section.label}</span>
                      {section.count !== null && (
                        <span
                          className="ui-badge-neutral"
                          style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}
                        >
                          {section.count}
                        </span>
                      )}
                      {isOpen
                        ? <ChevronUp size={18} aria-hidden="true" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        : <ChevronDown size={18} aria-hidden="true" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`forma-guide-section-${section.id}`}
                          initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                          animate={reducedMotion ? {} : { height: 'auto', opacity: 1 }}
                          exit={reducedMotion ? {} : { height: 0, opacity: 0 }}
                          transition={reducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 0.9rem 0.9rem' }}>
                            {section.id === 'steps' && (
                              <ol style={{ display: 'grid', gap: '0.6rem', margin: 0, padding: 0, listStyle: 'none' }}>
                                {(isRTL ? tutorial.stepsAr : tutorial.steps).map((step, idx) => (
                                  <li
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      gap: '0.75rem',
                                      alignItems: 'flex-start',
                                      fontSize: '0.9rem',
                                      lineHeight: 1.6,
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="font-display-medium tabular-nums"
                                      style={{
                                        inlineSize: '26px',
                                        blockSize: '26px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-primary)',
                                        color: '#07131b',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        flexShrink: 0
                                      }}
                                    >
                                      {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            )}

                            {section.id === 'mistakes' && (
                              <ul
                                style={{
                                  display: 'grid',
                                  gap: '0.6rem',
                                  margin: 0,
                                  padding: 0,
                                  listStyle: 'none'
                                }}
                              >
                                {(isRTL ? tutorial.commonMistakesAr : tutorial.commonMistakes).map((mistake, idx) => (
                                  <li
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      gap: '0.6rem',
                                      alignItems: 'flex-start',
                                      padding: '0.7rem 0.8rem',
                                      borderRadius: '10px',
                                      background: 'var(--color-danger-soft)',
                                      border: '1px solid var(--color-danger-line)',
                                      fontSize: '0.88rem',
                                      lineHeight: 1.6,
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <AlertTriangle size={16} aria-hidden="true" style={{ color: 'var(--color-danger-ink)', flexShrink: 0, marginBlockStart: '0.2rem' }} />
                                    <span>{mistake}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {section.id === 'breathing' && (
                              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                                {isRTL ? tutorial.breathingTipAr : tutorial.breathingTip}
                              </p>
                            )}

                            {section.id === 'proTip' && (
                              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                                {isRTL ? tutorial.proTipAr : tutorial.proTip}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>

            {/* Custom Notes if provided in session/routine */}
            {customNotes && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem'
              }}>
                <h5 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {isRTL ? 'ملاحظات إضافية مسجلة لهذا التمرين:' : 'Logged notes for this exercise:'}
                </h5>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                  {customNotes}
                </p>
              </div>
            )}

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.24)', marginBottom: '1.25rem'
            }}>
              <h5 style={{ margin: '0 0 0.6rem', fontSize: '0.88rem', color: '#34d399' }}>
                {isRTL ? 'النادي مزدحم؟ بدائل سريعة لنفس العضلة' : 'Equipment busy? Quick same-muscle swaps'}
              </h5>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {equipmentAlternatives.map((alternative) => <span key={alternative} style={{ padding: '0.3rem 0.55rem', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--text-primary)', fontSize: '0.78rem' }}>{alternative}</span>)}
              </div>
            </div>

            {/* Secondary Muscles Badges */}
            {tutorial.secondaryMuscles && tutorial.secondaryMuscles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t('secondaryMuscles')}:
                </span>
                {(isRTL ? tutorial.secondaryMusclesAr : tutorial.secondaryMuscles).map((m, i) => (
                  <span 
                    key={i}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
