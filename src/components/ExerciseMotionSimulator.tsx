import { useState, useEffect, useRef, useMemo, Component, type ReactNode } from 'react';
import {
  Play, Pause, RotateCcw, Info, ArrowLeft, ArrowRight, AlertTriangle
} from 'lucide-react';
import {
  ExerciseTutorial,
  getExerciseBiomechanics,
  MotionPatternType
} from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';
import { RealisticExercise3DViewer } from './RealisticExercise3DViewer';
import { ExerciseMotionHeroCard } from './ExerciseMotionHeroCard';
import { useReducedMotion } from './performance/useReducedMotion';

interface ExerciseMotionSimulatorProps {
  tutorial: ExerciseTutorial;
}

interface SceneBoundaryProps {
  children: ReactNode;
  isRTL: boolean;
}

interface SceneBoundaryState {
  hasError: boolean;
}

class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  state: SceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="forma-state-panel is-error" role="alert">
          <AlertTriangle size={22} aria-hidden="true" />
          <strong>{this.props.isRTL ? 'تعذر تشغيل العرض ثلاثي الأبعاد' : 'The 3D view could not start'}</strong>
          <span>
            {this.props.isRTL
              ? 'يمكنك متابعة الإرشادات النصية للأداء دون مشاكل.'
              : 'You can still follow the written coaching cues below.'}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ExerciseMotionSimulator({ tutorial }: ExerciseMotionSimulatorProps) {
  const { t, isRTL } = useTranslation();
  const biomechanics = useMemo(() => getExerciseBiomechanics(tutorial), [tutorial]);
  const reducedMotion = useReducedMotion();

  // Hybrid Model Engine: 'fast' (Instant Kinetic Motion Card - Default) vs '3d' (Three.js Studio)
  const [renderMode, setRenderMode] = useState<'fast' | '3d'>('fast');

  // Motion playback state
  const [isPlaying, setIsPlaying] = useState(!reducedMotion);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [speed, setSpeed] = useState<0.5 | 1 | 1.5>(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showGlow, setShowGlow] = useState(true);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion && isPlaying) {
      setIsPlaying(false);
    }
  }, [reducedMotion, isPlaying]);

  // Continuous animation loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = undefined;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const delta = (time - lastTimeRef.current) / 1000;
        // Full rep cycle takes ~3.5 seconds at 1x speed
        const cycleDuration = 3.5 / speed;
        setProgress((prev) => (prev + delta / cycleDuration) % 1.0);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed]);

  // Smooth sinusoidal repetition
  const repPhase = useMemo(() => {
    return (1 - Math.cos(progress * Math.PI * 2)) / 2;
  }, [progress]);

  const isEccentric = progress > 0.08 && progress < 0.5;

  // Phase metadata
  const phaseInfo = useMemo(() => {
    if (progress < 0.15) {
      return {
        key: 'setup',
        title: isRTL ? '1. الاستعداد وبداية الحركة' : '1. Setup & Starting Position',
        desc: isRTL ? 'تأمين المفاصل، شد عضلات الجذع، وثبات نقطة الارتكاز' : 'Joints aligned, core braced, stable base of support',
        breath: isRTL ? 'شهيق وتحضير' : 'Inhale & Brace',
        badgeColor: '#38bdf8'
      };
    } else if (progress < 0.45) {
      return {
        key: 'eccentric',
        title: isRTL ? '2. الطور السلبي (النزول والتحكم)' : '2. Eccentric (Controlled Descent)',
        desc: isRTL ? 'مقاومة الوزن ببطء (2-3 ثوانٍ) وتمديد الألياف العضلية' : 'Resist load with control, lengthening target muscle fibers',
        breath: isRTL ? 'شهيق عميق يملأ الصدر' : 'Deep Inhale',
        badgeColor: '#fbbf24'
      };
    } else if (progress < 0.55) {
      return {
        key: 'stretch',
        title: isRTL ? '3. أقصى استطالة ومدى حركي' : '3. Deep Stretch & Turning Point',
        desc: isRTL ? 'الوصول للمدى الكامل دون ارتخاء أو كسر زوايا الأمان' : 'Reach full comfortable depth without losing tension or posture',
        breath: isRTL ? 'ثبات وانتقال' : 'Brief Tension Hold',
        badgeColor: '#ef4444'
      };
    } else if (progress < 0.88) {
      return {
        key: 'concentric',
        title: isRTL ? '4. الطور الإيجابي (الدفع والانقباض)' : '4. Concentric (Power Drive & Press)',
        desc: isRTL ? 'تفعيل أقصى للقوة العضلية مع الحفاظ على مسار ثابت' : 'Drive explosively through the target muscle along the bar path',
        breath: isRTL ? 'إخراج زفير قوي' : 'Exhale Forcefully',
        badgeColor: '#10b981'
      };
    } else {
      return {
        key: 'lockout',
        title: isRTL ? '5. ذروة الانقباض والعصر' : '5. Peak Squeeze & Lockout',
        desc: isRTL ? 'عصر العضلة المستهدفة بالكامل لثانية واحدة قبل التكرار التالي' : 'Hard peak contraction without hyper-extending the joints',
        breath: isRTL ? 'زفير نهائي' : 'Finish Exhale',
        badgeColor: '#a855f7'
      };
    }
  }, [progress, isRTL]);

  // Direct scrub step handler
  const setStepPhase = (targetProgress: number) => {
    setIsPlaying(false);
    setProgress(targetProgress);
  };

  // If Fast Mode is active (DEFAULT): Render the ultra-smooth instant Hero Card
  if (renderMode === 'fast') {
    return (
      <div className="motion-simulator-card" style={{
        background: 'linear-gradient(180deg, rgba(12, 18, 32, 0.95) 0%, rgba(7, 10, 18, 0.98) 100%)',
        border: '1px solid rgba(70, 217, 255, 0.22)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <ExerciseMotionHeroCard
          tutorial={tutorial}
          biomechanics={biomechanics}
          progress={progress}
          repPhase={repPhase}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={() => {
            setProgress(0);
            setIsPlaying(true);
          }}
          speed={speed}
          onChangeSpeed={setSpeed}
          onScrub={(val) => {
            setIsPlaying(false);
            setProgress(val);
          }}
          phaseInfo={phaseInfo}
          showGuides={showGuides}
          onToggleGuides={() => setShowGuides(!showGuides)}
          showAngles={showAngles}
          onToggleAngles={() => setShowAngles(!showAngles)}
          showGlow={showGlow}
          onToggleGlow={() => setShowGlow(!showGlow)}
          onOpen3DInspector={() => setRenderMode('3d')}
          childrenFigure={
            <BiomechanicalFigure 
              pattern={biomechanics.pattern} 
              repPhase={repPhase} 
              showGuides={showGuides}
              showAngles={showAngles}
              showGlow={showGlow}
            />
          }
        />
      </div>
    );
  }

  // If 3D Mode is active: Render the full interactive Three.js 3D Studio with return banner
  return (
    <div className="motion-simulator-card" style={{
      background: 'linear-gradient(180deg, rgba(12, 18, 32, 0.95) 0%, rgba(7, 10, 18, 0.98) 100%)',
      border: '1px solid rgba(70, 217, 255, 0.35)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.65)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      padding: '1.25rem',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      {/* 3D Top Return Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '0.5rem',
        paddingBottom: '0.45rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={() => setRenderMode('fast')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{t('close3DInspector')}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            background: 'rgba(70, 217, 255, 0.15)',
            color: '#46d9ff',
            border: '1px solid rgba(70, 217, 255, 0.3)'
          }}>
            3D Studio
          </span>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            background: `${phaseInfo.badgeColor}18`,
            border: `1px solid ${phaseInfo.badgeColor}40`,
            color: phaseInfo.badgeColor,
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: phaseInfo.badgeColor,
              boxShadow: `0 0 8px ${phaseInfo.badgeColor}`
            }} />
            <span>{phaseInfo.title}</span>
          </div>
        </div>
      </div>

      {/* Realistic 3D Mannequin Visualizer */}
      <SceneBoundary isRTL={isRTL}>
        <RealisticExercise3DViewer
          tutorial={tutorial}
          repPhase={repPhase}
          isPlaying={isPlaying}
          showGuides={showGuides}
          showAngles={showAngles}
          showGlow={showGlow}
          phaseTitle={phaseInfo.title}
          phaseCue={phaseInfo.desc}
          breathCue={phaseInfo.breath}
          isEccentric={isEccentric}
        />
      </SceneBoundary>

      {/* Real-time Form & Safety Cue Note */}
      <div style={{
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Info size={15} style={{ color: '#46d9ff', flexShrink: 0 }} />
          <span>{phaseInfo.desc}</span>
        </div>
        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Interactive Phase Scrubber Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
          <span>{t('scrubPrompt')}</span>
          <span style={{ color: '#46d9ff', fontWeight: 600 }}>
            {repPhase > 0.85 ? (isRTL ? 'أقصى انقباض' : 'Peak Squeeze') : (isRTL ? 'تحت التحكم' : 'Under Tension')}
          </span>
        </div>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={progress}
          onChange={(e) => {
            setIsPlaying(false);
            setProgress(parseFloat(e.target.value));
          }}
          style={{
            width: '100%',
            accentColor: '#46d9ff',
            cursor: 'pointer',
            height: '6px'
          }}
        />
      </div>

      {/* Step Buttons (Setup -> Eccentric -> Stretch -> Concentric -> Lockout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.35rem'
      }}>
        {[
          { label: isRTL ? 'استعداد' : 'Setup', val: 0.05 },
          { label: isRTL ? 'نزول' : 'Descent', val: 0.30 },
          { label: isRTL ? 'أقصى تمدد' : 'Stretch', val: 0.50 },
          { label: isRTL ? 'دفع' : 'Drive', val: 0.75 },
          { label: isRTL ? 'عصر' : 'Squeeze', val: 0.98 }
        ].map((step, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setStepPhase(step.val)}
            style={{
              padding: '0.4rem 0.2rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: Math.abs(progress - step.val) < 0.12 ? 'rgba(70, 217, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              color: Math.abs(progress - step.val) < 0.12 ? '#46d9ff' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s'
            }}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Bottom Controls Bar (Play/Pause, Speed, Guides Toggle) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Play / Pause & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '9px',
              backgroundColor: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-primary)',
              color: isPlaying ? '#ef4444' : '#07131b',
              border: isPlaying ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            <span>{isPlaying ? t('pauseMotion') : t('playMotion')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            style={{
              padding: '0.45rem',
              borderRadius: '9px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Speed Selector (0.5x, 1x, 1.5x) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.2rem', borderRadius: '8px' }}>
          {([0.5, 1, 1.5] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                background: speed === s ? 'rgba(70, 217, 255, 0.2)' : 'transparent',
                color: speed === s ? '#46d9ff' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: speed === s ? 800 : 500,
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Visual Guides Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: showGuides ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: showGuides ? '#10b981' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('barPathGuide')}
          </button>

          <button
            type="button"
            onClick={() => setShowAngles(!showAngles)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: showAngles ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: showAngles ? '#f59e0b' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('jointAngleGuide')}
          </button>

          <button
            type="button"
            onClick={() => setShowGlow(!showGlow)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: showGlow ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: showGlow ? '#ff6b6b' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('muscleTensionGlow')}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Biomechanical Kinematic Characters by Movement Pattern
// =========================================================================
interface BiomechanicalFigureProps {
  pattern: MotionPatternType;
  repPhase: number; // 0.0 (lockout/setup) -> 1.0 (deep stretch/bottom)
  showGuides: boolean;
  showAngles: boolean;
  showGlow: boolean;
}

function BiomechanicalFigure({ pattern, repPhase, showGuides, showAngles, showGlow }: BiomechanicalFigureProps) {
  switch (pattern) {
    case 'bench_press':
    case 'incline_press':
      return <BenchPressFigure repPhase={repPhase} isIncline={pattern === 'incline_press'} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;
    
    case 'squat':
      return <SquatFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'deadlift':
      return <DeadliftFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'overhead_press':
      return <OverheadPressFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'lateral_raise':
      return <LateralRaiseFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'pull_down':
      return <PullDownFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'row':
      return <RowFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'bicep_curl':
      return <BicepCurlFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'tricep_extension':
      return <TricepExtensionFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'leg_extension':
    case 'leg_curl':
      return <LegMachineFigure repPhase={repPhase} isCurl={pattern === 'leg_curl'} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'calf_raise':
      return <CalfRaiseFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'core':
      return <CoreCrunchFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;

    case 'cardio':
    default:
      return <CardioStrideFigure repPhase={repPhase} showGuides={showGuides} showAngles={showAngles} showGlow={showGlow} />;
  }
}

// -------------------------------------------------------------------------
// 1. Bench Press / Incline Press Figure
// -------------------------------------------------------------------------
function BenchPressFigure({ repPhase, isIncline, showGuides, showAngles, showGlow }: { repPhase: number; isIncline?: boolean; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  // Barbell vertical motion: repPhase = 0 (top: y=105), repPhase = 1 (chest contact: y=168)
  const barY = 105 + repPhase * 63;
  const barX = isIncline ? 195 : 200;

  // Chest muscle expansion and contraction color
  const chestGlowOpacity = 0.2 + (1 - repPhase) * 0.75;
  const elbowAngle = Math.round(160 - repPhase * 90); // 160° locked out down to ~70° at bottom

  return (
    <g>
      {/* Flat or Incline Bench */}
      <g transform={isIncline ? "rotate(-25 150 210)" : ""}>
        {/* Bench pad */}
        <rect x="110" y="195" width="170" height="14" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Bench legs & support frame */}
        <path d="M 130 209 L 130 270 M 260 209 L 260 270 M 110 270 L 280 270" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Trajectory Guide Line (Bar Path) */}
      {showGuides && (
        <g opacity="0.8">
          <line x1={barX} y1="95" x2={barX} y2="175" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" filter="url(#laserLine)" />
          <circle cx={barX} cy="105" r="3" fill="#10b981" />
          <circle cx={barX} cy="168" r="3" fill="#ef4444" />
          <text x={barX + 12} y="100" fill="#10b981" fontSize="9" fontWeight="bold">Lockout</text>
          <text x={barX + 12} y="172" fill="#ef4444" fontSize="9" fontWeight="bold">Touch Sternum</text>
        </g>
      )}

      {/* Athlete Body on Bench */}
      {/* Head & Neck */}
      <circle cx="140" cy="180" r="14" fill="#38bdf8" opacity="0.9" />
      
      {/* Torso with Arch & Scapula Retraction */}
      <path 
        d="M 152 188 Q 185 174 220 196" 
        stroke="#0284c7" 
        strokeWidth="16" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Primary Muscle Glow (Pectoralis Major) */}
      {showGlow && (
        <path 
          d="M 175 178 Q 192 170 208 182" 
          stroke="#ff4646" 
          strokeWidth="14" 
          strokeLinecap="round" 
          fill="none" 
          filter="url(#simMuscleGlow)"
          opacity={chestGlowOpacity}
        />
      )}

      {/* Hips & Legs down to floor */}
      <path d="M 220 196 L 245 220 L 255 270" stroke="#0369a1" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Foot flat on floor */}
      <path d="M 250 270 L 275 270" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />

      {/* Arms Kinematics (Shoulder -> Elbow -> Wrist) */}
      {(() => {
        const shoulderX = 185;
        const shoulderY = 178;
        const elbowX = shoulderX + (barX - shoulderX) * 0.45 - (1 - repPhase) * 12;
        const elbowY = shoulderY + (barY - shoulderY) * 0.55 + repPhase * 26;

        return (
          <g>
            {/* Upper arm */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
            {/* Forearm to Bar */}
            <line x1={elbowX} y1={elbowY} x2={barX} y2={barY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
            {/* Elbow joint circle */}
            <circle cx={elbowX} cy={elbowY} r="5" fill="#46d9ff" />
            {/* Shoulder joint circle */}
            <circle cx={shoulderX} cy={shoulderY} r="5" fill="#46d9ff" />

            {/* Elbow angle readout */}
            {showAngles && (
              <g>
                <circle cx={elbowX} cy={elbowY} r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                <text x={elbowX - 22} y={elbowY + 18} fill="#f59e0b" fontSize="10" fontWeight="bold">
                  {elbowAngle}°
                </text>
              </g>
            )}
          </g>
        );
      })()}

      {/* Barbell & Plates */}
      {/* Steel Bar */}
      <line x1={barX - 65} y1={barY} x2={barX + 65} y2={barY} stroke="url(#barbellSteel)" strokeWidth="5" strokeLinecap="round" />
      {/* Left Plate */}
      <rect x={barX - 65} y={barY - 26} width="8" height="52" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      {/* Right Plate */}
      <rect x={barX + 57} y={barY - 26} width="8" height="52" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      {/* Athlete Grip Hand */}
      <circle cx={barX} cy={barY} r="6" fill="#f8fafc" stroke="#0369a1" strokeWidth="2" />
    </g>
  );
}

