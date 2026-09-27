import type { ReactNode } from 'react';

interface MetricPairProps {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: 'default' | 'cyan' | 'emerald' | 'amber' | 'lime';
  className?: string;
}

export function MetricPair({ label, value, unit, tone = 'default', className = '' }: MetricPairProps) {
  return (
    <div className={`forma-metric-pair forma-metric-${tone} ${className}`.trim()}>
      <span>{label}</span>
      <strong className="tabular-nums">{value}</strong>
      {unit && <small>{unit}</small>}
    </div>
  );
}
