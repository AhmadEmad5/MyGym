import { useEffect, useMemo, useState } from 'react';
import { Activity, Flame, Utensils, Wheat } from 'lucide-react';
import { adminCopy } from './copy';
import { formatDate, formatNumber, initialsOf, paginate } from './format';
import { AdminCard, AdminEmptyState, FilterPills, KpiCard, Pagination, PanelHeader } from './AdminPrimitives';
import type { AdminPlatformStats, AthleteSummary } from '../../lib/adminData';
import type { MealType } from '../../lib/api';
import type { PanelProps } from './types';

const MEAL_FILTERS: Array<'all' | MealType> = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

export function NutritionPanel({
  locale,
  isRTL,
  stats,
  athletes,
  searchQuery
}: PanelProps & {
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  searchQuery: string;
}) {
  const [mealFilter, setMealFilter] = useState<'all' | MealType>('all');
  const [page, setPage] = useState(1);
  const term = searchQuery.trim().toLowerCase();

  const meals = useMemo(() => {
    const rows: Array<{ id: string; athlete: AthleteSummary; meal: AthleteSummary['meals'][number] }> = [];
    for (const athlete of athletes) {
      for (const meal of athlete.meals) {
        if (term && !athlete.name.toLowerCase().includes(term) && !meal.title.toLowerCase().includes(term)) continue;
        if (mealFilter !== 'all' && meal.mealType !== mealFilter) continue;
        rows.push({ id: `${athlete.uid}-${meal.id}`, athlete, meal });
      }
    }
    return rows.sort((a, b) => new Date(b.meal.date).getTime() - new Date(a.meal.date).getTime());
  }, [athletes, mealFilter, term]);

  useEffect(() => {
    setPage(1);
  }, [mealFilter, term]);

  const { page: safePage, pageCount, slice } = paginate(meals, page, 12);

  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.nutritionEyebrow(locale)}
        title={adminCopy.nutritionTitle(locale)}
        subtitle={adminCopy.nutritionSubtitle(locale, meals.length)}
        icon={<Utensils size={13} aria-hidden="true" />}
      />

      <div className="admin-kpi-grid is-three">
        <KpiCard
          tone="cyan"
          label={adminCopy.totalProtein(locale)}
          value={formatNumber(stats?.macroTotals.protein ?? 0, locale)}
          unit="g"
          icon={<Wheat size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">P</span>}
        />
        <KpiCard
          tone="orange"
          label={adminCopy.totalCarbs(locale)}
          value={formatNumber(stats?.macroTotals.carbs ?? 0, locale)}
          unit="g"
          icon={<Activity size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">C</span>}
        />
        <KpiCard
          tone="purple"
          label={adminCopy.totalFats(locale)}
          value={formatNumber(stats?.macroTotals.fats ?? 0, locale)}
          unit="g"
          icon={<Flame size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">F</span>}
        />
      </div>

      <FilterPills
        ariaLabel={adminCopy.nutritionTitle(locale)}
        value={mealFilter}
        onChange={setMealFilter}
        options={MEAL_FILTERS.map((item) => ({ value: item, label: item }))}
      />

      <AdminCard>
        {meals.length === 0 ? (
          <AdminEmptyState
            icon={<Utensils size={26} aria-hidden="true" />}
            title={adminCopy.emptyMealsTitle(locale)}
            description={adminCopy.emptyMealsBody(locale)}
          />
        ) : (
          <ul className="admin-meal-grid">
            {slice.map(({ id, athlete, meal }) => (
              <li key={id} className="admin-meal-tile">
                <div className="admin-meal-tile-top">
                  <span className={`admin-meal-chip is-${meal.mealType}`}>{meal.mealType}</span>
                  <span className="admin-meal-kcal">
                    <Flame size={12} aria-hidden="true" />
                    {formatNumber(meal.calories, locale)}
                  </span>
                </div>
                <strong className="admin-meal-tile-title">{meal.title}</strong>
                <span className="admin-meal-macros">
                  <em>P {formatNumber(meal.protein, locale)}g</em>
                  <em>C {formatNumber(meal.carbs, locale)}g</em>
                  <em>F {formatNumber(meal.fats, locale)}g</em>
                </span>
                <span className="admin-meal-tile-foot">
                  <span className="admin-avatar is-xs" aria-hidden="true">
                    {initialsOf(athlete.name)}
                  </span>
                  {athlete.name}
                  <time dateTime={meal.date}>{formatDate(meal.date, locale)}</time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {meals.length > 0 && (
        <Pagination locale={locale} isRTL={isRTL} page={safePage} pageCount={pageCount} shown={slice.length} total={meals.length} onChange={setPage} />
      )}
    </div>
  );
}
