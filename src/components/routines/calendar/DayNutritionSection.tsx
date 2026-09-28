import { Apple, Droplets, Utensils } from 'lucide-react';
import type { MealRecord } from '../../../lib/api';

export type DayNutritionSummary = {
  consumed: number;
  burned: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
};

type DayNutritionSectionProps = {
  meals: MealRecord[];
  summary: DayNutritionSummary;
  targets: { calories: number; protein: number; carbs: number; fats: number; water: number };
  isRTL: boolean;
  t: (key: any) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onLogMeal: () => void;
  showEmptyDetail: boolean;
};

function progress(value: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export function DayNutritionSection({
  meals,
  summary,
  targets,
  isRTL,
  t,
  formatDate,
  onLogMeal,
  showEmptyDetail
}: DayNutritionSectionProps) {
  const net = summary.consumed - summary.burned;
  const macros = [
    { key: 'protein', label: t('protein'), value: summary.protein, target: targets.protein, unit: 'g', color: 'var(--accent-cyan)' },
    { key: 'carbs', label: t('carbs'), value: summary.carbs, target: targets.carbs, unit: 'g', color: 'var(--accent-green)' },
    { key: 'fats', label: t('fats'), value: summary.fats, target: targets.fats, unit: 'g', color: 'var(--accent-yellow)' },
    {
      key: 'water',
      label: t('waterIntakeTitle'),
      value: summary.water / 1000,
      target: targets.water / 1000,
      unit: 'L',
      color: '#60a5fa'
    }
  ];

  return (
    <>
      <div className="day-nutrition-overview-card">
        <div className="day-nutrition-energy">
          <div className="day-nutrition-energy-head">
            <span>
              {t('caloriesIn')}: <strong>{Math.round(summary.consumed)}</strong> / {targets.calories} kcal
            </span>
            <span className={net >= 0 ? 'is-positive' : 'is-negative'}>
              {t('netBalance')}: {net > 0 ? '+' : ''}
              {Math.round(net)} kcal
            </span>
          </div>
          <div
            className="day-nutrition-bar"
            role="progressbar"
            aria-valuenow={progress(summary.consumed, targets.calories)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('caloriesIn')}
          >
            <span style={{ width: `${progress(summary.consumed, targets.calories)}%` }} />
          </div>
        </div>

        <div className="day-macro-grid">
          {macros.map(macro => (
            <div className="day-macro-item" key={macro.key}>
              <div className="day-macro-head">
                <span>
                  {macro.key === 'water' && <Droplets width={12} height={12} aria-hidden="true" />}
                  {macro.label}
                </span>
                <span className="tabular-nums" style={{ color: macro.color }}>
                  {macro.key === 'water'
                    ? `${macro.value.toFixed(1)}${macro.unit} / ${macro.target.toFixed(1)}${macro.unit}`
                    : `${Math.round(macro.value)}${macro.unit} / ${macro.target}${macro.unit}`}
                </span>
              </div>
              <div
                className="day-macro-bar"
                role="progressbar"
                aria-valuenow={progress(macro.value, macro.target)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={macro.label}
              >
                <span style={{ width: `${progress(macro.value, macro.target)}%`, background: macro.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {meals.length === 0 ? (
        showEmptyDetail ? (
          <div className="calendar-empty-card">
            <span className="calendar-empty-icon is-cyan" aria-hidden="true">
              <Apple width={24} height={24} />
            </span>
            <p className="calendar-empty-title">{t('noMealsLoggedThisDay')}</p>
            <p className="calendar-empty-body">
              {isRTL
                ? 'سجّل وجباتك عبر تصوير الأطباق بالذكاء الاصطناعي لتحليل السعرات والماكروز بدقة.'
                : 'Log meals with AI photo recognition for instant calorie and macro breakdown.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={onLogMeal}>
              <Utensils width={15} height={15} aria-hidden="true" />
              {t('logMealWithAI')}
            </button>
          </div>
        ) : null
      ) : (
        <ul className="calendar-meal-list">
          {meals.map(meal => (
            <li key={meal.id} className="day-meal-card">
              <span className="day-meal-thumb" aria-hidden="true">
                {meal.imageUrl ? (
                  <img src={meal.imageUrl} alt="" loading="lazy" />
                ) : (
                  <Utensils width={18} height={18} />
                )}
              </span>
              <div className="day-meal-body">
                <div className="day-meal-title-row">
                  <h4>{meal.title}</h4>
                  <span className="day-meal-badge">{t(meal.mealType)}</span>
                </div>
                <div className="day-meal-meta">
                  <span>{formatDate(new Date(meal.date), 'h:mm a')}</span>
                  <span aria-hidden="true">•</span>
                  <span className="is-cyan tabular-nums">{meal.calories} kcal</span>
                  {Boolean(meal.healthScore) && <span className="is-green tabular-nums">⭐ {meal.healthScore}/10</span>}
                </div>
                <div className="day-meal-macros">
                  <span data-kind="p">P: {meal.protein}g</span>
                  <span data-kind="c">C: {meal.carbs}g</span>
                  <span data-kind="f">F: {meal.fats}g</span>
                </div>
                {meal.description && <p className="day-meal-desc">{meal.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
