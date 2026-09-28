import { useId, useMemo } from 'react';
import { Search, X } from 'lucide-react';

export type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite Pro';

export type RoutineFilters = {
  query: string;
  category: string;
  difficulty: DifficultyFilter;
  days: number | 'all';
};

export const EMPTY_ROUTINE_FILTERS: RoutineFilters = {
  query: '',
  category: 'all',
  difficulty: 'all',
  days: 'all'
};

export function filtersAreActive(filters: RoutineFilters) {
  return (
    filters.query.trim().length > 0 ||
    filters.category !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.days !== 'all'
  );
}

type RoutineFilterBarProps = {
  filters: RoutineFilters;
  onChange: (next: RoutineFilters) => void;
  categories: string[];
  resultCount: number;
  totalCount: number;
  isRTL: boolean;
};

const DIFFICULTIES: DifficultyFilter[] = ['all', 'Beginner', 'Intermediate', 'Advanced', 'Elite Pro'];

export function RoutineFilterBar({
  filters,
  onChange,
  categories,
  resultCount,
  totalCount,
  isRTL
}: RoutineFilterBarProps) {
  const searchId = useId();
  const categoryId = useId();
  const difficultyId = useId();
  const daysId = useId();

  const active = useMemo(() => filtersAreActive(filters), [filters]);

  const set = (patch: Partial<RoutineFilters>) => onChange({ ...filters, ...patch });

  return (
    <section className="routine-filter-bar" aria-label={isRTL ? 'تصفية مكتبة البرامج' : 'Program library filters'}>
      <div className="routine-filter-search">
        <Search width={16} height={16} aria-hidden="true" />
        <input
          id={searchId}
          type="search"
          className="routine-filter-input"
          value={filters.query}
          placeholder={isRTL ? 'ابحث في البرامج والعضلات…' : 'Search programs, muscles, exercises…'}
          aria-label={isRTL ? 'بحث في البرامج' : 'Search programs'}
          aria-describedby={`${searchId}-hint`}
          onChange={event => set({ query: event.target.value })}
        />
      </div>

      <div className="routine-filter-selects">
        <label className="routine-filter-field" htmlFor={categoryId}>
          <span>{isRTL ? 'الفئة' : 'Category'}</span>
          <select
            id={categoryId}
            value={filters.category}
            onChange={event => set({ category: event.target.value })}
          >
            <option value="all">{isRTL ? 'الكل' : 'All'}</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="routine-filter-field" htmlFor={difficultyId}>
          <span>{isRTL ? 'المستوى' : 'Difficulty'}</span>
          <select
            id={difficultyId}
            value={filters.difficulty}
            onChange={event => set({ difficulty: event.target.value as DifficultyFilter })}
          >
            {DIFFICULTIES.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? (isRTL ? 'الكل' : 'All') : level}
              </option>
            ))}
          </select>
        </label>

        <label className="routine-filter-field" htmlFor={daysId}>
          <span>{isRTL ? 'أيام/أسبوع' : 'Days / week'}</span>
          <select
            id={daysId}
            value={filters.days === 'all' ? 'all' : String(filters.days)}
            onChange={event =>
              set({ days: event.target.value === 'all' ? 'all' : Number(event.target.value) })
            }
          >
            <option value="all">{isRTL ? 'الكل' : 'All'}</option>
            {[2, 3, 4, 5, 6].map(days => (
              <option key={days} value={days}>
                {days}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="routine-filter-meta">
        <span className="routine-filter-count tabular-nums" aria-live="polite">
          {isRTL ? `${resultCount} من ${totalCount}` : `${resultCount} of ${totalCount}`}
        </span>
        {active && (
          <button
            type="button"
            className="routine-filter-clear"
            onClick={() => onChange(EMPTY_ROUTINE_FILTERS)}
          >
            <X width={14} height={14} aria-hidden="true" />
            <span>{isRTL ? 'مسح' : 'Clear'}</span>
          </button>
        )}
      </div>

      <p className="sr-only" id={`${searchId}-hint`}>
        {isRTL
          ? 'استخدم حقل البحث لتضييق قائمة البرامج.'
          : 'Use the search field to narrow the program list.'}
      </p>
    </section>
  );
}
