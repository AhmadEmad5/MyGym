import { motion } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  Calculator,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { DEFAULT_NUTRITION_TARGETS } from '../../lib/api';

export interface CalorieBalanceDialProps {
  todayCalories: number;
  todayBurnedCalories: number;
  dailyCaloriesTarget: number;
  todayProtein: number;
  dailyProteinTarget: number;
  todayCarbs: number;
  dailyCarbsTarget: number;
  todayFats: number;
  dailyFatsTarget: number;
  onEditTargets?: () => void;
  onLogMeal?: () => void;
}

export function CalorieBalanceDial({
  todayCalories,
  todayBurnedCalories,
  dailyCaloriesTarget,
  todayProtein,
  dailyProteinTarget,
  todayCarbs,
  dailyCarbsTarget,
  todayFats,
  dailyFatsTarget,
  onEditTargets,
  onLogMeal
}: CalorieBalanceDialProps) {
  const { isRTL } = useTranslation();

  const safeTarget = dailyCaloriesTarget > 0 ? dailyCaloriesTarget : DEFAULT_NUTRITION_TARGETS.calories;
  const totalExpended = safeTarget + todayBurnedCalories;
  const remainingBudget = Math.round(safeTarget - todayCalories);
  const isOverTarget = remainingBudget < 0;

  // Progress from 0 (0 kcal) to 1.0 (100% of target at right end of dial)
  const progressRatio = safeTarget > 0 ? Math.max(0, todayCalories / safeTarget) : 0;
  const clampedProgress = Math.min(1, progressRatio);

  // SVG Gauge Geometry:
  // Radius: 95, Center: (120, 130)
  // Arc spans 160°: from -80° (Left, 0%) to +80° (Right, 100% / End of count)
  // Start: (26.44, 113.5), End: (213.56, 113.5)
  const radius = 95;
  const arcLength = radius * (160 * Math.PI / 180); // ~265.29

  // Needle angle sweeps from -80° to +80°:
  // At 0 kcal => -80°
  // At 50% => 0° (top center)
  // At 100% (target) => +80° (right end - نهاية العد!)
  const needleAngle = -80 + (clampedProgress * 160);

  // Stroke offset: 0% = arcLength, 100% = 0
  const strokeOffset = arcLength * (1 - clampedProgress);

  // Palette & Status
  const statusColor = isOverTarget
    ? '#f43f5e'
    : progressRatio >= 0.95
      ? '#10b981'
      : progressRatio >= 0.5
        ? '#06b6d4'
        : '#38bdf8';

  const statusGlow = isOverTarget
    ? 'rgba(244, 63, 94, 0.4)'
    : progressRatio >= 0.95
      ? 'rgba(16, 185, 129, 0.4)'
      : 'rgba(56, 189, 248, 0.4)';

  return (
    <section
      className="calorie-balance-dial-card"
      style={{
        background: 'linear-gradient(145deg, rgba(16, 24, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
        border: `1.5px solid ${statusColor}40`,
        borderRadius: '24px',
        padding: '1.25rem 1.45rem',
        boxShadow: `0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 35px -18px ${statusGlow}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxSizing: 'border-box'
      }}
      aria-label={isRTL ? 'مؤشر السعرات والهدف اليومي' : 'Daily Calorie and Goal Dial'}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '11px',
              background: `${statusColor}22`,
              border: `1px solid ${statusColor}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: statusColor,
              flexShrink: 0
            }}
          >
            <Flame size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'مؤشر السعرات والهدف اليومي' : 'Daily Calorie Dial'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'تتبع تقدم الوجبات نحو هدف اليوم' : 'Track intake progression toward daily goal'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {onLogMeal && (
            <button
              type="button"
              onClick={onLogMeal}
              className="touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.7rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>{isRTL ? 'وجبة' : 'Meal'}</span>
            </button>
          )}

          {onEditTargets && (
            <button
              type="button"
              onClick={onEditTargets}
              className="touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.7rem',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Calculator size={13} />
              <span>{isRTL ? 'الأهداف' : 'Goals'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Gauge Visual + Center Number */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '260px', height: '150px', overflow: 'hidden' }}>
          <svg
            viewBox="0 0 240 145"
            style={{ width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="calorieDialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="85%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor={isOverTarget ? '#f43f5e' : '#10b981'} />
              </linearGradient>

              <filter id="dialGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background semi-circular track */}
            <path
              d="M 26.44,113.5 A 95,95 0 0,1 213.56,113.5"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Scale Markers: 0 at start, 50% at top, 100% Goal at the end */}
            <text x="24" y="132" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">0%</text>
            <text x="120" y="24" textAnchor="middle" fill="#64748b" fontSize="7.5" fontWeight="700">50%</text>
            <text x="214" y="132" textAnchor="middle" fill={clampedProgress >= 1 ? '#10b981' : '#64748b'} fontSize="8" fontWeight="800">
              100%
            </text>
            <text x="214" y="142" textAnchor="middle" fill={clampedProgress >= 1 ? '#10b981' : '#38bdf8'} fontSize="7" fontWeight="800">
              {isRTL ? 'الهدف' : 'GOAL'}
            </text>

            {/* Start point dot */}
            <circle cx="26.44" cy="113.5" r="3.5" fill="rgba(255, 255, 255, 0.2)" />

            {/* Target indicator pip at 100% (right end) */}
            <circle
              cx="213.56"
              cy="113.5"
              r={clampedProgress >= 1 ? 5.5 : 4.5}
              fill={clampedProgress >= 1 ? '#10b981' : '#0f172a'}
              stroke={clampedProgress >= 1 ? '#ffffff' : '#38bdf8'}
              strokeWidth="1.8"
            />

            {/* Active filled arc with Framer Motion spring */}
            <motion.path
              d="M 26.44,113.5 A 95,95 0 0,1 213.56,113.5"
              fill="none"
              stroke="url(#calorieDialGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              initial={false}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.8 }}
              filter="url(#dialGlowFilter)"
            />

            {/* Center Pivot & Needle with Framer Motion spring */}
            <motion.g
              initial={false}
              animate={{ rotate: needleAngle }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.8 }}
              style={{ transformOrigin: '120px 130px' }}
            >
              <line x1="120" y1="130" x2="120" y2="44" stroke={statusColor} strokeWidth="3" strokeLinecap="round" />
              <polygon points="120,36 116,46 124,46" fill={statusColor} />
            </motion.g>
            <circle cx="120" cy="130" r="7.5" fill="#0f172a" stroke={statusColor} strokeWidth="2.5" />
            <circle cx="120" cy="130" r="3" fill={statusColor} />
          </svg>

          {/* Clean, spacious center display */}
          <div
            style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem' }}>
              <motion.span
                key={todayCalories}
                initial={{ scale: 0.92, opacity: 0.75 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="font-mono tabular-nums font-display-black"
                style={{
                  fontSize: 'clamp(2.1rem, 7vw, 2.7rem)',
                  fontWeight: 900,
                  color: statusColor,
                  textShadow: `0 0 25px ${statusGlow}`,
                  lineHeight: 1
                }}
              >
                {Math.round(todayCalories).toLocaleString()}
              </motion.span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                / {safeTarget.toLocaleString()} <small style={{ fontSize: '0.72rem', fontWeight: 600 }}>kcal</small>
              </span>
            </div>

            <div
              style={{
                marginTop: '0.45rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.75rem',
                borderRadius: '999px',
                background: isOverTarget ? 'rgba(244, 63, 94, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                border: `1px solid ${isOverTarget ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                color: isOverTarget ? '#f43f5e' : '#10b981',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              {isOverTarget ? (
                <>
                  <TrendingUp size={13} />
                  <span>
                    {isRTL
                      ? `تجاوزت الهدف بـ ${Math.abs(remainingBudget).toLocaleString()} kcal`
                      : `${Math.abs(remainingBudget).toLocaleString()} kcal over target`}
                  </span>
                </>
              ) : remainingBudget === 0 ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>{isRTL ? 'حققت الهدف اليومي تماماً! 🎉' : 'Daily goal achieved! 🎉'}</span>
                </>
              ) : (
                <>
                  <Flame size={13} />
                  <span>
                    {isRTL
                      ? `متبقٍ ${remainingBudget.toLocaleString()} kcal للهدف (${Math.round(clampedProgress * 100)}%)`
                      : `${remainingBudget.toLocaleString()} kcal left (${Math.round(clampedProgress * 100)}%)`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Balance Pillars: Intake vs Expenditure */}
      <div
        className="calorie-balance-pillars"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Left: Intake */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: isRTL ? 'right' : 'left' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {isRTL ? 'إجمالي السعرات المتناولة' : 'Energy In (Meals)'}
          </span>
          <span className="font-mono tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
            {Math.round(todayCalories).toLocaleString()} <small style={{ fontSize: '0.7rem' }}>kcal</small>
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {isRTL
              ? `نسبة الإنجاز: ${Math.round(clampedProgress * 100)}% من الهدف`
              : `${Math.round(clampedProgress * 100)}% of daily target`}
          </span>
        </div>

        {/* Right: Expended */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: isRTL ? 'left' : 'right' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {isRTL ? 'إجمالي الطاقة المستهلكة' : 'Energy Out (TDEE + Burn)'}
          </span>
          <span className="font-mono tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>
            {Math.round(totalExpended).toLocaleString()} <small style={{ fontSize: '0.7rem' }}>kcal</small>
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {todayBurnedCalories > 0
              ? (isRTL ? `حرق تمارين: +${Math.round(todayBurnedCalories)} kcal` : `Workout burn: +${Math.round(todayBurnedCalories)} kcal`)
              : (isRTL ? 'أيام التدريب تزيد الحرق' : 'Workouts boost expenditure')}
          </span>
        </div>
      </div>

      {/* Compact Macro Trackers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.1rem' }}>
        {/* Protein */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 800, color: '#06b6d4' }}>{isRTL ? 'بروتين' : 'Protein'}</span>
            <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {Math.round(todayProtein)}/{dailyProteinTarget || 160}g
            </span>
          </div>
          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (todayProtein / (dailyProteinTarget || 160)) * 100)}%`,
                height: '100%',
                background: '#06b6d4',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 800, color: '#f59e0b' }}>{isRTL ? 'كارب' : 'Carbs'}</span>
            <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {Math.round(todayCarbs)}/{dailyCarbsTarget || 250}g
            </span>
          </div>
          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (todayCarbs / (dailyCarbsTarget || 250)) * 100)}%`,
                height: '100%',
                background: '#f59e0b',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Fats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ fontWeight: 800, color: '#ec4899' }}>{isRTL ? 'دهون' : 'Fats'}</span>
            <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {Math.round(todayFats)}/{dailyFatsTarget || 70}g
            </span>
          </div>
          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (todayFats / (dailyFatsTarget || 70)) * 100)}%`,
                height: '100%',
                background: '#ec4899',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
