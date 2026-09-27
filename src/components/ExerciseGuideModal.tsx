import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, Wind, Sparkles, CheckCircle2,
  Activity, Video
} from 'lucide-react';
import { getExerciseTutorial } from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';
import { ExerciseMuscleHologram } from './ExerciseMuscleHologram';
import { InAppYouTubePlayer } from './InAppYouTubePlayer';

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
  const [visualMode, setVisualMode] = useState<'video' | 'anatomy'>('video');
  const [activeTab, setActiveTab] = useState<'steps' | 'mistakes' | 'breathing'>('steps');

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem',
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '1.75rem'
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

              <h2 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.45rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={t('close')}
            >
              <X size={18} />
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
          <div style={{
            display: 'flex',
            gap: '0.45rem',
            marginBottom: '1rem',
            padding: '0.35rem',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)'
          }}>
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
                transition: 'all 0.18s'
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
                transition: 'all 0.18s'
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

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'steps' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'steps' ? '#07131b' : 'var(--text-secondary)',
                fontWeight: activeTab === 'steps' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <CheckCircle2 size={15} />
              <span>{t('executionSteps')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mistakes')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'mistakes' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: activeTab === 'mistakes' ? '#f87171' : 'var(--text-secondary)',
                fontWeight: activeTab === 'mistakes' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <AlertTriangle size={15} />
              <span>{t('commonMistakes')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('breathing')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'breathing' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === 'breathing' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: activeTab === 'breathing' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Wind size={15} />
              <span>{t('breathingGuide')}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            {activeTab === 'steps' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(isRTL ? tutorial.stepsAr : tutorial.steps).map((step, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      background: 'var(--bg-tertiary)',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'var(--accent-primary)',
                      color: '#07131b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mistakes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(isRTL ? tutorial.commonMistakesAr : tutorial.commonMistakes).map((mistake, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '0.9rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    <div style={{
                      color: '#ef4444',
                      flexShrink: 0,
                      marginTop: '0.15rem'
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {mistake}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'breathing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}>
                  <div style={{ color: '#38bdf8', flexShrink: 0, marginTop: '0.2rem' }}>
                    <Wind size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      {isRTL ? 'إيقاع التنفس الصحيح' : 'Proper Breathing Rhythm'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {isRTL ? tutorial.breathingTipAr : tutorial.breathingTip}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coach's Golden Tip */}
          <div style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
            background: 'rgba(234, 179, 8, 0.08)',
            padding: '1rem 1.15rem',
            borderRadius: '14px',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ color: '#eab308', flexShrink: 0, marginTop: '0.15rem' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#eab308' }}>
                {t('coachTips')}
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {isRTL ? tutorial.proTipAr : tutorial.proTip}
              </p>
            </div>
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
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
