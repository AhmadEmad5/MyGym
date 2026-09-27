import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface ActivityRingsProps {
  burnedCalories: number;
  calorieGoal?: number;
  activeMinutes: number;
  minuteGoal?: number;
  waterMl: number;
  waterGoal?: number;
}

export function ActivityRingsWidget({
  burnedCalories,
  calorieGoal = 500,
  activeMinutes,
  minuteGoal = 45,
  waterMl,
  waterGoal = 2500
}: ActivityRingsProps) {
  const { isRTL } = useTranslation();

  // Progress percentages (can exceed 100%)
  const caloriePct = useMemo(() => Math.min(100, Math.round((burnedCalories / calorieGoal) * 100)), [burnedCalories, calorieGoal]);
  const minutePct = useMemo(() => Math.min(100, Math.round((activeMinutes / minuteGoal) * 100)), [activeMinutes, minuteGoal]);
  const waterPct = useMemo(() => Math.min(100, Math.round((waterMl / waterGoal) * 100)), [waterMl, waterGoal]);

  // Overall average
  const totalScore = Math.round((caloriePct + minutePct + waterPct) / 3);

  // SVG Ring dimensions
  // Ring 1 (Outer - Calories): R=52, Circumference = 2 * PI * 52 ≈ 326.7
  const r1 = 52;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (caloriePct / 100) * c1;

  // Ring 2 (Middle - Activity): R=39, Circumference = 2 * PI * 39 ≈ 245.0
  const r2 = 39;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (minutePct / 100) * c2;

  // Ring 3 (Inner - Water): R=26, Circumference = 2 * PI * 26 ≈ 163.4
  const r3 = 26;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 - (waterPct / 100) * c3;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 18, 28, 0.8) 0%, rgba(8, 12, 20, 0.9) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '1.25rem 1.4rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      marginBottom: '1.5rem'
    }}>
      {/* Subtle background ambient light */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: isRTL ? 'auto' : '-40px',
        left: isRTL ? '-40px' : 'auto',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(198, 244, 50, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(198, 244, 50, 0.15)',
            color: '#c6f432',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
            {isRTL ? 'حلقات النشاط اليومي' : 'Daily Activity Rings'}
          </h4>
        </div>

        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          background: totalScore >= 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
          color: totalScore >= 100 ? '#10b981' : 'var(--text-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {totalScore}% {isRTL ? 'إنجاز' : 'Score'}
        </div>
      </div>

      {/* Main Rings + Metrics Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '1.5rem',
        alignItems: 'center'
      }}>
        {/* Concentric 3-Ring SVG Graphic */}
        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
          <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              {/* Outer Ring Gradient (Calories - Flame) */}
              <linearGradient id="ringCalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              {/* Middle Ring Gradient (Activity - Volt Lime) */}
              <linearGradient id="ringMinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c6f432" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              {/* Inner Ring Gradient (Water - Cyan) */}
              <linearGradient id="ringWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Background Tracks */}
            <circle cx="65" cy="65" r={r1} fill="none" stroke="rgba(245, 158, 11, 0.12)" strokeWidth="10" />
            <circle cx="65" cy="65" r={r2} fill="none" stroke="rgba(198, 244, 50, 0.12)" strokeWidth="9" />
            <circle cx="65" cy="65" r={r3} fill="none" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="8" />

            {/* Animated Active Rings */}
            {/* 1. Calories Ring (Outer) */}
            <motion.circle
              cx="65"
              cy="65"
              r={r1}
              fill="none"
              stroke="url(#ringCalGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c1}
              initial={{ strokeDashoffset: c1 }}
              animate={{ strokeDashoffset: offset1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* 2. Minutes Ring (Middle) */}
            <motion.circle
              cx="65"
              cy="65"
              r={r2}
              fill="none"
              stroke="url(#ringMinGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={c2}
              initial={{ strokeDashoffset: c2 }}
              animate={{ strokeDashoffset: offset2 }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 }}
            />

            {/* 3. Water Ring (Inner) */}
            <motion.circle
              cx="65"
              cy="65"
              r={r3}
              fill="none"
              stroke="url(#ringWaterGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c3}
              initial={{ strokeDashoffset: c3 }}
              animate={{ strokeDashoffset: offset3 }}
              transition={{ duration: 1.6, ease: 'easeOut', delay: 0.2 }}
            />
          </svg>

          {/* Center Trophy Icon if completed or center logo */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: totalScore >= 100 ? '#c6f432' : 'var(--text-muted)'
          }}>
            {totalScore >= 100 ? <Trophy size={18} /> : <Flame size={18} />}
          </div>
        </div>

        {/* Right Side: 3 Metrics Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* 1. Calories Burned */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isRTL ? 'حرق الحريرات' : 'Move Calories'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b' }}>
              {burnedCalories} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {calorieGoal} kcal</span>
            </div>
          </div>

          {/* 2. Workout Duration */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c6f432' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isRTL ? 'وقت التمرين' : 'Exercise Time'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c6f432' }}>
              {activeMinutes} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {minuteGoal} min</span>
            </div>
          </div>

          {/* 3. Hydration */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isRTL ? 'الترطيب والماء' : 'Hydration'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
              {waterMl} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {waterGoal} ml</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
