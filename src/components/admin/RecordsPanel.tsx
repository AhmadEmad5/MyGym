import { Trophy, UserSearch } from 'lucide-react';
import { adminCopy } from './copy';
import { formatDate, formatNumber, initialsOf } from './format';
import { AdminEmptyState, PanelHeader, StatInline } from './AdminPrimitives';
import type { AdminPlatformStats, AthleteSummary } from '../../lib/adminData';
import type { PanelProps } from './types';

export function RecordsPanel({
  locale,
  stats,
  athletes,
  onSelectAthlete
}: PanelProps & {
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  onSelectAthlete: (athlete: AthleteSummary) => void;
}) {
  const prs = stats?.globalPRs ?? [];
  const rows = prs;

  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.recordsEyebrow(locale)}
        title={adminCopy.recordsTitle(locale)}
        subtitle={adminCopy.recordsSubtitle(locale)}
        icon={<Trophy size={13} aria-hidden="true" />}
      />

      <div className="admin-table-wrap">
        {rows.length === 0 ? (
          <AdminEmptyState
            icon={<Trophy size={26} aria-hidden="true" />}
            title={adminCopy.emptyRecordsTitle(locale)}
            description={adminCopy.emptyRecordsBody(locale)}
          />
        ) : (
          <table className="admin-table">
            <caption className="sr-only">{adminCopy.recordsTitle(locale)}</caption>
            <thead>
              <tr>
                <th scope="col">{adminCopy.colRank(locale)}</th>
                <th scope="col">{adminCopy.colExercise(locale)}</th>
                <th scope="col">{adminCopy.colHeaviest(locale)}</th>
                <th scope="col">{adminCopy.colHolder(locale)}</th>
                <th scope="col">{adminCopy.colDate(locale)}</th>
                <th scope="col" className="admin-col-action">
                  {adminCopy.colActions(locale)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((pr, index) => {
                const athlete = athletes.find((item) => item.email === pr.athleteEmail);
                return (
                  <tr key={`${pr.exerciseName}-${index}`}>
                    <th scope="row" className="admin-cell-rank">
                      <span className="admin-rank-chip">{index + 1}</span>
                    </th>
                    <td>
                      <strong>{pr.exerciseName}</strong>
                    </td>
                    <td>
                      <StatInline value={formatNumber(pr.weight, locale, 1)} unit={pr.unit} />
                    </td>
                    <td>
                      <span className="admin-user-inline">
                        <span className="admin-avatar is-xs" aria-hidden="true">
                          {initialsOf(pr.athleteName)}
                        </span>
                        {pr.athleteName}
                      </span>
                    </td>
                    <td>
                      <time dateTime={pr.date}>{formatDate(pr.date, locale)}</time>
                    </td>
                    <td className="admin-col-action">
                      {athlete ? (
                        <button type="button" className="admin-row-action touch-target" onClick={() => onSelectAthlete(athlete)}>
                          {adminCopy.openDossier(locale)}
                        </button>
                      ) : (
                        <span className="admin-muted">
                          <UserSearch size={13} aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
