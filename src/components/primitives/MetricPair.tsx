import type { ReactNode } from 'react';
import { cn } from '../ui/cn';

export type MetricTone = 'default' | 'cyan' | 'emerald' | 'amber' | 'lime';

export interface MetricPairProps {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: MetricTone;
  className?: string;
}

const TONE_CLASS: Record<MetricTone, string> = {
  default: 'text-[var(--text-primary)]',
  cyan: 'text-[var(--accent-cyan)]',
  emerald: 'text-[var(--accent-emerald)]',
  amber: 'text-[var(--color-warning)]',
  lime: 'text-[var(--gym-lime,var(--accent-lime))]'
};

export function MetricPair({ label, value, unit, tone = 'default', className }: MetricPairProps) {
  return (
    <div className={cn('forma-metric-pair', `forma-metric-${tone}`, className)}>
      <span>{label}</span>
      <strong className={cn('tabular-nums', TONE_CLASS[tone])}>{value}</strong>
      {unit && <small>{unit}</small>}
    </div>
  );
}
