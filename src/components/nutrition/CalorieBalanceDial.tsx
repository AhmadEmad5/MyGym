import { motion } from 'framer-motion';
import {
  Flame,
  TrendingDown,
  TrendingUp,
  Calculator,
  Plus,
  Scale
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

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

  const safeTarget = dailyCaloriesTarget > 0 ? dailyCaloriesTarget : 2200;
  // Total Expended = Base metabolic budget + workout calories burned
  const totalExpended = safeTarget + todayBurnedCalories;
  // Net Balance = Consumed - Expended
  const netBalance = Math.round(todayCalories - totalExpended);
  // Remaining to target budget
  const remainingBudget = Math.round(safeTarget - todayCalories);

  // States
  const isDeficit = netBalance < -80;
  const isSurplus = netBalance > 80;

  const statusTheme = isDeficit
    ? {
        label: isRTL ? 'عجز سعرات (حرق دهون)' : 'Caloric Deficit (Fat Loss)',
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.35)',
        icon: TrendingDown,
        badgeBg: 'rgba(16, 185, 129, 0.16)',
        badgeBorder: 'rgba(16, 185, 129, 0.35)'
      }
    : isSurplus
      ? {
          label: isRTL ? 'فائض سعرات (بناء عضلي)' : 'Caloric Surplus (Muscle Mass)',
          color: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.35)',
          icon: TrendingUp,
          badgeBg: 'rgba(245, 158, 11, 0.16)',
          badgeBorder: 'rgba(245, 158, 11, 0.35)'
        }
      : {
          label: isRTL ? 'توازن وثبات وزني' : 'Energy Equilibrium',
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.35)',
          icon: Scale,
          badgeBg: 'rgba(56, 189, 248, 0.16)',
          badgeBorder: 'rgba(56, 189, 248, 0.35)'
        };

  // Dial calculations for semi-circular gauge (180 degrees)
  // Radius: 85, Arc length: PI * 85 ~= 267
  const radius = 80;
  const circumference = Math.PI * radius;
  // Intake ratio (0 to 1)
  const intakeRatio = Math.min(1.5, Math.max(0, todayCalories / safeTarget));
  // Stroke dash offset
  const strokeOffset = circumference - Math.min(1, intakeRatio) * circumference;

  // Pointer needle angle (-90 deg to +90 deg, 0 is center balance)
  // Mapping net balance from -800 to +800 into -75 to +75 degrees
  const clampedNet = Math.max(-800, Math.min(800, netBalance));
  const needleAngle = (clampedNet / 800) * 75;

  return (
    <section
      className="calorie-balance-dial-card"
      style={{
        background: 'linear-gradient(145deg, rgba(16, 24, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
        border: `1.5px solid ${statusTheme.color}40`,
        borderRadius: '24px',
        padding: '1.25rem 1.45rem',
        boxShadow: `0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 35px -18px ${statusTheme.glow}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxSizing: 'border-box'
      }}
      aria-label={isRTL ? 'مؤشر توازن السعرات والطاقة' : 'Calorie and energy balance dial'}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: `${statusTheme.color}22`,
              border: `1px solid ${statusTheme.color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: statusTheme.color,
              flexShrink: 0
            }}
          >
            <Flame size={17} aria-hidden="true" />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'مؤشر توازن الطاقة والسعرات' : 'Energy Balance Dial'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL ? 'المتناول مقابل المستهلك مع التمارين' : 'Intake vs Total Energy Expenditure'}
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
                padding: '0.35rem 0.65rem',
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
                padding: '0.35rem 0.65rem',
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

      {/* Main Gauge Visual + Net Number */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '220px', height: '125px', overflow: 'hidden' }}>
          <svg
            viewBox="0 0 200 115"
            style={{ width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dialTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>

              <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background semi-circular track */}
            <path
              d="M 20,105 A 80,80 0 0,1 180,105"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active filled arc */}
            <path
              d="M 20,105 A 80,80 0 0,1 180,105"
              fill="none"
              stroke="url(#dialTrackGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              filter="url(#dialGlow)"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />

            {/* Target indicator pip at 100% */}
            <circle cx="100" cy="25" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

            {/* Center Pivot & Needle */}
            <g transform={`rotate(${needleAngle}, 100, 105)`} style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <line x1="100" y1="105" x2="100" y2="35" stroke={statusTheme.color} strokeWidth="3" strokeLinecap="round" />
              <polygon points="100,28 96,38 104,38" fill={statusTheme.color} />
            </g>
            <circle cx="100" cy="105" r="7" fill="#0f172a" stroke={statusTheme.color} strokeWidth="2.5" />
          </svg>
        </div>

        {/* Center Net Value Display */}
        <div style={{ textAlign: 'center', marginTop: '-1.25rem', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem' }}>
            <motion.span
              key={netBalance}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono tabular-nums font-display-black"
              style={{
                fontSize: 'clamp(2.1rem, 7vw, 2.7rem)',
                fontWeight: 900,
                color: statusTheme.color,
                textShadow: `0 0 20px ${statusTheme.glow}`,
                lineHeight: 1
              }}
            >
              {netBalance > 0 ? `+${netBalance}` : netBalance}
            </motion.span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>kcal</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              background: statusTheme.badgeBg,
              border: `1px solid ${statusTheme.badgeBorder}`,
              color: statusTheme.color,
              fontSize: '0.74rem',
              fontWeight: 800,
              marginTop: '0.35rem'
            }}
          >
            <statusTheme.icon size={13} />
            <span>{statusTheme.label}</span>
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
          padding: '0.75rem',
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
            {remainingBudget >= 0
              ? (isRTL ? `متبقٍ ${remainingBudget} من الهدف` : `${remainingBudget} left of target`)
              : (isRTL ? `تجاوزت الهدف بـ ${Math.abs(remainingBudget)}` : `${Math.abs(remainingBudget)} over target`)}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
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
                background: '#06b6d4'
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
                background: '#f59e0b'
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
                background: '#ec4899'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
