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
    ar: 'الصدر (الكبير والصغير)',
    roleEn: 'Prime Mover: Horizontal adduction and pressing power',
    roleAr: 'المحرك الأساسي: الضم الأفقي وقوة الدفع للأمام',
    view: 'front'
  },
  shoulders: {
    en: 'Deltoids (Anterior, Lateral, Posterior)',
    ar: 'عضلات الكتف (الأمامي، الجانبي، الخلفي)',
    roleEn: 'Prime Mover / Synergist: Arm abduction, overhead flexion and stabilization',
    roleAr: 'المحرك الأساسي أو المساعد: رفع الذراع، الدفع الرأسي، وتثبيت مفصل الكتف',
    view: 'front'
  },
  biceps: {
    en: 'Biceps Brachii',
    ar: 'عضلة البايسبس (ثنائية الرؤوس)',
    roleEn: 'Prime Mover / Synergist: Elbow flexion and forearm supination',
    roleAr: 'المحرك الأساسي: ثني مفصل الكوع ودوران الساعد للخارج',
    view: 'front'
  },
  abs: {
    en: 'Core (Rectus Abdominis & Obliques)',
    ar: 'عضلات البطن والجذع (المستقيمة والمائلة)',
    roleEn: 'Core Stabilizer / Flexion: Spinal protection and force transmission',
    roleAr: 'المثبت الأساسي: حماية العمود الفقري ونقل القوة وتثبيت الحوض',
    view: 'front'
  },
  quads: {
    en: 'Quadriceps Femoris',
    ar: 'الكوادسيبس (عضلة الفخذ الأمامية رباعية الرؤوس)',
    roleEn: 'Prime Mover: Powerful knee extension and stance stability',
    roleAr: 'المحرك الأساسي: فرد مفصل الركبة وتثبيت وضعية الوقوف والدفع',
    view: 'front'
  },
  traps: {
    en: 'Trapezius (Upper, Middle, Lower)',
    ar: 'عضلات الترابيس (العلوية والوسطى والسفلية)',
    roleEn: 'Stabilizer / Scapular control: Shoulder elevation and retraction',
    roleAr: 'عضلة تثبيت: رفع وسحب لوحي الكتف للخلف والأسفل وحماية الرقبة',
    view: 'back'
  },
  lats: {
    en: 'Latissimus Dorsi',
    ar: 'عضلة المجنص (الظهر العريضة)',
    roleEn: 'Prime Mover: Shoulder adduction, extension, and horizontal pulling',
    roleAr: 'المحرك الأساسي: سحب الذراعين للأسفل والداخل، وتوليد قوة السحب العريضة',
    view: 'back'
  },
  triceps: {
    en: 'Triceps Brachii',
    ar: 'عضلة الترايسبس (ثلاثية الرؤوس)',
    roleEn: 'Prime Mover / Synergist: Complete elbow extension and pressing lockout',
    roleAr: 'المحرك الأساسي أو المساعد: فرد مفصل الكوع بالكامل وإحكام الدفع النهائي',
    view: 'back'
  },
  lowerBack: {
    en: 'Erector Spinae (Lower Back)',
    ar: 'عضلات أسفل الظهر (ناصبات الفقار)',
    roleEn: 'Core & Spinal Stabilizer: Resists flexion and secures axial loading',
    roleAr: 'مثبت فقري رئيسي: مقاومة الانحناء وحماية الفقرات تحت الأحمال المحورية',
    view: 'back'
  },
  glutes: {
    en: 'Gluteus Maximus & Medius',
    ar: 'عضلات الجلوتس (المؤخرة والحوض)',
    roleEn: 'Prime Mover: Hip extension, external rotation, and posterior pelvic drive',
    roleAr: 'المحرك الأساسي: فرد مفصل الحوض بقوة والدفع الحركي وتثبيت الركبتين',
    view: 'back'
  },
  hamstrings: {
    en: 'Hamstrings (Biceps Femoris, Semitendinosus)',
    ar: 'عضلات الفخذ الخلفية (الهامسترينغ)',
    roleEn: 'Prime Mover: Knee flexion, hip extension, and decelerating force',
    roleAr: 'المحرك الأساسي: ثني الركبة والمساعدة في بسط الحوض والنزول المتحكم',
    view: 'back'
  },
  calves: {
    en: 'Calves (Gastrocnemius & Soleus)',
    ar: 'عضلات السمانة (الكالفز والسمحاقية)',
    roleEn: 'Prime Mover / Stance: Plantar flexion and ankle propulsion',
    roleAr: 'المحرك الأساسي: دفع مشط القدم لأسفل وتثبيت توازن الكاحل',
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

  return (
    <div className="muscle-hologram-card" style={{
      background: 'linear-gradient(160deg, rgba(14, 22, 38, 0.95) 0%, rgba(8, 12, 22, 0.98) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.24)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
              {isRTL ? 'التشريح العضلي المجسم' : '3D Anatomical Muscle Map'}
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL ? `التفعيل الأساسي: ${biomechanics.activationScore}%` : `Primary Activation: ${biomechanics.activationScore}%`}
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
            {isRTL ? 'أمامي' : 'Front'}
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
            {isRTL ? 'خلفي' : 'Back'}
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
                  onClick={() => setSelectedMuscle('chest')}
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
                  onClick={() => setSelectedMuscle('shoulders')}
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
                  onClick={() => setSelectedMuscle('biceps')}
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
                  onClick={() => setSelectedMuscle('abs')}
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
                  onClick={() => setSelectedMuscle('quads')}
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
                  onClick={() => setSelectedMuscle('calves')}
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
                  onClick={() => setSelectedMuscle('traps')}
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
                  onClick={() => setSelectedMuscle('lats')}
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
                  onClick={() => setSelectedMuscle('triceps')}
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
                  onClick={() => setSelectedMuscle('lowerBack')}
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
                  onClick={() => setSelectedMuscle('glutes')}
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
                  onClick={() => setSelectedMuscle('hamstrings')}
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
                  onClick={() => setSelectedMuscle('calves')}
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
            borderRadius: '6px'
          }}>
            {isRTL ? 'المس العضلة لفحص دورها الميكانيكي' : 'Tap muscle to inspect role'}
          </div>
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
                {isRTL ? 'المحرك الأساسي للتمرين' : 'Prime Mover (Target)'}
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
                {isRTL ? 'عضلة مساعدة ومثبتة' : 'Synergist & Stabilizer'}
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
                {isRTL ? 'عضلة ثانوية' : 'Secondary Muscle'}
              </span>
            )}

            {isMusclePrimary(selectedMuscle) && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                {biomechanics.activationScore}% {isRTL ? 'كفاءة عزل' : 'Activation'}
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
              {isRTL ? 'إشارات التكنيك والزوايا الموصى بها:' : 'Form & Angle Guidelines:'}
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
