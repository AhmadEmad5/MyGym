import { useState, useMemo } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { 
  ExerciseTutorial, 
  MuscleGroupKey, 
  getExerciseBiomechanics 
} from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';

interface ExerciseMuscleHologramProps {
  tutorial: ExerciseTutorial;
}

const MUSCLE_NAMES: Record<MuscleGroupKey, { en: string; ar: string; roleEn: string; roleAr: string; view: 'front' | 'back' }> = {
  chest: {
    en: 'Chest (Pectoralis Major & Minor)',
    ar: 'Ø§Ù„ØµØ¯Ø± (Ø§Ù„ÙƒØ¨ÙŠØ± ÙˆØ§Ù„ØµØºÙŠØ±)',
    roleEn: 'Prime Mover: Horizontal adduction and pressing power',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø§Ù„Ø¶Ù… Ø§Ù„Ø£ÙÙ‚ÙŠ ÙˆÙ‚ÙˆØ© Ø§Ù„Ø¯ÙØ¹ Ù„Ù„Ø£Ù…Ø§Ù…',
    view: 'front'
  },
  shoulders: {
    en: 'Deltoids (Anterior, Lateral, Posterior)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„ÙƒØªÙ (Ø§Ù„Ø£Ù…Ø§Ù…ÙŠØŒ Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠØŒ Ø§Ù„Ø®Ù„ÙÙŠ)',
    roleEn: 'Prime Mover / Synergist: Arm abduction, overhead flexion and stabilization',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ø£Ùˆ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯: Ø±ÙØ¹ Ø§Ù„Ø°Ø±Ø§Ø¹ØŒ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø±Ø£Ø³ÙŠØŒ ÙˆØªØ«Ø¨ÙŠØª Ù…ÙØµÙ„ Ø§Ù„ÙƒØªÙ',
    view: 'front'
  },
  biceps: {
    en: 'Biceps Brachii',
    ar: 'Ø¹Ø¶Ù„Ø© Ø§Ù„Ø¨Ø§ÙŠØ³Ø¨Ø³ (Ø«Ù†Ø§Ø¦ÙŠØ© Ø§Ù„Ø±Ø¤ÙˆØ³)',
    roleEn: 'Prime Mover / Synergist: Elbow flexion and forearm supination',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø«Ù†ÙŠ Ù…ÙØµÙ„ Ø§Ù„ÙƒÙˆØ¹ ÙˆØ¯ÙˆØ±Ø§Ù† Ø§Ù„Ø³Ø§Ø¹Ø¯ Ù„Ù„Ø®Ø§Ø±Ø¬',
    view: 'front'
  },
  abs: {
    en: 'Core (Rectus Abdominis & Obliques)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø¨Ø·Ù† ÙˆØ§Ù„Ø¬Ø°Ø¹ (Ø§Ù„Ù…Ø³ØªÙ‚ÙŠÙ…Ø© ÙˆØ§Ù„Ù…Ø§Ø¦Ù„Ø©)',
    roleEn: 'Core Stabilizer / Flexion: Spinal protection and force transmission',
    roleAr: 'Ø§Ù„Ù…Ø«Ø¨Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¹Ù…ÙˆØ¯ Ø§Ù„ÙÙ‚Ø±ÙŠ ÙˆÙ†Ù‚Ù„ Ø§Ù„Ù‚ÙˆØ© ÙˆØªØ«Ø¨ÙŠØª Ø§Ù„Ø­ÙˆØ¶',
    view: 'front'
  },
  quads: {
    en: 'Quadriceps Femoris',
    ar: 'Ø§Ù„ÙƒÙˆØ§Ø¯Ø³ÙŠØ¨Ø³ (Ø¹Ø¶Ù„Ø© Ø§Ù„ÙØ®Ø° Ø§Ù„Ø£Ù…Ø§Ù…ÙŠØ© Ø±Ø¨Ø§Ø¹ÙŠØ© Ø§Ù„Ø±Ø¤ÙˆØ³)',
    roleEn: 'Prime Mover: Powerful knee extension and stance stability',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: ÙØ±Ø¯ Ù…ÙØµÙ„ Ø§Ù„Ø±ÙƒØ¨Ø© ÙˆØªØ«Ø¨ÙŠØª ÙˆØ¶Ø¹ÙŠØ© Ø§Ù„ÙˆÙ‚ÙˆÙ ÙˆØ§Ù„Ø¯ÙØ¹',
    view: 'front'
  },
  traps: {
    en: 'Trapezius (Upper, Middle, Lower)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„ØªØ±Ø§Ø¨ÙŠØ³ (Ø§Ù„Ø¹Ù„ÙˆÙŠØ© ÙˆØ§Ù„ÙˆØ³Ø·Ù‰ ÙˆØ§Ù„Ø³ÙÙ„ÙŠØ©)',
    roleEn: 'Stabilizer / Scapular control: Shoulder elevation and retraction',
    roleAr: 'Ø¹Ø¶Ù„Ø© ØªØ«Ø¨ÙŠØª: Ø±ÙØ¹ ÙˆØ³Ø­Ø¨ Ù„ÙˆØ­ÙŠ Ø§Ù„ÙƒØªÙ Ù„Ù„Ø®Ù„Ù ÙˆØ§Ù„Ø£Ø³ÙÙ„ ÙˆØ­Ù…Ø§ÙŠØ© Ø§Ù„Ø±Ù‚Ø¨Ø©',
    view: 'back'
  },
  lats: {
    en: 'Latissimus Dorsi',
    ar: 'Ø¹Ø¶Ù„Ø© Ø§Ù„Ù…Ø¬Ù†Øµ (Ø§Ù„Ø¸Ù‡Ø± Ø§Ù„Ø¹Ø±ÙŠØ¶Ø©)',
    roleEn: 'Prime Mover: Shoulder adduction, extension, and horizontal pulling',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø³Ø­Ø¨ Ø§Ù„Ø°Ø±Ø§Ø¹ÙŠÙ† Ù„Ù„Ø£Ø³ÙÙ„ ÙˆØ§Ù„Ø¯Ø§Ø®Ù„ØŒ ÙˆØªÙˆÙ„ÙŠØ¯ Ù‚ÙˆØ© Ø§Ù„Ø³Ø­Ø¨ Ø§Ù„Ø¹Ø±ÙŠØ¶Ø©',
    view: 'back'
  },
  triceps: {
    en: 'Triceps Brachii',
    ar: 'Ø¹Ø¶Ù„Ø© Ø§Ù„ØªØ±Ø§ÙŠØ³Ø¨Ø³ (Ø«Ù„Ø§Ø«ÙŠØ© Ø§Ù„Ø±Ø¤ÙˆØ³)',
    roleEn: 'Prime Mover / Synergist: Complete elbow extension and pressing lockout',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ø£Ùˆ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯: ÙØ±Ø¯ Ù…ÙØµÙ„ Ø§Ù„ÙƒÙˆØ¹ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆØ¥Ø­ÙƒØ§Ù… Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ',
    view: 'back'
  },
  lowerBack: {
    en: 'Erector Spinae (Lower Back)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø£Ø³ÙÙ„ Ø§Ù„Ø¸Ù‡Ø± (Ù†Ø§ØµØ¨Ø§Øª Ø§Ù„ÙÙ‚Ø§Ø±)',
    roleEn: 'Core & Spinal Stabilizer: Resists flexion and secures axial loading',
    roleAr: 'Ù…Ø«Ø¨Øª ÙÙ‚Ø±ÙŠ Ø±Ø¦ÙŠØ³ÙŠ: Ù…Ù‚Ø§ÙˆÙ…Ø© Ø§Ù„Ø§Ù†Ø­Ù†Ø§Ø¡ ÙˆØ­Ù…Ø§ÙŠØ© Ø§Ù„ÙÙ‚Ø±Ø§Øª ØªØ­Øª Ø§Ù„Ø£Ø­Ù…Ø§Ù„ Ø§Ù„Ù…Ø­ÙˆØ±ÙŠØ©',
    view: 'back'
  },
  glutes: {
    en: 'Gluteus Maximus & Medius',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø¬Ù„ÙˆØªØ³ (Ø§Ù„Ù…Ø¤Ø®Ø±Ø© ÙˆØ§Ù„Ø­ÙˆØ¶)',
    roleEn: 'Prime Mover: Hip extension, external rotation, and posterior pelvic drive',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: ÙØ±Ø¯ Ù…ÙØµÙ„ Ø§Ù„Ø­ÙˆØ¶ Ø¨Ù‚ÙˆØ© ÙˆØ§Ù„Ø¯ÙØ¹ Ø§Ù„Ø­Ø±ÙƒÙŠ ÙˆØªØ«Ø¨ÙŠØª Ø§Ù„Ø±ÙƒØ¨ØªÙŠÙ†',
    view: 'back'
  },
  hamstrings: {
    en: 'Hamstrings (Biceps Femoris, Semitendinosus)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„ÙØ®Ø° Ø§Ù„Ø®Ù„ÙÙŠØ© (Ø§Ù„Ù‡Ø§Ù…Ø³ØªØ±ÙŠÙ†Øº)',
    roleEn: 'Prime Mover: Knee flexion, hip extension, and decelerating force',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø«Ù†ÙŠ Ø§Ù„Ø±ÙƒØ¨Ø© ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© ÙÙŠ Ø¨Ø³Ø· Ø§Ù„Ø­ÙˆØ¶ ÙˆØ§Ù„Ù†Ø²ÙˆÙ„ Ø§Ù„Ù…ØªØ­ÙƒÙ…',
    view: 'back'
  },
  calves: {
    en: 'Calves (Gastrocnemius & Soleus)',
    ar: 'Ø¹Ø¶Ù„Ø§Øª Ø§Ù„Ø³Ù…Ø§Ù†Ø© (Ø§Ù„ÙƒØ§Ù„ÙØ² ÙˆØ§Ù„Ø³Ù…Ø­Ø§Ù‚ÙŠØ©)',
    roleEn: 'Prime Mover / Stance: Plantar flexion and ankle propulsion',
    roleAr: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ø¯ÙØ¹ Ù…Ø´Ø· Ø§Ù„Ù‚Ø¯Ù… Ù„Ø£Ø³ÙÙ„ ÙˆØªØ«Ø¨ÙŠØª ØªÙˆØ§Ø²Ù† Ø§Ù„ÙƒØ§Ø­Ù„',
    view: 'back'
  }
};

