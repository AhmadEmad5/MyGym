import { useMemo } from 'react';
import { Activity, Dumbbell, Flame, Gauge, Layers, TrendingUp, Trophy, Users, Utensils, Clock3 } from 'lucide-react';
import { adminCopy } from './copy';
import { formatCompact, formatDateTime, formatNumber, initialsOf } from './format';
import { AdminCard, AdminEmptyState, KpiCard, PanelHeader, StatInline } from './AdminPrimitives';
import type { AdminPlatformStats, AthleteSummary } from '../../lib/adminData';
import type { PanelProps } from './types';

type OverviewProps = PanelProps & {
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  onSelectAthlete: (athlete: AthleteSummary) => void;
  onOpenAthletes: () => void;
  onOpenWorkouts: () => void;
};

export function OverviewPanel({ locale, isRTL, stats, athletes, onSelectAthlete, onOpenAthletes, onOpenWorkouts }: OverviewProps) {
  const activity = useMemo(() => (stats?.recentActivity ?? []).slice(0, 8), [stats]);
  const prs = useMemo(() => (stats?.globalPRs ?? []).slice(0, 6), [stats]);

  const findAthlete = (name: string) => athletes.find((athlete) => athlete.name === name);

  const discipline = stats?.categoryBreakdown;
  const maxDiscipline = Math.max(1, discipline ? discipline.strength + discipline.hypertrophy + discipline.cardio + discipline.bodyweight : 1);

  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.overviewEyebrow(locale)}
        title={adminCopy.overviewTitle(locale)}
        subtitle={adminCopy.overviewSubtitle(locale)}
        icon={<Activity size={13} aria-hidden="true" />}
      />

      <div className="admin-kpi-grid">
        <KpiCard
          tone="cyan"
          label={adminCopy.totalAthletes(locale)}
          value={formatNumber(stats?.totalAthletes ?? athletes.length, locale)}
          icon={<Users size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{adminCopy.activeRecently(locale)} · {formatNumber(stats?.activeAthletes30d ?? 0, locale)}</span>}
        />
        <KpiCard
          tone="lime"
          label={adminCopy.workoutsLogged(locale)}
          value={formatNumber(stats?.totalWorkoutsCompleted ?? 0, locale)}
          icon={<Dumbbell size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{formatNumber(stats?.totalSessionsPlanned ?? 0, locale)} {adminCopy.plannedSessions(locale)}</span>}
        />
        <KpiCard
          tone="blue"
          label={adminCopy.volumeMoved(locale)}
          value={formatCompact(stats?.totalTonnage ?? 0, locale)}
          unit="kg"
          icon={<Layers size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{adminCopy.aggregateTonnage(locale)}</span>}
        />
        <KpiCard
          tone="orange"
          label={adminCopy.energyBurned(locale)}
          value={formatCompact(stats?.totalCaloriesBurned ?? 0, locale)}
          unit="kcal"
          icon={<Flame size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{adminCopy.calorieExpenditure(locale)}</span>}
        />
        <KpiCard
          tone="yellow"
          label={adminCopy.avgDuration(locale)}
          value={formatNumber(stats?.avgWorkoutDuration ?? 0, locale)}
          unit="min"
          icon={<Clock3 size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{adminCopy.standardLength(locale)}</span>}
        />
        <KpiCard
          tone="purple"
          label={adminCopy.nutritionEntries(locale)}
          value={formatNumber(stats?.totalMealsLogged ?? 0, locale)}
          icon={<Utensils size={18} aria-hidden="true" />}
          footer={<span className="admin-kpi-note">{adminCopy.dietLogs(locale)}</span>}
        />
      </div>

      <div className="admin-split">
        <AdminCard
          title={adminCopy.liveStream(locale)}
          icon={<Activity size={16} aria-hidden="true" />}
          action={
            <button type="button" className="admin-link-btn" onClick={onOpenWorkouts}>
              {adminCopy.openLogbook(locale)}
            </button>
          }
        >
          {activity.length === 0 ? (
            <AdminEmptyState
              icon={<Dumbbell size={26} aria-hidden="true" />}
              title={adminCopy.liveStream(locale)}
              description={adminCopy.noActivity(locale)}
            />
          ) : (
            <ul className="admin-stream">
              {activity.map((item) => {
                const athlete = findAthlete(item.athleteName);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="admin-stream-row"
                      onClick={() => athlete && onSelectAthlete(athlete)}
                      disabled={!athlete}
                    >
                      <span className="admin-avatar" aria-hidden="true">
                        {initialsOf(item.athleteName)}
                      </span>
                      <span className="admin-stream-body">
                        <span className="admin-stream-top">
                          <strong>{item.athleteName}</strong>
                          <time dateTime={item.date}>{formatDateTime(item.date, locale)}</time>
                        </span>
                        <span className="admin-stream-title">{item.title}</span>
                        <span className="admin-stream-meta">
                          {item.duration ? <StatInline icon={<Clock3 size={12} aria-hidden="true" />} value={String(item.duration)} unit="min" /> : null}
                          <StatInline icon={<Dumbbell size={12} aria-hidden="true" />} value={String(item.exerciseCount)} />
                          {item.tonnage > 0 ? <StatInline icon={<Layers size={12} aria-hidden="true" />} value={formatNumber(item.tonnage, locale)} unit="kg" /> : null}
                          {item.burnedCalories ? <StatInline icon={<Flame size={12} aria-hidden="true" />} value={formatNumber(item.burnedCalories, locale)} unit="kcal" /> : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <AdminCard
          title={adminCopy.platformRecords(locale)}
          icon={<Trophy size={16} aria-hidden="true" />}
          action={
            <button type="button" className="admin-link-btn" onClick={onOpenAthletes}>
              {adminCopy.allAthletes(locale)}
            </button>
          }
        >
          {prs.length === 0 ? (
            <AdminEmptyState
              icon={<Trophy size={26} aria-hidden="true" />}
              title={adminCopy.platformRecords(locale)}
              description={adminCopy.noPrs(locale)}
            />
          ) : (
            <ol className="admin-pr-list">
              {prs.map((pr, index) => {
                const athlete = findAthlete(pr.athleteName);
                return (
                  <li key={`${pr.exerciseName}-${index}`}>
                    <button type="button" className="admin-pr-row" onClick={() => athlete && onSelectAthlete(athlete)} disabled={!athlete}>
                      <span className="admin-pr-rank" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="admin-pr-info">
                        <strong>{pr.exerciseName}</strong>
                        <span>{pr.athleteName}</span>
                      </span>
                      <span className="admin-pr-weight">
                        <strong>{formatNumber(pr.weight, locale, 1)}</strong>
                        <small>{pr.unit}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="admin-discipline">
            <h4 className="admin-subheading">
              <Gauge size={14} aria-hidden="true" />
              {adminCopy.discipline(locale)}
            </h4>
            <ul className="admin-bars">
              {[
                { label: adminCopy.strength(locale), value: discipline?.strength ?? 0, modifier: 'cyan' },
                { label: adminCopy.hypertrophy(locale), value: discipline?.hypertrophy ?? 0, modifier: 'lime' },
                { label: adminCopy.cardio(locale), value: discipline?.cardio ?? 0, modifier: 'orange' },
                { label: adminCopy.bodyweight(locale), value: discipline?.bodyweight ?? 0, modifier: 'purple' }
              ].map((row) => (
                <li key={row.label} className={`admin-bar is-${row.modifier}`}>
                  <span className="admin-bar-label">{row.label}</span>
                  <span className="admin-bar-track" aria-hidden="true">
                    <span className="admin-bar-fill" style={{ inlineSize: `${Math.round((row.value / maxDiscipline) * 100)}%` }} />
                  </span>
                  <span className="admin-bar-value">{formatNumber(row.value, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </AdminCard>
      </div>

      <p className="admin-footnote">
        <TrendingUp size={13} aria-hidden="true" />
        {isRTL ? 'جميع الأرقام محسوبة من سجلات الرياضيين الفعلية.' : 'Every figure is computed from real athlete records.'}
      </p>
    </div>
  );
}
