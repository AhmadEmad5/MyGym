import { motion } from 'framer-motion';
import { Flame, TrendingDown, TrendingUp, Calculator } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { SegmentedMacroPill } from './SegmentedMacroPill';

export interface DailyNutritionTargetsCardProps {
  todayCalories: number;
  todayBurnedCalories: number;
  dailyCaloriesTarget: number;
  todayProtein: number;
  dailyProteinTarget: number;
  todayCarbs: number;
  dailyCarbsTarget: number;
  todayFats: number;
  dailyFatsTarget: number;
  onEdit?: () => void;
  onLogMeal?: () => void;
  compact?: boolean;
}

const HERO_TINT = 'linear-gradient(145deg, rgba(16, 24, 42, 0.9) 0%, rgba(10, 15, 26, 0.96) 100%)';

export function DailyNutritionTargetsCard({
  todayCalories,
  todayBurnedCalories,
  dailyCaloriesTarget,
  todayProtein,
  dailyProteinTarget,
  todayCarbs,
  dailyCarbsTarget,
  todayFats,
  dailyFatsTarget,
  onEdit,
  onLogMeal,
  compact = false
}: DailyNutritionTargetsCardProps) {
  const { isRTL } = useTranslation();

  const safeTarget = dailyCaloriesTarget > 0 ? dailyCaloriesTarget : 0;
  const remaining = safeTarget - todayCalories;
  const isOver = remaining < 0;
  const isOnTarget = !isOver && safeTarget > 0 && Math.abs(remaining) <= Math.max(120, safeTarget * 0.04);
  const heroValue = Math.abs(Math.round(remaining));
  const heroState = isOver ? 'over' : isOnTarget ? 'onTarget' : 'under';

  const heroPalette = isOver
    ? { accent: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)', label: isRTL ? 'تجاوزت الهدف' : 'over target' }
    : isOnTarget
      ? { accent: '#facc15', glow: 'rgba(250, 204, 21, 0.3)', label: isRTL ? 'على الهدف تماماً' : 'on target' }
      : { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.32)', label: isRTL ? 'متبقٍ' : 'left' };

  const eatenPercent = safeTarget > 0 ? Math.min(150, Math.round((todayCalories / safeTarget) * 100)) : 0;
  const eatenWidth = safeTarget > 0 ? Math.min(100, (todayCalories / safeTarget) * 100) : 0;
  const netBalance = todayCalories - todayBurnedCalories;

  return (
    <section
      style={{
        background: HERO_TINT,
        border: `1px solid ${isOver ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-card)'}`,
        borderRadius: '24px',
        padding: compact ? '1.1rem 1.15rem' : '1.35rem 1.45rem',
        boxShadow: `0 16px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 40px -22px ${heroPalette.glow}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '0.9rem' : '1.1rem',
        boxSizing: 'border-box'
      }}
      aria-label={isRTL ? 'ميزانية السعرات والماكروز اليوم' : 'Today’s calorie and macro budget'}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0
            }}
          >
            <Flame size={17} />
          </span>
          <span style={{ fontSize: compact ? '0.82rem' : '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isRTL ? 'ميزانية اليوم' : 'Today’s Budget'}
          </span>
        </span>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 750,
              cursor: 'pointer',
              padding: '0.35rem 0.7rem',
              borderRadius: '999px',
              minHeight: 32
            }}
          >
            <Calculator size={13} />
            <span>{isRTL ? 'تعديل الأهداف' : 'Targets'}</span>
          </button>
        )}
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, flex: '1 1 150px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: heroPalette.accent,
              marginBottom: '0.3rem'
            }}
          >
            {isRTL ? 'السعرات المتبقية' : 'Calories left'}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            <motion.span
              key={`${heroState}-${heroValue}`}
              initial={{ scale: 0.94, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              style={{
                fontSize: compact ? 'clamp(2.4rem, 11vw, 3.1rem)' : 'clamp(2.9rem, 13vw, 3.9rem)',
                fontWeight: 950,
                letterSpacing: '-0.04em',
                color: heroPalette.accent,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 26px ${heroPalette.glow}`
              }}
            >
              {heroValue.toLocaleString()}
            </motion.span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>kcal</span>
          </span>
          <span
            style={{
              marginTop: '0.45rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              alignSelf: 'flex-start',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: `${heroPalette.accent}1f`,
              border: `1px solid ${heroPalette.accent}66`,
              color: heroPalette.accent
            }}
          >
            {isOver ? <TrendingUp size={12} /> : isOnTarget ? <Flame size={12} /> : <TrendingDown size={12} />}
            <span>
              {heroValue > 0 ? heroPalette.label : isRTL ? 'اكتمل الهدف' : 'target met'}
            </span>
          </span>
        </div>

        <div
          style={{
            flex: '1 1 190px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700 }}>{isRTL ? 'المتناول' : 'Eaten'}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: 'var(--text-primary)' }}>
              {Math.round(todayCalories).toLocaleString()} / {safeTarget.toLocaleString()}
            </span>
          </span>
          <span
            style={{
              display: 'block',
              position: 'relative',
              height: 12,
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={safeTarget || 1}
            aria-valuenow={Math.round(todayCalories)}
            aria-label={isRTL ? 'تقدم السعرات المتناولة' : 'Calories eaten'}
          >
            <motion.span
              initial={false}
              animate={{ width: `${eatenWidth}%` }}
              transition={{ type: 'spring', stiffness: 150, damping: 22 }}
              style={{
                display: 'block',
                height: '100%',
                borderRadius: '999px',
                background: isOver ? OVER_FILL : `linear-gradient(${isRTL ? '270deg' : '90deg'}, #10b981, #06b6d4)`
              }}
            />
            {isOver && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(${isRTL ? -45 : 45}deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 8px)`
                }}
              />
            )}
          </span>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{isOver ? isRTL ? 'تجاوزت الحد المسموح' : 'past your limit' : `${eatenPercent}%`}</span>
            <span>
              {isRTL ? 'محرق' : 'burned'} {Math.round(todayBurnedCalories).toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      <SegmentedMacroPill
        protein={todayProtein}
        targetProtein={dailyProteinTarget}
        carbs={todayCarbs}
        targetCarbs={dailyCarbsTarget}
        fats={todayFats}
        targetFats={dailyFatsTarget}
        compact={compact}
      />

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span>
          {isRTL ? 'صافي الطاقة' : 'Net'} <strong style={{ color: netBalance <= 0 ? '#10b981' : '#f59e0b' }}>{netBalance > 0 ? `+${Math.round(netBalance)}` : Math.round(netBalance)}</strong> kcal
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onLogMeal && (
            <button
              type="button"
              onClick={onLogMeal}
              style={{
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#041316',
                border: 'none',
                borderRadius: '999px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 850,
                cursor: 'pointer',
                minHeight: 34
              }}
            >
              {isRTL ? '+ سجّل وجبة' : '+ Log meal'}
            </button>
          )}
          <span>
            {netBalance <= 0
              ? isRTL ? 'عجز سعرات (cut)' : 'Deficit · cut'
              : isRTL ? 'فائض سعرات (bulk)' : 'Surplus · bulk'}
          </span>
        </span>
      </footer>
    </section>
  );
}

const OVER_FILL = '#f43f5e';