// -------------------------------------------------------------------------
// 2. Squat Figure
// -------------------------------------------------------------------------
function SquatFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  // repPhase: 0 is standing tall, 1 is parallel / deep squat
  const hipX = 185 - repPhase * 28;
  const hipY = 160 + repPhase * 60;

  const kneeX = 220 + repPhase * 16;
  const kneeY = 210 + repPhase * 15;

  const ankleX = 215;
  const ankleY = 265;

  const shoulderX = hipX + 18 - repPhase * 6;
  const shoulderY = hipY - 60 + repPhase * 8;
  const headX = shoulderX + 4;
  const headY = shoulderY - 20;

  const barX = shoulderX;
  const barY = shoulderY - 4;

  const kneeAngle = Math.round(175 - repPhase * 95);
  const quadGlowOpacity = 0.25 + repPhase * 0.75;

  return (
    <g>
      {/* Squat Rack Uprights */}
      <path d="M 120 70 L 120 270 M 110 270 L 150 270 M 116 110 L 132 110" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      {/* Floor platform */}
      <line x1="80" y1="270" x2="320" y2="270" stroke="#1e293b" strokeWidth="4" />

      {/* Bar Path Vertical Laser Guide over Mid-Foot */}
      {showGuides && (
        <g opacity="0.85">
          <line x1={ankleX} y1="60" x2={ankleX} y2="270" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#laserLine)" />
          <text x={ankleX + 6} y="75" fill="#10b981" fontSize="9" fontWeight="bold">Mid-Foot Center</text>
        </g>
      )}

      {/* Athlete Torso */}
      <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      {/* Head */}
      <circle cx={headX} cy={headY} r="13" fill="#38bdf8" />

      {/* Primary Muscle Glow (Quadriceps & Glutes) */}
      {showGlow && (
        <g>
          {/* Quads */}
          <line 
            x1={hipX + 4} y1={hipY} x2={kneeX} y2={kneeY} 
            stroke="#ff4646" strokeWidth="16" strokeLinecap="round" 
            filter="url(#simMuscleGlow)" opacity={quadGlowOpacity} 
          />
          {/* Glutes */}
          <circle cx={hipX - 2} cy={hipY} r="14" fill="#ff6b6b" filter="url(#simMuscleGlow)" opacity={quadGlowOpacity * 0.8} />
        </g>
      )}

      {/* Thigh (Hip -> Knee) */}
      <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#0ea5e9" strokeWidth="14" strokeLinecap="round" />
      {/* Shin (Knee -> Ankle) */}
      <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#0369a1" strokeWidth="11" strokeLinecap="round" />
      {/* Foot */}
      <path d={`M ${ankleX - 10} ${ankleY} L ${ankleX + 25} ${ankleY}`} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />

      {/* Joints */}
      <circle cx={hipX} cy={hipY} r="6" fill="#46d9ff" />
      <circle cx={kneeX} cy={kneeY} r="6" fill="#46d9ff" />

      {/* Knee Angle Indicator */}
      {showAngles && (
        <g>
          <circle cx={kneeX} cy={kneeY} r="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x={kneeX + 16} y={kneeY + 4} fill="#f59e0b" fontSize="10" fontWeight="bold">
            {kneeAngle}°
          </text>
        </g>
      )}

      {/* Arms holding the barbell */}
      <path d={`M ${shoulderX} ${shoulderY} Q ${shoulderX + 18} ${shoulderY + 22} ${barX + 4} ${barY + 6}`} stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Barbell Across Upper Traps */}
      <line x1={barX - 45} y1={barY} x2={barX + 45} y2={barY} stroke="url(#barbellSteel)" strokeWidth="6" strokeLinecap="round" />
      <rect x={barX - 48} y={barY - 24} width="8" height="48" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x={barX + 40} y={barY - 24} width="8" height="48" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
    </g>
  );
}

