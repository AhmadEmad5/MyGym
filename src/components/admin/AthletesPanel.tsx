import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Download, Dumbbell, Flame, Layers, Users } from 'lucide-react';
import { adminCopy } from './copy';
import { daysSince, formatNumber, initialsOf, paginate, searchAthletes, filterAthletes, sortByKey } from './format';
import {
  ActivityStatus,
  AdminEmptyState,
  FilterPills,
  Pagination,
  PanelHeader,
  SortableHeader,
  StatInline,
  TierBadge
} from './AdminPrimitives';
import type { AthleteSummary } from '../../lib/adminData';
import type { AthleteFilter, AthleteSort, PanelProps } from './types';

type AthletesPanelProps = PanelProps & {
  athletes: AthleteSummary[];
  totalCount: number;
  searchQuery: string;
  onClearSearch: () => void;
  onSelectAthlete: (athlete: AthleteSummary) => void;
  onExport: () => void;
};

const SORT_LABELS: Record<AthleteSort, (locale: 'ar' | 'en') => string> = {
  name: adminCopy.sortName,
  workouts: adminCopy.sortWorkouts,
  tonnage: adminCopy.sortTonnage,
  calories: adminCopy.sortCalories,
  recent: adminCopy.sortRecent
};

export function AthletesPanel({
  locale,
  isRTL,
  athletes,
  totalCount,
  searchQuery,
  onClearSearch,
  onSelectAthlete,
  onExport
}: AthletesPanelProps) {
  const [filter, setFilter] = useState<AthleteFilter>('all');
  const [sort, setSort] = useState<AthleteSort>('workouts');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visible = useMemo(() => {
    const searched = searchAthletes(athletes, searchQuery);
    const filtered = filterAthletes(searched, filter);
    return [...filtered].sort((a, b) => sortByKey(a, b, sort));
  }, [athletes, filter, searchQuery, sort]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, sort, pageSize]);

  const { page: safePage, pageCount, slice } = paginate(visible, page, pageSize);

  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.rosterEyebrow(locale)}
        title={adminCopy.rosterTitle(locale)}
        subtitle={adminCopy.rosterSubtitle(locale, slice.length, totalCount)}
        icon={<Users size={13} aria-hidden="true" />}
        action={
          <button type="button" className="admin-action-btn" onClick={onExport}>
            <Download size={14} aria-hidden="true" />
            {adminCopy.exportCsv(locale)}
          </button>
        }
      />

      <div className="admin-toolbar">
        <FilterPills
          ariaLabel={adminCopy.rosterTitle(locale)}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: adminCopy.filterAll(locale), count: athletes.length },
            { value: 'active', label: adminCopy.filterActive(locale) },
            { value: 'elite', label: adminCopy.filterElite(locale) },
            { value: 'rookie', label: adminCopy.filterRookie(locale) }
          ]}
        />

        <div className="admin-toolbar-end">
          <label className="admin-size-select">
            <span>{adminCopy.pageSize(locale)}</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </label>
          <span className="admin-sort-hint">
            <ArrowUpDown size={13} aria-hidden="true" />
            {adminCopy.sortBy(locale)}: {SORT_LABELS[sort](locale)}
          </span>
        </div>
      </div>

      <div className="admin-table-wrap">
        {visible.length === 0 ? (
          <AdminEmptyState
            icon={<Users size={26} aria-hidden="true" />}
            title={adminCopy.emptyRosterTitle(locale)}
            description={adminCopy.emptyRosterBody(locale)}
            action={
              searchQuery ? (
                <button type="button" className="admin-action-btn" onClick={onClearSearch}>
                  {adminCopy.clearSearch(locale)}
                </button>
              ) : undefined
            }
          />
        ) : (
          <table className="admin-table">
            <caption className="sr-only">{adminCopy.rosterTitle(locale)}</caption>
            <thead>
              <tr>
                <SortableHeader locale={locale} label={adminCopy.colAthlete(locale)} column="name" active={sort} onSort={setSort} />
                <th scope="col">{adminCopy.colTier(locale)}</th>
                <SortableHeader locale={locale} label={adminCopy.colWorkouts(locale)} column="workouts" active={sort} onSort={setSort} />
                <SortableHeader locale={locale} label={adminCopy.colTonnage(locale)} column="tonnage" active={sort} onSort={setSort} />
                <SortableHeader locale={locale} label={adminCopy.colCalories(locale)} column="calories" active={sort} onSort={setSort} />
                <SortableHeader locale={locale} label={adminCopy.colLastActive(locale)} column="recent" active={sort} onSort={setSort} />
                <th scope="col" className="admin-col-action">
                  {adminCopy.colActions(locale)}
                </th>
              </tr>
            </thead>
            <tbody>
              {slice.map((athlete) => (
                <tr key={athlete.uid}>
                  <th scope="row" className="admin-cell-user">
                    <button type="button" className="admin-user-btn" onClick={() => onSelectAthlete(athlete)}>
                      <span className="admin-avatar" aria-hidden="true">
                        {athlete.pfp ? <img src={athlete.pfp} alt="" /> : initialsOf(athlete.name)}
                      </span>
                      <span className="admin-user-text">
                        <strong>{athlete.name}</strong>
                        <span className="admin-user-mail">{athlete.email}</span>
                      </span>
                    </button>
                  </th>
                  <td>
                    <TierBadge tier={athlete.tier} locale={locale} />
                  </td>
                  <td>
                    <StatInline icon={<Dumbbell size={12} aria-hidden="true" />} value={formatNumber(athlete.totalWorkouts, locale)} />
                  </td>
                  <td>
                    <StatInline
                      icon={<Layers size={12} aria-hidden="true" />}
                      value={formatNumber(athlete.totalTonnage, locale)}
                      unit={athlete.weightUnit}
                    />
                  </td>
                  <td>
                    <StatInline icon={<Flame size={12} aria-hidden="true" />} value={formatNumber(athlete.totalCaloriesBurned, locale)} unit="kcal" />
                  </td>
                  <td>
                    <ActivityStatus days={daysSince(athlete.lastActive)} isRTL={isRTL} neverLabel={adminCopy.never(locale)} />
                  </td>
                  <td className="admin-col-action">
                    <button type="button" className="admin-row-action" onClick={() => onSelectAthlete(athlete)}>
                      {adminCopy.openDossier(locale)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {visible.length > 0 && (
        <Pagination
          locale={locale}
          isRTL={isRTL}
          page={safePage}
          pageCount={pageCount}
          shown={slice.length}
          total={visible.length}
          onChange={setPage}
        />
      )}
    </div>
  );
}
