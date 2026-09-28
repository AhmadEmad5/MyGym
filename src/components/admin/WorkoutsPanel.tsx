import { useEffect, useMemo, useState } from 'react';
import { Clock3, Dumbbell, Flame, Layers } from 'lucide-react';
import { adminCopy } from './copy';
import { formatDate, formatDateTime, formatNumber, initialsOf, paginate } from './format';
import { AdminCard, AdminEmptyState, FilterPills, Pagination, PanelHeader, StatInline } from './AdminPrimitives';
import type { AthleteSummary } from '../../lib/adminData';
import type { PanelProps } from './types';

const DISCIPLINES = ['all', 'strength', 'hypertrophy', 'cardio', 'bodyweight'] as const;
type Discipline = (typeof DISCIPLINES)[number];

export function WorkoutsPanel({
  locale,
  isRTL,
  athletes,
  searchQuery,
  onSelectAthlete
}: PanelProps & {
  athletes: AthleteSummary[];
  searchQuery: string;
  onSelectAthlete: (athlete: AthleteSummary) => void;
}) {
  const [discipline, setDiscipline] = useState<Discipline>('all');
  const [page, setPage] = useState(1);

  const term = searchQuery.trim().toLowerCase();

  const sessions = useMemo(() => {
    const rows: Array<{ id: string; athlete: AthleteSummary; workout: AthleteSummary['history'][number] }> = [];
    for (const athlete of athletes) {
      for (const workout of athlete.history) {
        if (term && !athlete.name.toLowerCase().includes(term) && !workout.title.toLowerCase().includes(term)) continue;
        const type = (workout.snapshot?.type || 'strength').toLowerCase();
        if (discipline !== 'all' && !type.includes(discipline)) continue;
        rows.push({ id: `${athlete.uid}-${workout.id}`, athlete, workout });
      }
    }
    return rows.sort((a, b) => new Date(b.workout.date).getTime() - new Date(a.workout.date).getTime());
  }, [athletes, discipline, term]);

  useEffect(() => {
    setPage(1);
  }, [discipline, term]);

  const { page: safePage, pageCount, slice } = paginate(sessions, page, 10);

  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.workoutsEyebrow(locale)}
        title={adminCopy.workoutsTitle(locale)}
        subtitle={adminCopy.workoutsSubtitle(locale, sessions.length)}
        icon={<Dumbbell size={13} aria-hidden="true" />}
      />

      <FilterPills
        ariaLabel={adminCopy.workoutsTitle(locale)}
        value={discipline}
        onChange={setDiscipline}
        options={DISCIPLINES.map((item) => ({ value: item, label: item }))}
      />

      <AdminCard>
        {sessions.length === 0 ? (
          <AdminEmptyState
            icon={<Dumbbell size={26} aria-hidden="true" />}
            title={adminCopy.emptyWorkoutsTitle(locale)}
            description={adminCopy.emptyWorkoutsBody(locale)}
          />
        ) : (
          <ul className="admin-workout-list">
            {slice.map(({ id, athlete, workout }) => (
              <li key={id}>
                <button type="button" className="admin-workout-row" onClick={() => onSelectAthlete(athlete)}>
                  <span className="admin-avatar" aria-hidden="true">
                    {initialsOf(athlete.name)}
                  </span>
                  <span className="admin-workout-body">
                    <span className="admin-workout-top">
                      <strong>{workout.title || adminCopy.sessionFallback(locale)}</strong>
                      <time dateTime={workout.date}>{formatDateTime(workout.date, locale)}</time>
                    </span>
                    <span className="admin-workout-athlete">
                      {athlete.name} · {formatDate(workout.date, locale)}
                    </span>
                    <span className="admin-stream-meta">
                      {workout.snapshot?.duration ? <StatInline icon={<Clock3 size={12} aria-hidden="true" />} value={String(workout.snapshot.duration)} unit="min" /> : null}
                      {workout.burnedCalories ? <StatInline icon={<Flame size={12} aria-hidden="true" />} value={formatNumber(workout.burnedCalories, locale)} unit="kcal" /> : null}
                      <StatInline icon={<Dumbbell size={12} aria-hidden="true" />} value={String(workout.snapshot?.exercises?.length ?? 0)} />
                      {workout.snapshot?.type ? <span className="admin-chip">{workout.snapshot.type}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {sessions.length > 0 && (
        <Pagination locale={locale} isRTL={isRTL} page={safePage} pageCount={pageCount} shown={slice.length} total={sessions.length} onChange={setPage} />
      )}

      <p className="admin-footnote">
        <Layers size={13} aria-hidden="true" />
        {locale === 'ar' ? 'يتم ترتيب الجولات من الأحدث إلى الأقدم.' : 'Sessions are ordered newest first.'}
      </p>
    </div>
  );
}