// -------------------------------------------------------------------------
// 3. Deadlift / Hinge Figure
// -------------------------------------------------------------------------
function DeadliftFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const hipX = 170 - repPhase * 35;
  const hipY = 165 + repPhase * 25;

  const kneeX = 205 - repPhase * 10;
  const kneeY = 215 + repPhase * 5;

  const ankleX = 205;
  const ankleY = 265;

  const shoulderX = 185 + repPhase * 20;
  const shoulderY = 110 + repPhase * 55;

  const barX = 212;
  const barY = 175 + repPhase * 80;

  const hamstringGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      {/* Floor */}
      <line x1="100" y1="270" x2="300" y2="270" stroke="#1e293b" strokeWidth="4" />

      {/* Vertical Shin Bar Path Guide */}
      {showGuides && (
        <g opacity="0.8">
          <line x1={barX} y1="165" x2={barX} y2="270" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#laserLine)" />
          <text x={barX + 8} y="180" fill="#10b981" fontSize="9" fontWeight="bold">Shin Clearance</text>
        </g>
      )}

      {/* Torso / Spine Safety Neutral Line */}
      <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      {showAngles && (
        <line x1={hipX - 10} y1={hipY - 5} x2={shoulderX + 15} y2={shoulderY - 5} stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
      )}

      {/* Head */}
      <circle cx={shoulderX + 12} cy={shoulderY - 14} r="13" fill="#38bdf8" />

      {/* Hamstring & Glute Glow */}
      {showGlow && (
        <g>
          <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#ff4646" strokeWidth="16" strokeLinecap="round" filter="url(#simMuscleGlow)" opacity={hamstringGlow} />
          <circle cx={hipX - 4} cy={hipY} r="14" fill="#ff6b6b" filter="url(#simMuscleGlow)" opacity={hamstringGlow * 0.9} />
        </g>
      )}

      {/* Legs */}
      <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#0ea5e9" strokeWidth="13" strokeLinecap="round" />
      <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#0369a1" strokeWidth="11" strokeLinecap="round" />
      <path d={`M ${ankleX - 10} ${ankleY} L ${ankleX + 22} ${ankleY}`} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />

      {/* Straight Arms down to Bar */}
      <line x1={shoulderX} y1={shoulderY} x2={barX} y2={barY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />

      {/* Barbell Plates */}
      <circle cx={barX} cy={barY} r="24" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="2" />
      <circle cx={barX} cy={barY} r="8" fill="#334155" />
      <line x1={barX - 40} y1={barY} x2={barX + 40} y2={barY} stroke="url(#barbellSteel)" strokeWidth="5" />
      <circle cx={barX} cy={barY} r="5" fill="#f8fafc" />
    </g>
  );
}

