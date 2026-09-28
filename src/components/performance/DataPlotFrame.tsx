import { useMemo, useState } from 'react';
import type { PerformanceDataset } from '../../types/ui';
import { ChartFigure } from './ChartFigure';

interface DataPlotFrameProps {
  dataset: PerformanceDataset;
  emptyTitle: string;
  emptyDescription: string;
  pointsLabel?: string;
  dateLabel?: string;
  isRTL?: boolean;
}

const MAX_VISIBLE_POINTS = 14;

function formatAxisDate(value: string, isRTL: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(isRTL ? 'ar' : undefined, { day: 'numeric', month: 'short' });
}

function formatFullDate(value: string, isRTL: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(isRTL ? 'ar' : undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DataPlotFrame({
  dataset,
  emptyTitle,
  emptyDescription,
  pointsLabel = 'points',
  dateLabel = 'Date',
  isRTL
}: DataPlotFrameProps) {
  const [expanded, setExpanded] = useState(false);
  const points = dataset.points;

  const { max, average, min, latest, delta, first, last } = useMemo(() => {
    if (points.length === 0) {
      return { max: 0, average: 0, min: 0, latest: 0, delta: 0, first: 0, last: 0 };
    }
    const values = points.map(point => point.value);
    const sum = values.reduce((acc, value) => acc + value, 0);
    const trendDelta = values.length > 1 ? values[values.length - 1] - values[0] : 0;
    return {
      max: Math.max(...values, 1),
      average: sum / values.length,
      min: Math.min(...values),
      latest: values[values.length - 1],
      delta: trendDelta,
      first: values[0],
      last: values[values.length - 1]
    };
  }, [points]);

  const visiblePoints = expanded ? points : points.slice(-MAX_VISIBLE_POINTS);
  const summary = points.length === 0
    ? `${dataset.label}: no data recorded.`
    : `${dataset.label}: ${points.length} ${pointsLabel} from ${formatFullDate(points[0].date, !!isRTL)} to ${formatFullDate(points[points.length - 1].date, !!isRTL)}. `
      + `Latest ${latest} ${dataset.unit}, average ${Math.round(average * 10) / 10} ${dataset.unit}, `
      + `range ${min} to ${max} ${dataset.unit}. `
      + (points.length > 1
        ? `${delta === 0 ? 'No net change' : delta > 0 ? `Up ${Math.round(delta * 10) / 10}` : `Down ${Math.round(Math.abs(delta) * 10) / 10}`} ${dataset.unit} over the period.`
        : 'Only one reading available.');

  const table = (
    <table className="forma-data-table">
      <caption>{`${dataset.label} (${dataset.unit})`}</caption>
      <thead>
        <tr>
          <th scope="col">{dateLabel}</th>
          <th scope="col">{dataset.unit}</th>
        </tr>
      </thead>
      <tbody>
        {points.map(point => (
          <tr key={`row-${point.date}-${point.value}`}>
            <th scope="row">{formatFullDate(point.date, !!isRTL)}</th>
            <td>{point.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (dataset.isEmpty || points.length === 0) {
    return (
      <section className="forma-data-plot" aria-label={dataset.label}>
        <div className="forma-data-plot-header">
          <div>
            <span>{dataset.label}</span>
            <strong>{dataset.unit}</strong>
          </div>
        </div>
        <div className="forma-ledger-empty forma-plot-empty">
          <strong>{emptyTitle}</strong>
          <span>{emptyDescription}</span>
        </div>
      </section>
    );
  }

  return (
    <ChartFigure
      title={dataset.label}
      summary={summary}
      caption={`${dataset.label} · ${dataset.unit} · ${points.length} ${pointsLabel} · ${dateLabel}: ${formatFullDate(points[0].date, !!isRTL)} to ${formatFullDate(points[points.length - 1].date, !!isRTL)}`}
      table={table}
      isRTL={isRTL}
    >
      <div className="forma-data-plot">
        <div className="forma-data-plot-header">
          <div>
            <span>{dataset.label}</span>
            <strong>{dataset.unit}</strong>
          </div>
          <small>{points.length} {pointsLabel}</small>
        </div>
        <div
          className="forma-data-bars"
          role="img"
          aria-label={summary}
        >
          {visiblePoints.map(point => (
            <div
              className="forma-data-bar-group"
              key={`bar-${point.date}-${point.value}`}
              title={`${formatFullDate(point.date, !!isRTL)}: ${point.value} ${dataset.unit}`}
            >
              <span
                className="forma-data-bar"
                style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
              />
              <small aria-hidden="true">{formatAxisDate(point.date, !!isRTL)}</small>
            </div>
          ))}
        </div>
        {points.length > MAX_VISIBLE_POINTS && (
          <button
            type="button"
            className="forma-figure-toggle"
            aria-expanded={expanded}
            style={{ marginBlockStart: '0.6rem' }}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded
              ? (isRTL ? `إظهار ${MAX_VISIBLE_POINTS} الأخيرة فقط` : `Show last ${MAX_VISIBLE_POINTS} only`)
              : (isRTL ? `عرض كل النقاط (${points.length})` : `Show all ${points.length} points`)}
          </button>
        )}
        <dl className="forma-sr-only">
          <dt>{isRTL ? 'البداية' : 'First'}</dt>
          <dd>{`${first} ${dataset.unit}`}</dd>
          <dt>{isRTL ? 'الأحدث' : 'Latest'}</dt>
          <dd>{`${last} ${dataset.unit}`}</dd>
        </dl>
      </div>
    </ChartFigure>
  );
}
