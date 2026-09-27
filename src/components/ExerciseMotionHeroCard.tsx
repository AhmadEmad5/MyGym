import React from 'react';
import { 
  Play, Pause, RotateCcw, Wind, Flame, Info, Box, 
  ChevronRight, Compass
} from 'lucide-react';
import { ExerciseTutorial, BiomechanicalProfile } from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';

interface PhaseInfo {
  key: string;
  title: string;
  desc: string;
  breath: string;
  badgeColor: string;
}

interface ExerciseMotionHeroCardProps {
  tutorial: ExerciseTutorial;
  biomechanics: BiomechanicalProfile;
  progress: number;
  repPhase: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: 0.5 | 1 | 1.5;
  onChangeSpeed: (speed: 0.5 | 1 | 1.5) => void;
  onScrub: (val: number) => void;
  phaseInfo: PhaseInfo;
  showGuides: boolean;
  onToggleGuides: () => void;
  showAngles: boolean;
  onToggleAngles: () => void;
  showGlow: boolean;
  onToggleGlow: () => void;
  onOpen3DInspector: () => void;
  childrenFigure: React.ReactNode;
}

export function ExerciseMotionHeroCard({
  tutorial,
  biomechanics,
  progress,
  repPhase,
  isPlaying,
  onTogglePlay,
  onReset,
  speed,
  onChangeSpeed,
  onScrub,
  phaseInfo,
  showGuides,
  onToggleGuides,
  showAngles,
  onToggleAngles,
  showGlow,
  onToggleGlow,
  onOpen3DInspector,
  childrenFigure
}: ExerciseMotionHeroCardProps) {
  const { t, isRTL } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      {/* Top Header & HUD Status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '0.6rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(70, 217, 255, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)',
            color: '#46d9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(70, 217, 255, 0.25)',
            border: '1px solid rgba(70, 217, 255, 0.3)'
          }}>
            <Compass size={19} />
          </div>
          <div>
            <h4 style={{ 
              margin: 0, 
              fontSize: '0.98rem', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem' 
            }}>
              <span>{t('motionSimulatorTitle')}</span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.16)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                60 FPS Live
              </span>
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isRTL ? biomechanics.tempoAr : `Tempo: ${biomechanics.tempo}`}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: '#46d9ff', fontWeight: 600 }}>
                {isRTL ? tutorial.targetMuscleAr : tutorial.targetMuscle}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Badge & Launch 3D Inspector Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          {/* Quick Launch 3D Studio Button */}
          <button
            type="button"
            onClick={onOpen3DInspector}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.12) 100%)',
              border: '1px solid rgba(70, 217, 255, 0.45)',
              color: '#46d9ff',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(70, 217, 255, 0.15)',
              transition: 'all 0.18s ease'
            }}
            title={t('inspectIn3D')}
          >
            <Box size={14} />
            <span>{t('inspectIn3D')}</span>
          </button>
        </div>
      </div>

      {/* Main Kinetic Visual Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '290px',
        borderRadius: '14px',
        backgroundColor: '#040711',
        border: '1px solid rgba(70, 217, 255, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.9), 0 8px 30px -6px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Subtle Athletic Grid Backdrop */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(70, 217, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(70, 217, 255, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} />

        {/* Ambient Top Light Glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '340px',
          height: '120px',
          background: 'radial-gradient(ellipse at center, rgba(70, 217, 255, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Breathing Prompt Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: isRTL ? undefined : '12px',
          right: isRTL ? '12px' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.28rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(8, 14, 28, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          fontSize: '0.74rem',
          color: '#38bdf8',
          fontWeight: 700,
          zIndex: 10
        }}>
          <Wind size={14} />
          <span>{phaseInfo.breath}</span>
        </div>

        {/* Target Muscle Glow Badge */}
        {showGlow && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: isRTL ? undefined : '12px',
            left: isRTL ? '12px' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.65rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.18)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(239, 68, 68, 0.38)',
            fontSize: '0.73rem',
            color: '#ff6b6b',
            fontWeight: 800,
            zIndex: 10
          }}>
            <Flame size={14} />
            <span>{isRTL ? `إجهاد العضلة: ${Math.round(50 + repPhase * 48)}%` : `Tension: ${Math.round(50 + repPhase * 48)}%`}</span>
          </div>
        )}

        {/* 3D Inspect Floating Badge button in canvas */}
        <button
          type="button"
          onClick={onOpen3DInspector}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: isRTL ? undefined : '12px',
            left: isRTL ? '12px' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            background: 'rgba(12, 18, 32, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(70, 217, 255, 0.4)',
            color: '#46d9ff',
            fontSize: '0.73rem',
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.18s ease'
          }}
        >
          <Box size={13} />
          <span>{t('inspectIn3D')}</span>
          <ChevronRight size={13} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
        </button>

        {/* Human Athletic Kinematic Motion Canvas */}
        <svg 
          viewBox="0 0 400 300" 
          style={{ width: '100%', height: '100%', maxHeight: '290px' }}
        >
          <defs>
            <filter id="heroSimGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="heroLaserLine" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="heroMetalPlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="heroBarbellSteel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {childrenFigure}
        </svg>
      </div>

      {/* Real-time Dynamic Biomechanical Form Cue Note */}
      <div style={{
        padding: '0.7rem 0.95rem',
        borderRadius: '11px',
        backgroundColor: 'rgba(255, 255, 255, 0.035)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)' }}>
          <Info size={16} style={{ color: '#46d9ff', flexShrink: 0 }} />
          <span>{phaseInfo.desc}</span>
        </div>
        <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Interactive Phase Scrubber Slider */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          marginBottom: '0.35rem' 
        }}>
          <span>{t('scrubPrompt')}</span>
          <span style={{ color: '#46d9ff', fontWeight: 700 }}>
            {repPhase > 0.85 ? (isRTL ? 'أقصى انقباض' : 'Peak Squeeze') : (isRTL ? 'تحت الشد' : 'Under Tension')}
          </span>
        </div>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={progress}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#46d9ff',
            cursor: 'pointer',
            height: '6px'
          }}
        />
      </div>

      {/* 5 Kinetic Rep Step Buttons */}
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
        ].map((step, idx) => {
          const isActive = Math.abs(progress - step.val) < 0.12;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onScrub(step.val)}
              style={{
                padding: '0.45rem 0.2rem',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(70, 217, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(70, 217, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#46d9ff' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls Bar (Play/Pause, Reset, Speed, Guides Toggle) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        paddingTop: '0.6rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Play / Pause & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={onTogglePlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              backgroundColor: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-primary)',
              color: isPlaying ? '#ef4444' : '#07131b',
              border: isPlaying ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            <span>{isPlaying ? t('pauseMotion') : t('playMotion')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem', 
          background: 'rgba(0, 0, 0, 0.35)', 
          padding: '0.2rem', 
          borderRadius: '8px' 
        }}>
          {([0.5, 1, 1.5] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                background: speed === s ? 'rgba(70, 217, 255, 0.22)' : 'transparent',
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
            onClick={onToggleGuides}
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
            onClick={onToggleAngles}
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
            onClick={onToggleGlow}
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