// -------------------------------------------------------------------------
// 4. Overhead Press Figure
// -------------------------------------------------------------------------
function OverheadPressFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const barY = 70 + repPhase * 60;
  const barX = 200;

  const shoulderX = 200;
  const shoulderY = 135;

  const elbowX = 215 + repPhase * 8;
  const elbowY = 135 + repPhase * 28;

  const deltGlow = 0.25 + (1 - repPhase) * 0.75;
  const elbowAngle = Math.round(90 + (1 - repPhase) * 85);

  return (
    <g>
      <line x1="120" y1="270" x2="280" y2="270" stroke="#1e293b" strokeWidth="4" />

      {/* Vertical Trajectory */}
      {showGuides && (
        <line x1={barX} y1="60" x2={barX} y2="150" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#laserLine)" />
      )}

      {/* Athlete Body standing */}
      <circle cx="200" cy="115" r="13" fill="#38bdf8" />
      {/* Torso */}
      <line x1="200" y1="130" x2="200" y2="190" stroke="#0284c7" strokeWidth="18" strokeLinecap="round" />
      
      {/* Deltoid Glow */}
      {showGlow && (
        <circle cx={shoulderX} cy={shoulderY} r="14" fill="#ff4646" filter="url(#simMuscleGlow)" opacity={deltGlow} />
      )}

      {/* Legs standing straight */}
      <line x1="195" y1="190" x2="195" y2="265" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" />
      <line x1="205" y1="190" x2="205" y2="265" stroke="#0369a1" strokeWidth="12" strokeLinecap="round" />

      {/* Arms pushing overhead */}
      <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
      <line x1={elbowX} y1={elbowY} x2={barX} y2={barY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />

      {/* Elbow Angle indicator */}
      {showAngles && (
        <text x={elbowX + 10} y={elbowY + 4} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {elbowAngle}°
        </text>
      )}

      {/* Barbell overhead */}
      <line x1={barX - 55} y1={barY} x2={barX + 55} y2={barY} stroke="url(#barbellSteel)" strokeWidth="5" strokeLinecap="round" />
      <rect x={barX - 58} y={barY - 20} width="6" height="40" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x={barX + 52} y={barY - 20} width="6" height="40" rx="2" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      <circle cx={barX} cy={barY} r="5" fill="#f8fafc" />
    </g>
  );
}

