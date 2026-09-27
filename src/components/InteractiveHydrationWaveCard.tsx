import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, RotateCcw } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

interface InteractiveHydrationWaveCardProps {
  todayWater: number;
  waterGoal: number;
  onLogWater: (amount: number) => void;
  onResetWater: () => void;
}

export function InteractiveHydrationWaveCard({
  todayWater,
  waterGoal,
  onLogWater,
  onResetWater
}: InteractiveHydrationWaveCardProps) {
  const { isRTL } = useTranslation();

  const waterPct = useMemo(() => {
    if (waterGoal <= 0) return 0;
    return Math.min(100, Math.round((todayWater / waterGoal) * 100));
  }, [todayWater, waterGoal]);

  const handleAdd = (amount: number) => {
    gymAudio.triggerSubtleHaptic([30, 45]);
    onLogWater(amount);
    if (todayWater + amount >= waterGoal && todayWater < waterGoal) {
      gymAudio.playCelebrationFanfare();
    }
  };

  const handleReset = () => {
    if (window.confirm(isRTL ? 'هل تريد تصفير عداد الماء لليوم؟' : 'Reset today\'s hydration log?')) {
      gymAudio.triggerSubtleHaptic([20]);
      onResetWater();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(16, 24, 42, 0.88) 0%, rgba(10, 15, 26, 0.95) 100%)',
      border: '1px solid var(--border-card)',
      borderRadius: '24px',
      padding: '1.35rem 1.45rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      marginBottom: '0'
    }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(6, 182, 212, 0.25))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Droplets size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
              {isRTL ? 'الوعاء المائي التفاعلي' : 'Interactive Hydration Chamber'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'ترطيب الألياف ومنع الإجهاد العضلي' : 'Fluid balance & muscle recovery'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            background: waterPct >= 100 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.15)',
            color: waterPct >= 100 ? '#34d399' : '#38bdf8',
            border: `1px solid ${waterPct >= 100 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`
          }}>
            {waterPct >= 100 ? '✓ ' : ''}{waterPct}% {isRTL ? 'مكتمل' : 'Goal'}
          </span>

          <button
            type="button"
            className="btn-icon btn-ghost"
            onClick={handleReset}
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
            title={isRTL ? 'تصفير' : 'Reset'}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main 3D Wave Chamber & Volume Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '1.25rem',
        alignItems: 'center'
      }}>
        {/* Left: Cylindrical Glass Flask with Wave Animation */}
        <div style={{
          position: 'relative',
          width: '110px',
          height: '160px',
          margin: '0 auto',
          borderRadius: '24px',
          border: '2px solid rgba(56, 189, 248, 0.35)',
          background: 'rgba(6, 15, 28, 0.75)',
          boxShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.15), 0 8px 24px -6px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          {/* Glass Measurement Marks */}
          <div style={{ position: 'absolute', right: '6px', top: '25%', width: '8px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', right: '6px', top: '50%', width: '12px', height: '1.5px', background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', right: '6px', top: '75%', width: '8px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Liquid Level Column */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(8, waterPct)}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            style={{
              width: '100%',
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.85) 0%, rgba(6, 182, 212, 0.95) 100%)',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
            }}
          >
            {/* SVG Animated Wave Cap */}
            <svg
              viewBox="0 0 120 28"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: '-20px',
                left: 0,
                width: '100%',
                height: '24px',
                pointerEvents: 'none',
                overflow: 'visible'
              }}
            >
              <motion.path
                d="M 0,14 C 30,5 60,23 90,14 C 105,9 115,18 120,14 L 120,28 L 0,28 Z"
                fill="rgba(56, 189, 248, 0.85)"
                animate={{
                  d: [
                    "M 0,14 C 30,5 60,23 90,14 C 105,9 115,18 120,14 L 120,28 L 0,28 Z",
                    "M 0,14 C 30,23 60,5 90,14 C 105,18 115,9 120,14 L 120,28 L 0,28 Z",
                    "M 0,14 C 30,5 60,23 90,14 C 105,9 115,18 120,14 L 120,28 L 0,28 Z"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </svg>

            {/* Rising Micro Bubbles */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '30%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)'
              }}
              animate={{ y: [-10, -50], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
            />
            <motion.div
              style={{
                position: 'absolute',
                bottom: '5px',
                left: '65%',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)'
              }}
              animate={{ y: [-5, -60], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.5, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Center Flask Text */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}>
              {waterPct}%
            </span>
          </div>
        </div>

        {/* Right: Quantity Metrics & Quick Logging Cups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 950, color: '#38bdf8', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {todayWater.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                / {waterGoal.toLocaleString()} ml
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {waterPct >= 100 
                ? (isRTL ? '🎉 أحسنت! حققت هدف الترطيب اليومي بكفاءة.' : '🎉 Hydration target reached!') 
                : (isRTL ? `المتبقي للوصول للهدف: ${Math.max(0, waterGoal - todayWater)} ml` : `Remaining: ${Math.max(0, waterGoal - todayWater)} ml`)}
            </span>
          </div>

          {/* Quick Cups Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleAdd(250)}
              style={{
                padding: '0.55rem 0.25rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: 0
              }}
            >
              <span style={{ fontSize: '1rem' }}>🥛</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>+250ml</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdd(500)}
              style={{
                padding: '0.55rem 0.25rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: 0
              }}
            >
              <span style={{ fontSize: '1rem' }}>🧴</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>+500ml</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdd(1000)}
              style={{
                padding: '0.55rem 0.25rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: 0
              }}
            >
              <span style={{ fontSize: '1rem' }}>🫗</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>+1L</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