export function ExerciseMuscleHologram({ tutorial }: ExerciseMuscleHologramProps) {
  const { isRTL } = useTranslation();
  const biomechanics = useMemo(() => getExerciseBiomechanics(tutorial), [tutorial]);

  const defaultView = MUSCLE_NAMES[biomechanics.primaryMuscle]?.view || 'front';
  const [activeView, setActiveView] = useState<'front' | 'back'>(defaultView);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroupKey>(biomechanics.primaryMuscle);

  const primaryKey = biomechanics.primaryMuscle;
  const secondaryKeys = biomechanics.secondaryMuscles;

  const isMusclePrimary = (id: MuscleGroupKey) => id === primaryKey;
  const isMuscleSecondary = (id: MuscleGroupKey) => secondaryKeys.includes(id);

  const getMuscleColor = (id: MuscleGroupKey) => {
    if (isMusclePrimary(id)) return '#ff3b3b'; // vibrant glowing red/neon
    if (isMuscleSecondary(id)) return '#38bdf8'; // vivid cyan/teal
    if (selectedMuscle === id) return '#f59e0b'; // amber
    return '#1e293b'; // rested dark anatomical slate
  };

  const getMuscleOpacity = (id: MuscleGroupKey) => {
    if (isMusclePrimary(id)) return 0.95;
    if (isMuscleSecondary(id)) return 0.8;
    if (selectedMuscle === id) return 0.7;
    return 0.35;
  };

  const selectedInfo = MUSCLE_NAMES[selectedMuscle] || MUSCLE_NAMES[primaryKey];

  const viewMuscles: MuscleGroupKey[] = activeView === 'front'
    ? ['chest', 'shoulders', 'biceps', 'abs', 'quads', 'calves']
    : ['traps', 'lats', 'triceps', 'lowerBack', 'glutes', 'hamstrings', 'calves'];

  const muscleLabel = (id: MuscleGroupKey) => {
    const info = MUSCLE_NAMES[id];
    return isRTL ? info.ar : info.en;
  };

  const roleLabel = (id: MuscleGroupKey) => {
    if (isMusclePrimary(id)) return isRTL ? 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ' : 'Prime mover';
    if (isMuscleSecondary(id)) return isRTL ? 'Ø¹Ø¶Ù„Ø© Ù…Ø³Ø§Ø¹Ø¯Ø©' : 'Synergist';
    return isRTL ? 'Ø¹Ø¶Ù„Ø© Ø«Ø§Ù†ÙˆÙŠØ©' : 'Secondary';
  };

  const selectMuscle = (id: MuscleGroupKey) => {
    setSelectedMuscle(id);
    if (MUSCLE_NAMES[id]?.view && MUSCLE_NAMES[id].view !== activeView) {
      setActiveView(MUSCLE_NAMES[id].view);
    }
  };

  return (
    <div className="muscle-hologram-card" style={{
      background: 'var(--premium-surface)',
      border: '1px solid var(--premium-line)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.35rem',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(239, 68, 68, 0.25)'
          }}>
            <Activity size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'Ø§Ù„ØªØ´Ø±ÙŠØ­ Ø§Ù„Ø¹Ø¶Ù„ÙŠ Ø§Ù„Ù…Ø¬Ø³Ù…' : '3D Anatomical Muscle Map'}
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL ? `Ø§Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: ${biomechanics.activationScore}%` : `Primary Activation: ${biomechanics.activationScore}%`}
            </span>
          </div>
        </div>

        {/* Front / Back Switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            type="button"
            onClick={() => setActiveView('front')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: activeView === 'front' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
              color: activeView === 'front' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.76rem',
              fontWeight: 750,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: activeView === 'front' ? '0 2px 10px rgba(56, 189, 248, 0.35)' : 'none'
            }}
          >
            {isRTL ? 'Ø£Ù…Ø§Ù…ÙŠ' : 'Front'}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: activeView === 'back' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
              color: activeView === 'back' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.76rem',
              fontWeight: 750,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: activeView === 'back' ? '0 2px 10px rgba(56, 189, 248, 0.35)' : 'none'
            }}
          >
            {isRTL ? 'Ø®Ù„ÙÙŠ' : 'Back'}
          </button>
        </div>
      </div>

      {/* Main Grid: Hologram SVG + Muscle Role Details Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1fr) 1.2fr',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {/* SVG Human Anatomical Silhouette with Muscle Meshes */}
        <div style={{
          position: 'relative',
          height: '280px',
          background: 'radial-gradient(circle at center, rgba(16, 26, 48, 0.7) 0%, rgba(4, 7, 17, 0.95) 75%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Subtle Grid backdrop */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(70, 217, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            pointerEvents: 'none'
          }} />

          {/* SVG Body Model */}
          <svg
            viewBox="0 0 240 420"
            role="img"
            aria-label={isRTL
              ? `Ø®Ø±ÙŠØ·Ø© ØªØ´Ø±ÙŠØ­ Ø¹Ø¶Ù„ÙŠ ${activeView === 'front' ? 'Ø£Ù…Ø§Ù…ÙŠØ©' : 'Ø®Ù„ÙÙŠØ©'}. ${viewMuscles.map(id => `${muscleLabel(id)}: ${roleLabel(id)}`).join('ØŒ ')}.`
              : `${activeView === 'front' ? 'Front' : 'Back'} anatomical muscle map. ${viewMuscles.map(id => `${muscleLabel(id)}: ${roleLabel(id)}`).join(', ')}.`}
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '270px',
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
          >
            <defs>
              <filter id="holoNeonRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="holoNeonCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base Body Silhouette Outline */}
            <g stroke="#334155" strokeWidth="1.5" fill="#0b1220" opacity="0.85">
              {/* Head & Neck */}
              <circle cx="120" cy="38" r="20" />
              <path d="M 112 58 L 112 70 L 128 70 L 128 58 Z" />
            </g>

            {/* ================= FRONT VIEW MUSCLES ================= */}
            {activeView === 'front' && (
              <g>
                {/* Chest (Pectoralis) */}
                <g 
                  onClick={() => selectMuscle('chest')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('chest') ? 'url(#holoNeonRed)' : isMuscleSecondary('chest') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 92 88 C 100 88 116 88 118 108 C 114 116 96 118 90 114 C 86 102 88 92 92 88 Z" 
                    fill={getMuscleColor('chest')} 
                    opacity={getMuscleOpacity('chest')}
                    stroke={isMusclePrimary('chest') ? '#ffffff' : '#475569'}
                    strokeWidth="1"
                  />
                  <path 
                    d="M 148 88 C 140 88 124 88 122 108 C 126 116 144 118 150 114 C 154 102 152 92 148 88 Z" 
                    fill={getMuscleColor('chest')} 
                    opacity={getMuscleOpacity('chest')}
                    stroke={isMusclePrimary('chest') ? '#ffffff' : '#475569'}
                    strokeWidth="1"
                  />
                </g>

                {/* Shoulders (Anterior & Lateral Deltoids) */}
                <g 
                  onClick={() => selectMuscle('shoulders')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('shoulders') ? 'url(#holoNeonRed)' : isMuscleSecondary('shoulders') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 72 84 C 82 78 88 84 86 104 C 76 106 68 98 72 84 Z" 
                    fill={getMuscleColor('shoulders')} 
                    opacity={getMuscleOpacity('shoulders')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 168 84 C 158 78 152 84 154 104 C 164 106 172 98 168 84 Z" 
                    fill={getMuscleColor('shoulders')} 
                    opacity={getMuscleOpacity('shoulders')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Biceps */}
                <g 
                  onClick={() => selectMuscle('biceps')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('biceps') ? 'url(#holoNeonRed)' : isMuscleSecondary('biceps') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 66 112 C 74 110 78 122 74 140 C 66 138 62 126 66 112 Z" 
                    fill={getMuscleColor('biceps')} 
                    opacity={getMuscleOpacity('biceps')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 174 112 C 166 110 162 122 166 140 C 174 138 178 126 174 112 Z" 
                    fill={getMuscleColor('biceps')} 
                    opacity={getMuscleOpacity('biceps')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Forearms */}
                <path d="M 58 148 L 68 145 L 60 195 L 52 195 Z" fill="#1e293b" opacity="0.5" />
                <path d="M 182 148 L 172 145 L 180 195 L 188 195 Z" fill="#1e293b" opacity="0.5" />

                {/* Abs & Core */}
                <g 
                  onClick={() => selectMuscle('abs')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('abs') ? 'url(#holoNeonRed)' : isMuscleSecondary('abs') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 104 122 C 112 120 128 120 136 122 C 138 152 134 175 120 180 C 106 175 102 152 104 122 Z" 
                    fill={getMuscleColor('abs')} 
                    opacity={getMuscleOpacity('abs')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Quadriceps (Front Thighs) */}
                <g 
                  onClick={() => selectMuscle('quads')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('quads') ? 'url(#holoNeonRed)' : isMuscleSecondary('quads') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 94 192 C 108 190 114 204 112 260 C 98 262 86 245 88 205 Z" 
                    fill={getMuscleColor('quads')} 
                    opacity={getMuscleOpacity('quads')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 146 192 C 132 190 126 204 128 260 C 142 262 154 245 152 205 Z" 
                    fill={getMuscleColor('quads')} 
                    opacity={getMuscleOpacity('quads')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Calves (Front Tibialis & Gastrocnemius edges) */}
                <g 
                  onClick={() => selectMuscle('calves')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('calves') ? 'url(#holoNeonRed)' : isMuscleSecondary('calves') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 92 278 C 100 278 104 290 102 345 C 92 342 86 325 88 290 Z" 
                    fill={getMuscleColor('calves')} 
                    opacity={getMuscleOpacity('calves')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 148 278 C 140 278 136 290 138 345 C 148 342 154 325 152 290 Z" 
                    fill={getMuscleColor('calves')} 
                    opacity={getMuscleOpacity('calves')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>
              </g>
            )}

            {/* ================= BACK VIEW MUSCLES ================= */}
            {activeView === 'back' && (
              <g>
                {/* Trapezius (Diamond) */}
                <g 
                  onClick={() => selectMuscle('traps')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('traps') ? 'url(#holoNeonRed)' : isMuscleSecondary('traps') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 120 68 L 145 88 L 120 130 L 95 88 Z" 
                    fill={getMuscleColor('traps')} 
                    opacity={getMuscleOpacity('traps')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Latissimus Dorsi (Lats) */}
                <g 
                  onClick={() => selectMuscle('lats')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('lats') ? 'url(#holoNeonRed)' : isMuscleSecondary('lats') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 88 105 C 104 105 116 115 116 160 C 96 155 84 135 88 105 Z" 
                    fill={getMuscleColor('lats')} 
                    opacity={getMuscleOpacity('lats')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 152 105 C 136 105 124 115 124 160 C 144 155 156 135 152 105 Z" 
                    fill={getMuscleColor('lats')} 
                    opacity={getMuscleOpacity('lats')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Triceps */}
                <g 
                  onClick={() => selectMuscle('triceps')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('triceps') ? 'url(#holoNeonRed)' : isMuscleSecondary('triceps') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 66 108 C 76 108 78 120 74 140 C 66 138 62 125 66 108 Z" 
                    fill={getMuscleColor('triceps')} 
                    opacity={getMuscleOpacity('triceps')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 174 108 C 164 108 162 120 166 140 C 174 138 178 125 174 108 Z" 
                    fill={getMuscleColor('triceps')} 
                    opacity={getMuscleOpacity('triceps')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Lower Back (Erectors) */}
                <g 
                  onClick={() => selectMuscle('lowerBack')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('lowerBack') ? 'url(#holoNeonRed)' : isMuscleSecondary('lowerBack') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 106 150 C 114 148 126 148 134 150 C 136 178 130 185 120 185 C 110 185 104 178 106 150 Z" 
                    fill={getMuscleColor('lowerBack')} 
                    opacity={getMuscleOpacity('lowerBack')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Glutes (Maximus & Medius) */}
                <g 
                  onClick={() => selectMuscle('glutes')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('glutes') ? 'url(#holoNeonRed)' : isMuscleSecondary('glutes') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 94 186 C 108 184 118 190 118 220 C 104 225 90 215 94 186 Z" 
                    fill={getMuscleColor('glutes')} 
                    opacity={getMuscleOpacity('glutes')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 146 186 C 132 184 122 190 122 220 C 136 225 150 215 146 186 Z" 
                    fill={getMuscleColor('glutes')} 
                    opacity={getMuscleOpacity('glutes')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Hamstrings */}
                <g 
                  onClick={() => selectMuscle('hamstrings')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('hamstrings') ? 'url(#holoNeonRed)' : isMuscleSecondary('hamstrings') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 94 224 C 112 224 114 235 110 268 C 98 268 90 252 94 224 Z" 
                    fill={getMuscleColor('hamstrings')} 
                    opacity={getMuscleOpacity('hamstrings')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 146 224 C 128 224 126 235 130 268 C 142 268 150 252 146 224 Z" 
                    fill={getMuscleColor('hamstrings')} 
                    opacity={getMuscleOpacity('hamstrings')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>

                {/* Calves (Gastrocnemius Diamond) */}
                <g 
                  onClick={() => selectMuscle('calves')}
                  style={{ cursor: 'pointer' }}
                  filter={isMusclePrimary('calves') ? 'url(#holoNeonRed)' : isMuscleSecondary('calves') ? 'url(#holoNeonCyan)' : undefined}
                >
                  <path 
                    d="M 92 278 C 102 278 106 295 102 342 C 90 340 86 320 88 285 Z" 
                    fill={getMuscleColor('calves')} 
                    opacity={getMuscleOpacity('calves')}
                    stroke="#475569" strokeWidth="1"
                  />
                  <path 
                    d="M 148 278 C 138 278 134 295 138 342 C 150 340 154 320 152 285 Z" 
                    fill={getMuscleColor('calves')} 
                    opacity={getMuscleOpacity('calves')}
                    stroke="#475569" strokeWidth="1"
                  />
                </g>
              </g>
            )}
          </svg>

          {/* Touch to inspect hint */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.6)',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            pointerEvents: 'none'
          }}>
            {isRTL ? 'Ø§Ù„Ù…Ø³ Ø§Ù„Ø¹Ø¶Ù„Ø© Ù„ÙØ­Øµ Ø¯ÙˆØ±Ù‡Ø§ Ø§Ù„Ù…ÙŠÙƒØ§Ù†ÙŠÙƒÙŠ' : 'Tap muscle to inspect role'}
          </div>
        </div>

        {/* Keyboard + screen-reader equivalent for the anatomical map */}
        <div
          role="group"
          aria-label={isRTL ? 'Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø¹Ø¶Ù„Ø©' : 'Select a muscle group'}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}
        >
          {viewMuscles.map(id => {
            const isSelected = selectedMuscle === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectMuscle(id)}
                onFocus={() => selectMuscle(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  minHeight: '40px',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--premium-line)',
                  background: isSelected ? 'var(--premium-soft)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isMusclePrimary(id) ? '#ff3b3b' : isMuscleSecondary(id) ? '#38bdf8' : isSelected ? '#f59e0b' : 'var(--border-color)'
                  }}
                />
                {muscleLabel(id)}
                <span className="forma-sr-only">{` â€” ${roleLabel(id)}`}</span>
              </button>
            );
          })}
        </div>

        {/* Muscle Information Details Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Primary vs Secondary Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {isMusclePrimary(selectedMuscle) ? (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.16)',
                color: '#ff4646',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4646' }} />
                {isRTL ? 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ù„Ù„ØªÙ…Ø±ÙŠÙ†' : 'Prime Mover (Target)'}
              </span>
            ) : isMuscleSecondary(selectedMuscle) ? (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.14)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                {isRTL ? 'Ø¹Ø¶Ù„Ø© Ù…Ø³Ø§Ø¹Ø¯Ø© ÙˆÙ…Ø«Ø¨ØªØ©' : 'Synergist & Stabilizer'}
              </span>
            ) : (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)'
              }}>
                {isRTL ? 'Ø¹Ø¶Ù„Ø© Ø«Ø§Ù†ÙˆÙŠØ©' : 'Secondary Muscle'}
              </span>
            )}

            {isMusclePrimary(selectedMuscle) && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                {biomechanics.activationScore}% {isRTL ? 'ÙƒÙØ§Ø¡Ø© Ø¹Ø²Ù„' : 'Activation'}
              </span>
            )}
          </div>

          {/* Selected Muscle Name */}
          <div>
            <h5 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? selectedInfo.ar : selectedInfo.en}
            </h5>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {isRTL ? selectedInfo.roleAr : selectedInfo.roleEn}
            </p>
          </div>

          {/* Biomechanical Angle & Form Cues */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isRTL ? 'Ø¥Ø´Ø§Ø±Ø§Øª Ø§Ù„ØªÙƒÙ†ÙŠÙƒ ÙˆØ§Ù„Ø²ÙˆØ§ÙŠØ§ Ø§Ù„Ù…ÙˆØµÙ‰ Ø¨Ù‡Ø§:' : 'Form & Angle Guidelines:'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {biomechanics.cues.map((cue, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? cue.labelAr : cue.label}
                  </span>
                  <span style={{ color: '#46d9ff', fontWeight: 700 }}>
                    {cue.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mind-Muscle Connection Tip */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <Sparkles size={14} style={{ color: '#eab308', flexShrink: 0, marginTop: '0.15rem' }} />
            <span>
              {isRTL ? tutorial.proTipAr : tutorial.proTip}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