// -------------------------------------------------------------------------
// 5. Lateral Raise Figure (Front Facing)
// -------------------------------------------------------------------------
function LateralRaiseFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const armAngle = 20 + repPhase * 68;
  const rad = (armAngle * Math.PI) / 180;

  const leftShoulderX = 180;
  const rightShoulderX = 220;
  const shoulderY = 125;
  const armLen = 58;

  const leftHandX = leftShoulderX - Math.sin(rad) * armLen;
  const leftHandY = shoulderY + Math.cos(rad) * armLen;

  const rightHandX = rightShoulderX + Math.sin(rad) * armLen;
  const rightHandY = shoulderY + Math.cos(rad) * armLen;

  const deltGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      <circle cx="200" cy="100" r="14" fill="#38bdf8" />
      <path d="M 180 120 L 220 120 L 210 190 L 190 190 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="3" />

      {/* Lateral Delts Glow */}
      {showGlow && (
        <g>
          <circle cx={leftShoulderX} cy={shoulderY} r="13" fill="#ff4646" filter="url(#simMuscleGlow)" opacity={deltGlow} />
          <circle cx={rightShoulderX} cy={shoulderY} r="13" fill="#ff4646" filter="url(#simMuscleGlow)" opacity={deltGlow} />
        </g>
      )}

      {/* Legs */}
      <line x1="192" y1="190" x2="190" y2="265" stroke="#0ea5e9" strokeWidth="11" strokeLinecap="round" />
      <line x1="208" y1="190" x2="210" y2="265" stroke="#0ea5e9" strokeWidth="11" strokeLinecap="round" />

      {/* Left Arm & Dumbbell */}
      <line x1={leftShoulderX} y1={shoulderY} x2={leftHandX} y2={leftHandY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <rect x={leftHandX - 8} y={leftHandY - 6} width="16" height="12" rx="3" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />

      {/* Right Arm & Dumbbell */}
      <line x1={rightShoulderX} y1={shoulderY} x2={rightHandX} y2={rightHandY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <rect x={rightHandX - 8} y={rightHandY - 6} width="16" height="12" rx="3" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />

      {/* Arc Guide */}
      {showGuides && (
        <path d={`M 180 180 A 60 60 0 0 1 120 130`} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
      )}

      {/* Angle Readout */}
      {showAngles && (
        <text x={leftHandX - 22} y={leftHandY} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(armAngle)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 6. Lat Pulldown / Pull-up Figure
// -------------------------------------------------------------------------
function PullDownFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const barY = 65 + repPhase * 60;
  const latGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      {/* Overhead Lat Pulldown Machine Cable & Frame */}
      <line x1="200" y1="30" x2="200" y2={barY} stroke="#94a3b8" strokeWidth="2" />
      <circle cx="200" cy="30" r="8" fill="#334155" stroke="#64748b" strokeWidth="2" />

      {/* Bar Path guide */}
      {showGuides && (
        <line x1="200" y1="65" x2="200" y2="128" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#laserLine)" />
      )}

      {/* Wide Grip Lat Bar */}
      <path d={`M 135 ${barY + 6} L 155 ${barY} L 245 ${barY} L 265 ${barY + 6}`} stroke="url(#barbellSteel)" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Seated Athlete */}
      <circle cx="200" cy="120" r="14" fill="#38bdf8" />
      
      {/* V-Taper Torso & Lats */}
      <path d="M 180 135 L 220 135 L 208 200 L 192 200 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />

      {/* Glowing Lats Wings */}
      {showGlow && (
        <path 
          d="M 175 140 Q 160 170 185 190 M 225 140 Q 240 170 215 190" 
          stroke="#ff4646" strokeWidth="14" strokeLinecap="round" fill="none" 
          filter="url(#simMuscleGlow)" opacity={latGlow} 
        />
      )}

      {/* Seated Legs and Knee Pad */}
      <rect x="180" y="215" width="40" height="12" rx="4" fill="#334155" />
      <line x1="195" y1="200" x2="195" y2="265" stroke="#0ea5e9" strokeWidth="10" strokeLinecap="round" />
      <line x1="205" y1="200" x2="205" y2="265" stroke="#0369a1" strokeWidth="10" strokeLinecap="round" />

      {/* Arms pulling from bar down */}
      <line x1="180" y1="135" x2={160 + repPhase * 10} y2={barY + 12} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <line x1="220" y1="135" x2={240 - repPhase * 10} y2={barY + 12} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />

      {/* Pull Angle Readout */}
      {showAngles && (
        <text x="248" y={barY + 16} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(165 - repPhase * 80)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 7. Horizontal Row Figure
// -------------------------------------------------------------------------
function RowFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const handX = 210 - repPhase * 35;
  const handY = 205 - repPhase * 25;
  const backGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      <line x1="100" y1="270" x2="300" y2="270" stroke="#1e293b" strokeWidth="4" />
      
      {/* Path Guide */}
      {showGuides && (
        <line x1="210" y1="205" x2="175" y2="180" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#laserLine)" />
      )}

      {/* Bent-over Torso at 45° */}
      <line x1="160" y1="175" x2="220" y2="135" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      <circle cx="232" cy="125" r="13" fill="#38bdf8" />

      {/* Glowing Upper Back & Lats */}
      {showGlow && (
        <line x1="175" y1="165" x2="215" y2="140" stroke="#ff4646" strokeWidth="14" strokeLinecap="round" filter="url(#simMuscleGlow)" opacity={backGlow} />
      )}

      {/* Legs soft knee bend */}
      <line x1="160" y1="175" x2="175" y2="220" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" />
      <line x1="175" y1="220" x2="175" y2="265" stroke="#0369a1" strokeWidth="11" strokeLinecap="round" />

      {/* Pulling Arm & Barbell */}
      <line x1="215" y1="140" x2={handX} y2={handY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <circle cx={handX} cy={handY} r="16" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="2" />
      <circle cx={handX} cy={handY} r="5" fill="#f8fafc" />

      {/* Angle Readout */}
      {showAngles && (
        <text x={handX + 16} y={handY - 5} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(160 - repPhase * 70)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 8. Bicep Curl Figure
// -------------------------------------------------------------------------
function BicepCurlFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const elbowX = 205;
  const elbowY = 165;
  const armAngle = 20 + repPhase * 125;
  const rad = (armAngle * Math.PI) / 180;
  const forearmLen = 42;

  const wristX = elbowX + Math.sin(rad) * forearmLen;
  const wristY = elbowY + Math.cos(rad) * forearmLen;

  const bicepGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      {/* Athlete Side View */}
      <circle cx="185" cy="105" r="13" fill="#38bdf8" />
      <line x1="185" y1="120" x2="185" y2="190" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      <line x1="185" y1="190" x2="185" y2="265" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" />

      {/* Upper Arm pinned strictly to side */}
      <line x1="195" y1="128" x2={elbowX} y2={elbowY} stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
      
      {/* Bicep Muscle Peak Expansion */}
      {showGlow && (
        <ellipse cx="200" cy="146" rx={6 + repPhase * 5} ry={10} fill="#ff4646" filter="url(#simMuscleGlow)" opacity={bicepGlow} />
      )}

      {/* Arc Guide */}
      {showGuides && (
        <path d={`M ${elbowX} ${elbowY + 42} A 42 42 0 0 0 ${elbowX + 38} ${elbowY - 10}`} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
      )}

      {/* Forearm Curling */}
      <line x1={elbowX} y1={elbowY} x2={wristX} y2={wristY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <circle cx={elbowX} cy={elbowY} r="5" fill="#46d9ff" />

      {/* Dumbbell / Barbell */}
      <circle cx={wristX} cy={wristY} r="12" fill="url(#metalPlate)" stroke="#0ea5e9" strokeWidth="1.5" />
      <circle cx={wristX} cy={wristY} r="4" fill="#f8fafc" />

      {/* Angle Readout */}
      {showAngles && (
        <text x={wristX + 16} y={wristY} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(armAngle)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 9. Tricep Extension Figure
// -------------------------------------------------------------------------
function TricepExtensionFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const elbowX = 205;
  const elbowY = 160;
  const angle = 90 - repPhase * 80;
  const rad = (angle * Math.PI) / 180;
  const forearmLen = 45;

  const wristX = elbowX + Math.cos(rad) * forearmLen;
  const wristY = elbowY + Math.sin(rad) * forearmLen;

  const tricepGlow = 0.2 + repPhase * 0.8;

  return (
    <g>
      {/* Cable Pulley */}
      <line x1="225" y1="50" x2={wristX} y2={wristY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 2" />

      {/* Athlete Body */}
      <circle cx="180" cy="110" r="13" fill="#38bdf8" />
      <line x1="180" y1="125" x2="185" y2="190" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      <line x1="185" y1="190" x2="190" y2="265" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" />

      {/* Upper Arm */}
      <line x1="190" y1="130" x2={elbowX} y2={elbowY} stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />

      {/* Tricep Muscle Glow (Horseshoe) */}
      {showGlow && (
        <path d="M 194 135 Q 186 148 198 158" stroke="#ff4646" strokeWidth="10" strokeLinecap="round" filter="url(#simMuscleGlow)" opacity={tricepGlow} fill="none" />
      )}

      {/* Guide */}
      {showGuides && (
        <line x1={elbowX} y1={elbowY} x2={elbowX + 45} y2={elbowY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
      )}

      {/* Forearm pushing down */}
      <line x1={elbowX} y1={elbowY} x2={wristX} y2={wristY} stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
      <circle cx={wristX} cy={wristY} r="6" fill="#f8fafc" />

      {/* Angle Readout */}
      {showAngles && (
        <text x={wristX + 10} y={wristY + 12} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(180 - angle)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 10. Leg Machine Figure (Extension / Curl)
// -------------------------------------------------------------------------
function LegMachineFigure({ repPhase, isCurl, showGuides, showAngles, showGlow }: { repPhase: number; isCurl?: boolean; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const hipX = 180;
  const hipY = 180;
  const kneeX = 230;
  const kneeY = 180;

  const legAngle = isCurl 
    ? 20 + repPhase * 75
    : 90 - repPhase * 80;
  const rad = (legAngle * Math.PI) / 180;
  const shinLen = 48;

  const ankleX = kneeX + Math.cos(rad) * shinLen;
  const ankleY = kneeY + Math.sin(rad) * shinLen;

  return (
    <g>
      {/* Machine Seat */}
      <path d="M 150 140 L 175 190 L 225 190" stroke="#334155" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Thigh */}
      <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#0ea5e9" strokeWidth="14" strokeLinecap="round" />
      
      {/* Quads Glow */}
      {showGlow && (
        <line x1={hipX + 5} y1={hipY - 4} x2={kneeX - 5} y2={kneeY - 4} stroke="#ff4646" strokeWidth="14" strokeLinecap="round" filter="url(#simMuscleGlow)" opacity={0.25 + repPhase * 0.75} />
      )}

      {/* Torso */}
      <line x1={hipX} y1={hipY} x2="160" y2="130" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      <circle cx="155" cy="115" r="13" fill="#38bdf8" />

      {/* Guide Arc */}
      {showGuides && (
        <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
      )}

      {/* Shin & Machine Roller Pad */}
      <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />
      <circle cx={kneeX} cy={kneeY} r="7" fill="#46d9ff" />
      {/* Roller Pad */}
      <circle cx={ankleX} cy={ankleY} r="10" fill="#334155" stroke="#38bdf8" strokeWidth="2" />

      {/* Angle Readout */}
      {showAngles && (
        <text x={ankleX + 12} y={ankleY} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(legAngle)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 11. Calf Raise Figure
// -------------------------------------------------------------------------
function CalfRaiseFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const heelY = 245 - repPhase * 25;
  const bodyY = -repPhase * 20;

  return (
    <g transform={`translate(0, ${bodyY})`}>
      {/* Step / Block */}
      <rect x="175" y="245" width="50" height="25" fill="#334155" rx="3" />
      
      {/* Athlete Body standing */}
      <circle cx="200" cy="110" r="13" fill="#38bdf8" />
      <line x1="200" y1="125" x2="200" y2="190" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />
      <line x1="200" y1="190" x2="200" y2="225" stroke="#0ea5e9" strokeWidth="13" strokeLinecap="round" />

      {/* Calf Muscle Glow (Gastrocnemius Diamond) */}
      {showGlow && (
        <ellipse cx="203" cy="215" rx="8" ry="14" fill="#ff4646" filter="url(#simMuscleGlow)" opacity={0.2 + repPhase * 0.8} />
      )}

      {/* Guide */}
      {showGuides && (
        <line x1="195" y1="220" x2="195" y2="250" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
      )}

      {/* Foot on Block */}
      <line x1="200" y1="225" x2="195" y2={heelY} stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
      <line x1="195" y1={heelY} x2="215" y2="245" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />

      {/* Angle Readout */}
      {showAngles && (
        <text x="220" y={heelY} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(90 + repPhase * 35)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 12. Core Crunch Figure
// -------------------------------------------------------------------------
function CoreCrunchFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const crunchY = repPhase * 22;
  const crunchX = repPhase * 18;

  return (
    <g>
      {/* Exercise Mat */}
      <line x1="100" y1="230" x2="290" y2="230" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
      {/* Legs with bent knees */}
      <path d="M 210 225 L 245 190 L 265 225" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Curled Spine & Torso */}
      <path 
        d={`M 210 225 Q ${180 - crunchX} ${210 - crunchY} ${145 + crunchX} ${215 - crunchY * 1.5}`} 
        stroke="#0284c7" strokeWidth="16" strokeLinecap="round" fill="none" 
      />

      {/* Abdominals Glow (Six-Pack Contraction) */}
      {showGlow && (
        <ellipse cx={180} cy={205 - crunchY * 0.8} rx="12" ry="8" fill="#ff4646" filter="url(#simMuscleGlow)" opacity={0.25 + repPhase * 0.75} />
      )}

      {/* Guide Arc */}
      {showGuides && (
        <path d={`M 145 215 Q 180 185 210 225`} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
      )}

      {/* Head */}
      <circle cx={135 + crunchX} cy={205 - crunchY * 1.6} r="13" fill="#38bdf8" />

      {/* Angle Readout */}
      {showAngles && (
        <text x={160} y={190 - crunchY} fill="#f59e0b" fontSize="10" fontWeight="bold">
          {Math.round(180 - repPhase * 45)}°
        </text>
      )}
    </g>
  );
}

// -------------------------------------------------------------------------
// 13. Cardio Stride Figure
// -------------------------------------------------------------------------
function CardioStrideFigure({ repPhase, showGuides, showAngles, showGlow }: { repPhase: number; showGuides: boolean; showAngles: boolean; showGlow: boolean }) {
  const strideOffset = Math.sin(repPhase * Math.PI * 2) * 20;

  return (
    <g>
      {/* Treadmill Bed */}
      <rect x="110" y="240" width="180" height="12" rx="4" fill="#334155" />
      <circle cx="200" cy="115" r="13" fill="#38bdf8" />
      <line x1="200" y1="130" x2="198" y2="190" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" />

      {/* Heart rate & tempo glow */}
      {showGlow && (
        <circle cx="200" cy="140" r="10" fill="#ef4444" filter="url(#simMuscleGlow)" opacity={0.4} />
      )}

      {/* Running Legs */}
      <line x1="198" y1="190" x2={185 + strideOffset} y2="240" stroke="#0ea5e9" strokeWidth="10" strokeLinecap="round" />
      <line x1="198" y1="190" x2={215 - strideOffset} y2="240" stroke="#0369a1" strokeWidth="10" strokeLinecap="round" />

      {/* Running Arms */}
      <line x1="200" y1="140" x2={180 - strideOffset * 0.8} y2="175" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
      <line x1="200" y1="140" x2={220 + strideOffset * 0.8} y2="175" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />

      {/* Guide line */}
      {showGuides && (
        <line x1="110" y1="240" x2="290" y2="240" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
      )}

      {/* Cadence */}
      {showAngles && (
        <text x="250" y="235" fill="#f59e0b" fontSize="10" fontWeight="bold">
          165 BPM
        </text>
      )}
    </g>
  );
}
