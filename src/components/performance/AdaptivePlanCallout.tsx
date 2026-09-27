import type { WeeklyAdaptivePlan } from '../../lib/api';

interface AdaptivePlanCalloutProps {
  plan?: WeeklyAdaptivePlan;
  emptyLabel: string;
  labels?: { recovery: string; adjustment: string; volume: string; updated: string };
}

export function AdaptivePlanCallout({ plan, emptyLabel, labels }: AdaptivePlanCalloutProps) {
  const chainLabels = labels || { recovery: 'Recovery', adjustment: 'Adjustment', volume: 'Volume', updated: 'Updated' };
  if (!plan) {
    return <div className="forma-adaptive-callout is-empty">{emptyLabel}</div>;
  }

  return (
    <section className="forma-adaptive-callout">
      <div className="forma-adaptive-chain">
        <span><small>{chainLabels.recovery}</small><strong className="tabular-nums">{plan.recoveryScore}%</strong></span>
        <i aria-hidden="true">→</i>
        <span><small>{chainLabels.adjustment}</small><strong>{plan.adjustment}</strong></span>
        <i aria-hidden="true">→</i>
        <span><small>{chainLabels.volume}</small><strong className="tabular-nums">{plan.volumeChangePercent > 0 ? '+' : ''}{plan.volumeChangePercent}%</strong></span>
      </div>
      <p>{plan.recommendation}</p>
      <small className="forma-adaptive-updated">{chainLabels.updated} {new Date(plan.updatedAt).toLocaleDateString()}</small>
    </section>
  );
}
