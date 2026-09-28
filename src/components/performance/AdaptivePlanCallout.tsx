import type { WeeklyAdaptivePlan } from '../../lib/api';

interface AdaptivePlanCalloutProps {
  plan?: WeeklyAdaptivePlan;
  emptyLabel: string;
  title?: string;
  labels?: { recovery: string; adjustment: string; volume: string; updated: string };
  isRTL?: boolean;
}

const DEFAULT_LABELS = { recovery: 'Recovery', adjustment: 'Adjustment', volume: 'Volume', updated: 'Updated' };

function formatUpdated(value: string, isRTL: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(isRTL ? 'ar' : undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function AdaptivePlanCallout({
  plan,
  emptyLabel,
  title = 'Adaptive weekly plan',
  labels,
  isRTL
}: AdaptivePlanCalloutProps) {
  const chainLabels = labels || DEFAULT_LABELS;

  if (!plan) {
    return (
      <section className="forma-adaptive-callout is-empty" aria-label={title}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{title}</strong>
        <span role="status">{emptyLabel}</span>
      </section>
    );
  }

  const volumeLabel = `${plan.volumeChangePercent > 0 ? '+' : ''}${plan.volumeChangePercent}%`;
  const summary = `${chainLabels.recovery} ${plan.recoveryScore}%. `
    + `${chainLabels.adjustment} ${plan.adjustment}. `
    + `${chainLabels.volume} ${volumeLabel}. `
    + (isRTL ? `تم التحديث ${formatUpdated(plan.updatedAt, true)}` : `Updated ${formatUpdated(plan.updatedAt, false)}`);

  return (
    <section className="forma-adaptive-callout" aria-label={title}>
      <h3 className="forma-sr-only">{title}</h3>
      <div className="forma-adaptive-chain" role="group" aria-label={summary}>
        <span>
          <small>{chainLabels.recovery}</small>
          <strong className="tabular-nums">{plan.recoveryScore}%</strong>
        </span>
        <i aria-hidden="true">→</i>
        <span>
          <small>{chainLabels.adjustment}</small>
          <strong>{plan.adjustment}</strong>
        </span>
        <i aria-hidden="true">→</i>
        <span>
          <small>{chainLabels.volume}</small>
          <strong className="tabular-nums">{volumeLabel}</strong>
        </span>
      </div>
      <p>{plan.recommendation}</p>
      <small className="forma-adaptive-updated">
        {chainLabels.updated} {formatUpdated(plan.updatedAt, !!isRTL)}
      </small>
    </section>
  );
}
