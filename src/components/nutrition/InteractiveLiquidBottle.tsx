import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Droplets, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { gymAudio } from '../../lib/audio';

interface InteractiveLiquidBottleProps {
  todayWater: number;
  waterGoal: number;
  onLogWater: (amount: number) => void;
  onResetWater: () => void;
}

const QUICK_AMOUNTS = [
  { amount: 250, label: '250ml', icon: '🥛', descEn: 'Glass', descAr: 'كوب' },
  { amount: 500, label: '500ml', icon: '🍶', descEn: 'Bottle', descAr: 'قارورة' },
  { amount: 750, label: '750ml', icon: '🥤', descEn: 'Shaker', descAr: 'شيكر' },
  { amount: 1000, label: '1000ml', icon: '⚡', descEn: '1 Liter', descAr: '1 لتر' },
];

export function InteractiveLiquidBottle({
  todayWater,
  waterGoal,
  onLogWater,
  onResetWater
}: InteractiveLiquidBottleProps) {
  const { isRTL } = useTranslation();
  const [bubbleKey, setBubbleKey] = useState(0);

  const safeGoal = waterGoal > 0 ? waterGoal : 2500;
  const percentage = Math.min(100, Math.max(0, Math.round((todayWater / safeGoal) * 100)));
  const isComplete = todayWater >= safeGoal;
  const remaining = Math.max(0, safeGoal - todayWater);

  // SVG dimensions for the athletic water bottle
  // Bottle inner cavity: x: 30, y: 55, width: 80, height: 175
  const bottleHeight = 170;
  const bottleTopY = 60;
  const fillHeight = (percentage / 100) * bottleHeight;
  const waterSurfaceY = bottleTopY + (bottleHeight - fillHeight);

  const handleQuickLog = (amount: number) => {
    gymAudio.triggerSubtleHaptic([30, 45]);
    onLogWater(amount);
    setBubbleKey(prev => prev + 1);

    if (todayWater + amount >= safeGoal && todayWater < safeGoal) {
      gymAudio.playCelebrationFanfare();
    }
  };

  const handleReset = () => {
    if (window.confirm(isRTL ? 'هل تريد تصفير سجل شرب الماء لليوم؟' : 'Reset today\'s hydration log?')) {
      gymAudio.triggerSubtleHaptic([20]);
      onResetWater();
    }
  };

  return (
    <section
      className="interactive-liquid-bottle-card"
      style={{
        background: 'linear-gradient(145deg, rgba(10, 25, 45, 0.95) 0%, rgba(6, 15, 28, 0.98) 100%)',
        border: `1.5px solid ${isComplete ? 'rgba(16, 185, 129, 0.45)' : 'rgba(6, 182, 212, 0.35)'}`,
        borderRadius: '24px',
        padding: '1.25rem 1.4rem',
        boxShadow: `0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 30px -15px ${isComplete ? 'rgba(16, 185, 129, 0.35)' : 'rgba(6, 182, 212, 0.25)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxSizing: 'border-box'
      }}
      aria-label={isRTL ? 'قارورة الترطيب التفاعلية' : 'Interactive hydration bottle'}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.16)',
              border: '1px solid rgba(6, 182, 212, 0.38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
              flexShrink: 0
            }}
          >
            <Droplets size={17} aria-hidden="true" />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'قارورة الترطيب الذكية' : 'Smart Hydration Bottle'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL
                ? `${todayWater.toLocaleString()} من ${safeGoal.toLocaleString()} مل`
                : `${todayWater.toLocaleString()} / ${safeGoal.toLocaleString()} ml`}
            </span>
          </div>
        </div>

        {todayWater > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="touch-target btn-icon btn-ghost"
            style={{ width: 32, height: 32, color: 'var(--text-muted)' }}
            aria-label={isRTL ? 'تصفير عداد الماء' : 'Reset water'}
            title={isRTL ? 'تصفير العداد' : 'Reset'}
          >
            <RotateCcw size={15} />
          </button>
        )}
      </header>

      {/* Main Container: Interactive Bottle + Readout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', flexWrap: 'wrap' }}>
        {/* SVG Liquid Bottle */}
        <div style={{ position: 'relative', width: '130px', height: '240px', flexShrink: 0 }}>
          <svg
            viewBox="0 0 140 250"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            aria-hidden="true"
          >
            <defs>
              {/* Bottle glass outline gradient */}
              <linearGradient id="bottleGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#0284c7" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
              </linearGradient>

              {/* Water liquid gradient */}
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isComplete ? '#34d399' : '#38bdf8'} />
                <stop offset="50%" stopColor={isComplete ? '#10b981' : '#0ea5e9'} />
                <stop offset="100%" stopColor={isComplete ? '#059669' : '#0284c7'} />
              </linearGradient>

              {/* Cap gradient */}
              <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Clip path matching bottle interior */}
              <clipPath id="bottleInnerClip">
                <rect x="32" y="58" width="76" height="172" rx="14" />
              </clipPath>
            </defs>

            {/* Bottle Lid Handle & Spout */}
            <path
              d="M 50,18 C 50,10 90,10 90,18 L 86,32 L 54,32 Z"
              fill="url(#capGrad)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="1.5"
            />
            {/* Carabiner loop */}
            <circle cx="70" cy="18" r="7" fill="none" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2.5" />

            {/* Screw neck collar */}
            <rect x="46" y="32" width="48" height="16" rx="4" fill="#1e293b" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
            <line x1="46" y1="37" x2="94" y2="37" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            <line x1="46" y1="43" x2="94" y2="43" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />

            {/* Shoulder transitions */}
            <path
              d="M 46,48 C 46,55 30,55 30,68 L 30,225 C 30,238 42,244 70,244 C 98,244 110,238 110,225 L 110,68 C 110,55 94,55 94,48 Z"
              fill="rgba(15, 23, 42, 0.65)"
              stroke="url(#bottleGlassGrad)"
              strokeWidth="2"
            />

            {/* Liquid Interior with Clip */}
            <g clipPath="url(#bottleInnerClip)">
              {/* Main Liquid Column */}
              {percentage > 0 && (
                <rect
                  x="30"
                  y={waterSurfaceY}
                  width="80"
                  height={fillHeight + 10}
                  fill="url(#liquidGrad)"
                  style={{ transition: 'y 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.5s ease' }}
                />
              )}

              {/* Animated Wave Top on Water Surface */}
              {percentage > 0 && percentage < 100 && (
                <g transform={`translate(0, ${waterSurfaceY - 6})`}>
                  <path
                    d="M 25,6 Q 45,0 65,6 T 105,6 T 145,6 L 145,16 L 25,16 Z"
                    fill="url(#liquidGrad)"
                    opacity="0.9"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="-40,0"
                      to="0,0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              )}

              {/* Rising Bubble Particles when logged */}
              <AnimatePresence>
                {percentage > 0 && (
                  <g key={bubbleKey}>
                    <circle cx="50" cy={bottleTopY + bottleHeight - 20} r="2.5" fill="rgba(255, 255, 255, 0.6)">
                      <animate attributeName="cy" values={`${bottleTopY + bottleHeight - 10}; ${waterSurfaceY}`} dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8; 0" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="70" cy={bottleTopY + bottleHeight - 10} r="3.5" fill="rgba(255, 255, 255, 0.5)">
                      <animate attributeName="cy" values={`${bottleTopY + bottleHeight}; ${waterSurfaceY}`} dur="2.4s" begin="0.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8; 0" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="90" cy={bottleTopY + bottleHeight - 15} r="2" fill="rgba(255, 255, 255, 0.7)">
                      <animate attributeName="cy" values={`${bottleTopY + bottleHeight - 15}; ${waterSurfaceY}`} dur="1.5s" begin="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8; 0" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}
              </AnimatePresence>
            </g>

            {/* Measurement Graduations / Milliliter Ticks */}
            <g stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1">
              <line x1="102" y1="85" x2="108" y2="85" />
              <line x1="104" y1="115" x2="108" y2="115" />
              <line x1="102" y1="145" x2="108" y2="145" />
              <line x1="104" y1="175" x2="108" y2="175" />
              <line x1="102" y1="205" x2="108" y2="205" />
            </g>
            <text x="96" y="88" fill="rgba(255, 255, 255, 0.45)" fontSize="6" fontFamily="sans-serif" textAnchor="end">75%</text>
            <text x="96" y="148" fill="rgba(255, 255, 255, 0.45)" fontSize="6" fontFamily="sans-serif" textAnchor="end">50%</text>
            <text x="96" y="208" fill="rgba(255, 255, 255, 0.45)" fontSize="6" fontFamily="sans-serif" textAnchor="end">25%</text>

            {/* Specular bottle glass highlight */}
            <path
              d="M 36,68 L 36,220 C 36,225 38,230 42,232 L 42,66 Z"
              fill="rgba(255, 255, 255, 0.12)"
            />
          </svg>
        </div>

        {/* Readout & Status Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: '1 1 160px', minWidth: '150px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isComplete ? '#34d399' : '#38bdf8' }}>
            {isComplete ? (isRTL ? 'اكتمل هدف اليوم! 🎉' : 'Goal Crushed! 🎉') : (isRTL ? 'نسبة الإنجاز' : 'Hydration Level')}
          </span>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span
              className="font-mono tabular-nums font-display-black"
              style={{
                fontSize: 'clamp(2.4rem, 8vw, 3.2rem)',
                fontWeight: 900,
                color: isComplete ? '#10b981' : '#00f2fe',
                textShadow: `0 0 24px ${isComplete ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.4)'}`,
                lineHeight: 1
              }}
            >
              {percentage}%
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {isComplete ? (
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                {isRTL ? 'ممتاز! حققت المستوى الموصى به لترطيب الجسم والعضلات.' : 'Excellent! Optimal cellular & muscle hydration achieved.'}
              </span>
            ) : (
              <span>
                {isRTL ? `متبقٍ ${remaining.toLocaleString()} مل للهدف` : `${remaining.toLocaleString()} ml left to target`}
              </span>
            )}
          </div>

          {/* Target Milestone Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              width: 'fit-content',
              marginTop: '0.2rem'
            }}
          >
            <Sparkles size={12} style={{ color: '#00f2fe' }} />
            <span>{isRTL ? `الهدف: ${safeGoal} مل / يوم` : `Target: ${safeGoal} ml / day`}</span>
          </div>
        </div>
      </div>

      {/* Quick Sip Action Buttons */}
      <div
        className="liquid-bottle-actions-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.45rem',
          marginTop: '0.25rem'
        }}
      >
        {QUICK_AMOUNTS.map(item => (
          <button
            key={item.amount}
            type="button"
            onClick={() => handleQuickLog(item.amount)}
            className="touch-target"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.65rem 0.35rem',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              transition: 'all 0.15s ease',
              minHeight: '52px'
            }}
          >
            <span style={{ fontSize: '0.95rem', marginBottom: '0.1rem' }}>{item.icon}</span>
            <strong style={{ fontSize: '0.8rem', color: '#38bdf8' }}>+{item.label}</strong>
            <small style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {isRTL ? item.descAr : item.descEn}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
