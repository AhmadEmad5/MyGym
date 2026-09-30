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
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 auto' }}>
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
            <Flame size={17} aria-hidden="true" />
          </span>
          <span
            style={{
              fontSize: compact ? '0.82rem' : '0.9rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
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
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.35rem 0.7rem',
              borderRadius: '999px',
              minHeight: 32,
              // Never let the title squeeze this out of the row: the title
              // truncates first.
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <Calculator size={13} aria-hidden="true" />
            <span>{isRTL ? 'تعديل الأهداف' : 'Targets'}</span>
          </button>
        )}
      </header>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, flex: '1 1 150px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: heroPalette.accent,
              marginBottom: '0.35rem'
            }}
          >
            {isRTL ? 'السعرات المتبقية' : 'Calories left'}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', minWidth: 0 }}>
            <motion.span
              key={`${heroState}-${heroValue}`}
              initial={{ scale: 0.94, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              style={{
                fontSize: compact ? 'clamp(2.3rem, 10vw, 3rem)' : 'clamp(2.7rem, 12vw, 3.7rem)',
                // 800, not 950: Inter is loaded at 400-800, so anything higher
                // is synthesised by the browser as a fake bolder face.
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: heroPalette.accent,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 26px ${heroPalette.glow}`,
                minWidth: 0
              }}
            >
              {heroValue.toLocaleString()}
            </motion.span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>kcal</span>
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
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{isRTL ? 'المتناول' : 'Eaten'}</span>
            <span
              className="tabular-nums"
              style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'end' }}
            >
              {Math.round(todayCalories).toLocaleString()}
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}> / {safeTarget.toLocaleString()}</span>
              <span
                style={{
                  marginInlineStart: '0.35rem',
                  color: isOver ? '#f43f5e' : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                {eatenPercent}%
              </span>
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
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isOver
                ? isRTL ? 'تجاوزت الحد المسموح' : 'Past your limit'
                : isRTL ? `من هدفك` : `of your ${safeTarget.toLocaleString()} target`}
            </span>
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {isRTL ? 'محرق' : 'Burned'}{' '}
              <strong style={{ color: 'var(--text-secondary)', fontWeight: 700 }} className="tabular-nums">
                {Math.round(todayBurnedCalories).toLocaleString()}
              </strong>
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
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', whiteSpace: 'nowrap' }}>
          {isRTL ? 'صافي الطاقة' : 'Net'}{' '}
          <strong
            className="tabular-nums"
            style={{ color: netBalance <= 0 ? '#10b981' : '#f59e0b', fontWeight: 800 }}
          >
            {netBalance > 0 ? `+${Math.round(netBalance).toLocaleString()}` : Math.round(netBalance).toLocaleString()}
          </strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>kcal</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onLogMeal && (
            <button
              type="button"
              onClick={onLogMeal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#041316',
                border: 'none',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: 36,
                whiteSpace: 'nowrap'
              }}
            >
              {isRTL ? '+ سجّل وجبة' : '+ Log meal'}
            </button>
          )}
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: netBalance <= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              border: `1px solid ${netBalance <= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              color: netBalance <= 0 ? '#34d399' : '#fbbf24',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
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
