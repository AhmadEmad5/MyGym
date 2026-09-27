import type { PerformanceDataset } from '../../types/ui';

interface DataPlotFrameProps {
  dataset: PerformanceDataset;
  emptyTitle: string;
  emptyDescription: string;
  pointsLabel?: string;
}

export function DataPlotFrame({ dataset, emptyTitle, emptyDescription, pointsLabel = 'points' }: DataPlotFrameProps) {
  const values = dataset.points.map((point) => point.value);
  const max = Math.max(...values, 1);

  return (
    <section className="forma-data-plot" aria-label={dataset.label}>
      <div className="forma-data-plot-header">
        <div><span>{dataset.label}</span><strong>{dataset.unit}</strong></div>
        {dataset.points.length > 0 && <small>{dataset.points.length} {pointsLabel}</small>}
      </div>
      {dataset.isEmpty ? (
        <div className="forma-ledger-empty forma-plot-empty"><strong>{emptyTitle}</strong><span>{emptyDescription}</span></div>
      ) : (
        <div className="forma-data-bars" role="img" aria-label={`${dataset.label}: ${dataset.points.length} data points`}>
          {dataset.points.slice(-14).map((point) => (
            <div className="forma-data-bar-group" key={`${point.date}-${point.value}`} title={`${point.date}: ${point.value} ${dataset.unit}`}>
              <span className="forma-data-bar" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />
              <small>{new Date(point.date).toLocaleDateString(undefined, { day: 'numeric' })}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
