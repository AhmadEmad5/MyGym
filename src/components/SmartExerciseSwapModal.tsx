import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RefreshCw, Sparkles, Check, 
  ArrowRightLeft, Loader2, Info, Zap, ShieldAlert
} from 'lucide-react';
import { generateGeminiJson } from '../lib/gemini';
import { findExerciseSubstitutes, getExerciseTutorial } from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface SmartExerciseSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExerciseName: string;
  currentMuscle?: string;
  onSwap: (newExerciseName: string, newTargetMuscle: string) => void;
}

type FilterCategory = 'all' | 'dumbbell' | 'machine_cable' | 'bodyweight' | 'barbell';

export function SmartExerciseSwapModal({
  isOpen,
  onClose,
  currentExerciseName,
  currentMuscle = 'Chest',
  onSwap
}: SmartExerciseSwapModalProps) {
  const { isRTL } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [showInjuryMenu, setShowInjuryMenu] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCustomSubstitute, setAiCustomSubstitute] = useState<{
    name: string;
    nameAr: string;
    targetMuscle: string;
    equipmentAr: string;
    reasonAr: string;
  } | null>(null);

  const currentTutorial = useMemo(() => {
    return getExerciseTutorial(currentExerciseName, currentMuscle);
  }, [currentExerciseName, currentMuscle]);

  const substitutes = useMemo(() => {
    if (!isOpen) return [];
    return findExerciseSubstitutes(currentExerciseName, currentMuscle);
  }, [isOpen, currentExerciseName, currentMuscle]);

  const filteredSubstitutes = useMemo(() => {
    if (activeCategory === 'all') return substitutes;
    return substitutes.filter(s => s.category === activeCategory);
  }, [substitutes, activeCategory]);

  if (!isOpen) return null;

  const handleSelectSubstitute = (sub: { name: string; targetMuscle: string }) => {
    gymAudio.triggerSubtleHaptic([40, 50, 40]);
    gymAudio.playRestTimerChime();
    onSwap(sub.name, sub.targetMuscle);
    onClose();
  };

  const handleGenerateAISubstitute = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const prompt = `You are an elite sports biomechanist and personal trainer.
The athlete is currently performing the exercise: "${currentExerciseName}" (Target Muscle: ${currentMuscle}).
The equipment is busy or unavailable at the gym, or the athlete has a custom condition: "${customPrompt || 'Equipment is crowded, need immediate alternative'}".

Suggest 1 optimal substitute exercise that:
1. Matches the exact biomechanical angle and prime mover muscle group.
2. Can be performed immediately in a busy gym.
3. Responds strictly with valid JSON without markdown formatting:
{
  "name": "Dumbbell Bench Press",
  "nameAr": "ضغط بالدمبلز على بنش مستوي",
  "targetMuscle": "${currentMuscle}",
  "equipmentAr": "دمبلز ومقعد",
  "reasonAr": "بديل مباشر يحاكي نفس زاوية دفع الصدر مع أمان وتوفر أوسع في الجيم المزدحم."
}`;

      const parsed = await generateGeminiJson({
        prompt
      });

      if (parsed.name) {
        setAiCustomSubstitute(parsed);
      }
    } catch (err: any) {
      console.error('AI Exercise Swap error:', err);
      setAiError(isRTL ? 'تعذر إنشاء اقتراح بالذكاء الاصطناعي حالياً. يمكنك اختيار أحد البدائل الجاهزة أدناه.' : 'Could not generate AI substitute. Please pick a substitute from the list below.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleInjuryAutoSwap = async (jointNameAr: string, jointNameEn: string) => {
    setSelectedJoint(jointNameEn);
    gymAudio.triggerSubtleHaptic([35, 45]);

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const prompt = `You are a doctor of physical therapy and athletic performance trainer.
The athlete is performing: "${currentExerciseName}" (Target Muscle: ${currentMuscle}).
The athlete has acute joint pain or needs injury protection for: "${jointNameEn} (${jointNameAr})".

Suggest 1 optimal injury-safe substitute exercise that:
1. Effectively trains the target muscle (${currentMuscle}) without causing shear stress or impingement on the ${jointNameEn}.
2. Is accessible in any gym.
3. Responds strictly with valid JSON without markdown:
{
  "name": "Substitute Exercise Name",
  "nameAr": "اسم التمرين البديل بالعربية",
  "targetMuscle": "${currentMuscle}",
  "equipmentAr": "الأدوات المطلوبة",
  "reasonAr": "شرح بيوميكانيكي يوضح كيف يحمي هذا البديل ${jointNameAr} مع تفعيل ${currentMuscle}"
}`;

      const parsed = await generateGeminiJson({
        prompt
      });

      if (parsed.name) {
        setAiCustomSubstitute(parsed);
      }
    } catch (err: any) {
      console.error('AI Injury Swap error:', err);
      setActiveCategory('dumbbell');
    } finally {
      setIsGeneratingAI(false);
    }
  };


  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <motion.div
        className="card smart-swap-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          borderRadius: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.25))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {isRTL ? 'بديل ذكي فوري للتمرين' : 'Smart Exercise Swap'}
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'الجهاز مشغول في الجيم؟ استبدل فوراً مع الحفاظ على كل جولاتك' : 'Equipment busy? Swap instantly while keeping all logged sets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Exercise Banner */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          marginBottom: '1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isRTL ? 'التمرين الحالي المشغول' : 'Current Exercise'}
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRTL ? currentTutorial.nameAr : currentTutorial.name}
            </div>
          </div>
          <div style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.18)',
            color: '#38bdf8',
            fontWeight: 700
          }}>
            {isRTL ? currentTutorial.targetMuscleAr : currentTutorial.targetMuscle}
          </div>
        </div>

        {/* Quick 1-Tap Scenario Triggers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.65rem',
          marginBottom: '1rem'
        }}>
          {/* 1. Busy Equipment Button */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('dumbbell');
              gymAudio.triggerSubtleHaptic([30]);
            }}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              background: activeCategory === 'dumbbell' ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.22), rgba(249, 115, 22, 0.22))' : 'rgba(255, 255, 255, 0.04)',
              border: activeCategory === 'dumbbell' ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)',
              color: activeCategory === 'dumbbell' ? '#facc15' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <Zap size={17} style={{ color: '#facc15', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{isRTL ? 'الجهاز مشغول ⏳' : 'Equipment Busy ⏳'}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{isRTL ? 'بديل فوري بالدمبلز' : 'Instant free-weights'}</div>
            </div>
          </button>

          {/* 2. Joint Pain / Injury Safe Button */}
          <button
            type="button"
            onClick={() => {
              setShowInjuryMenu(prev => !prev);
              gymAudio.triggerSubtleHaptic([30]);
            }}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              background: showInjuryMenu ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(168, 85, 247, 0.2))' : 'rgba(255, 255, 255, 0.04)',
              border: showInjuryMenu ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
              color: showInjuryMenu ? '#f87171' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <ShieldAlert size={17} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{isRTL ? 'ألم مفصل / وقاية 🩹' : 'Joint Pain / Injury 🩹'}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{isRTL ? 'بدائل بدون إجهاد المفصل' : 'Zero joint stress swap'}</div>
            </div>
          </button>
        </div>

        {/* If Injury Menu is expanded: Joint selector pills */}
        <AnimatePresence>
          {showInjuryMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '14px',
                padding: '0.75rem 0.95rem',
                marginBottom: '1rem'
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171', display: 'block', marginBottom: '0.45rem' }}>
                {isRTL ? 'حدد المفصل الذي تشعر فيه بألم لاقتراح بديل طبي آمن لنفس العضلة:' : 'Select the joint experiencing discomfort for a biomechanically safe alternative:'}
              </span>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'shoulder', nameAr: 'مفصل الكتف', nameEn: 'Shoulder Joint' },
                  { id: 'lower_back', nameAr: 'أسفل الظهر والعمود الفقري', nameEn: 'Lower Back / Spine' },
                  { id: 'knee', nameAr: 'مفصل الركبة', nameEn: 'Knee Joint' },
                  { id: 'elbow_wrist', nameAr: 'الكوع والمعصم', nameEn: 'Elbow / Wrist' }
                ].map(j => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleInjuryAutoSwap(j.nameAr, j.nameEn)}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      background: selectedJoint === j.nameEn ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
                      color: selectedJoint === j.nameEn ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    🩹 {isRTL ? j.nameAr : j.nameEn}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filters */}
        <div style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1rem'
        }}>
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'dumbbell', labelAr: 'دمبلز 🏋️', labelEn: 'Dumbbells' },
            { id: 'machine_cable', labelAr: 'أجهزة وكابل ⚙️', labelEn: 'Machines & Cables' },
            { id: 'bodyweight', labelAr: 'وزن الجسم 🤸', labelEn: 'Bodyweight' },
            { id: 'barbell', labelAr: 'بار حر 🏋️‍♂️', labelEn: 'Barbell' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as FilterCategory)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: activeCategory === cat.id ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                background: activeCategory === cat.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-tertiary)',
                color: activeCategory === cat.id ? '#38bdf8' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isRTL ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Scrollable Substitutes List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: isRTL ? '0' : '0.25rem',
          paddingLeft: isRTL ? '0.25rem' : '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {/* AI Custom Card if generated */}
          {aiCustomSubstitute && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(6, 182, 212, 0.12))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Sparkles size={14} />
                <span>{isRTL ? 'اقتراح ذكاء اصطناعي مخصص (Gemini)' : 'Custom AI Recommended Alternative'}</span>
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {isRTL ? aiCustomSubstitute.nameAr : aiCustomSubstitute.name}
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {aiCustomSubstitute.reasonAr}
              </p>
              <button
                type="button"
                onClick={() => handleSelectSubstitute(aiCustomSubstitute)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Check size={16} />
                <span>{isRTL ? 'اعتماد هذا البديل الآن' : 'Swap to this Alternative'}</span>
              </button>
            </div>
          )}

          {/* Database Match Cards */}
          {filteredSubstitutes.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {isRTL ? sub.nameAr : sub.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {isRTL ? sub.equipmentAr : sub.equipment} · {isRTL ? sub.difficultyAr : sub.difficulty}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#38bdf8',
                  whiteSpace: 'nowrap'
                }}>
                  {isRTL ? sub.categoryAr : sub.category}
                </span>
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                {isRTL ? sub.matchReasonAr : sub.matchReason}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectSubstitute(sub)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#38bdf8';
                    e.currentTarget.style.color = '#0b111e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                    e.currentTarget.style.color = '#38bdf8';
                  }}
                >
                  <RefreshCw size={14} />
                  <span>{isRTL ? 'استبدال التمرين' : 'Swap Exercise'}</span>
                </button>
              </div>
            </div>
          ))}

          {filteredSubstitutes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isRTL ? 'لا توجد بدائل في هذا التصنيف. يمكنك تجربة "الكل" أو طلب اقتراح مخصص بالذكاء الاصطناعي.' : 'No substitutes in this category. Try "All" or request custom AI advice.'}
            </div>
          )}

          {/* AI Custom Request Section */}
          <div style={{
            marginTop: '0.5rem',
            padding: '1rem',
            borderRadius: '16px',
            background: 'rgba(168, 85, 247, 0.06)',
            border: '1px dashed rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <Sparkles size={16} style={{ color: '#c084fc' }} />
              <strong style={{ fontSize: '0.85rem', color: '#c084fc' }}>
                {isRTL ? 'طلب بديل خاص بظروفك (إصابة، معدات محدودة) عبر Gemini' : 'Custom AI Alternative via Gemini'}
              </strong>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={isRTL ? 'مثال: لدي ألم بالكتف، أو لا توجد أوزان ثقيلة...' : 'e.g. Mild shoulder pain, or no heavy dumbbells available...'}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateAISubstitute();
                }}
              />
              <button
                type="button"
                onClick={handleGenerateAISubstitute}
                disabled={isGeneratingAI}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isGeneratingAI ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {isGeneratingAI ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{isRTL ? 'اقتراح مخصص' : 'Generate AI'}</span>
              </button>
            </div>

            {aiError && (
              <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                {aiError}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Info size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span>
            {isRTL 
              ? 'ملاحظة: استبدال التمرين يحافظ بالكامل على عدد الجولات، الأوزان، والتكرارات المسجلة دون أي فقدان.' 
              : 'Note: Swapping preserves all recorded sets, weights, and repetitions.'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
