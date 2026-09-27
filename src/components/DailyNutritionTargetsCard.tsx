import { Flame } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

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
}

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
  onEdit
}: DailyNutritionTargetsCardProps) {
  const { isRTL } = useTranslation();

  const calPercent = dailyCaloriesTarget > 0 
    ? Math.round((todayCalories / dailyCaloriesTarget) * 100) 
    : 0;
  const proteinPercent = dailyProteinTarget > 0 
    ? Math.round((todayProtein / dailyProteinTarget) * 100) 
    : 0;
  const carbsPercent = dailyCarbsTarget > 0 
    ? Math.round((todayCarbs / dailyCarbsTarget) * 100) 
    : 0;
  const fatsPercent = dailyFatsTarget > 0 
    ? Math.round((todayFats / dailyFatsTarget) * 100) 
    : 0;

  const netBalance = todayCalories - todayBurnedCalories;

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
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'rgba(16, 185, 129, 0.16)',
            border: '1px solid rgba(16, 185, 129, 0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Flame size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRTL ? 'أهداف التغذية اليومية' : 'Daily Nutrition Targets'}
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {isRTL 
                ? `المتناولة: ${todayCalories.toLocaleString()} ك.سعرة · المحروقة: ${todayBurnedCalories.toLocaleString()} ك.سعرة`
                : `Calories In: ${todayCalories.toLocaleString()} kcal · Calories Out: ${todayBurnedCalories.toLocaleString()} kcal`}
            </span>
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              transition: 'all 0.2s ease'
            }}
          >
            {isRTL ? 'تعديل' : 'Edit'}
          </button>
        )}
      </div>

      {/* Calories Progress Bar */}
      <div style={{ marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            {isRTL ? 'السعرات' : 'Calories'}
          </span>
          <span style={{ fontWeight: 800 }}>
            <span style={{ color: todayCalories > dailyCaloriesTarget ? '#f43f5e' : '#ffffff' }}>
              {todayCalories.toLocaleString()}
            </span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {' '}/ {dailyCaloriesTarget.toLocaleString()} kcal
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginInlineStart: '0.35rem' }}>
              ({calPercent}%)
            </span>
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${Math.min(100, calPercent)}%`, 
              height: '100%', 
              background: todayCalories > dailyCaloriesTarget 
                ? '#f43f5e' 
                : 'linear-gradient(90deg, #10b981, #06b6d4)', 
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} 
          />
        </div>
      </div>

      {/* Macros Breakdown: Protein, Carbs, Fats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Protein */}
        <div style={{
          padding: '0.85rem 0.8rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '14px',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 800, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>🥩</span> {isRTL ? 'بروتين' : 'Protein'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{proteinPercent}%</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#06b6d4', fontVariantNumeric: 'tabular-nums' }}>
            {todayProtein}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{dailyProteinTarget}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', margin: '0.35rem 0 0.25rem' }}>
            <div style={{ width: `${Math.min(100, proteinPercent)}%`, height: '100%', background: '#06b6d4', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isRTL ? 'بناء وتضخيم الأنسجة' : 'Hypertrophy & repair'}
          </span>
        </div>

        {/* Carbs */}
        <div style={{
          padding: '0.85rem 0.8rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '14px',
          border: '1px solid rgba(245, 158, 11, 0.28)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>⚡</span> {isRTL ? 'كارب' : 'Carbs'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{carbsPercent}%</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
            {todayCarbs}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{dailyCarbsTarget}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', margin: '0.35rem 0 0.25rem' }}>
            <div style={{ width: `${Math.min(100, carbsPercent)}%`, height: '100%', background: '#f59e0b', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isRTL ? 'طاقة ووقود التمرين' : 'Glycogen & stamina'}
          </span>
        </div>

        {/* Fats */}
        <div style={{
          padding: '0.85rem 0.8rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '14px',
          border: '1px solid rgba(236, 72, 153, 0.28)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>🥑</span> {isRTL ? 'دهون' : 'Fats'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{fatsPercent}%</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ec4899', fontVariantNumeric: 'tabular-nums' }}>
            {todayFats}<small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{dailyFatsTarget}g</small>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', margin: '0.35rem 0 0.25rem' }}>
            <div style={{ width: `${Math.min(100, fatsPercent)}%`, height: '100%', background: '#ec4899', borderRadius: '999px' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isRTL ? 'التوازن الهرموني' : 'Hormonal balance'}
          </span>
        </div>
      </div>

      {/* Footer Net Balance Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
      }}>
        <span>
          {isRTL ? 'صافي الطاقة' : 'Net Balance'}:{' '}
          <strong style={{ color: netBalance <= 0 ? '#10b981' : '#f59e0b' }}>
            {netBalance > 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()} kcal
          </strong>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>⚡</span>
          <span>
            {netBalance <= 0
              ? (isRTL ? 'عجز السعرات (حرق)' : 'Calorie Deficit (Cut)')
              : (isRTL ? 'فائض السعرات (بناء)' : 'Calorie Surplus (Building Zone)')}
          </span>
        </span>
      </div>
    </div>
  );
}
