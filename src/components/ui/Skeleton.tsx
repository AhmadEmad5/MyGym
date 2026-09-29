import { cn } from './cn';

export type SkeletonVariant = 'text' | 'block' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** `1` renders a bare bar; more wraps them in a stacked group. */
  lines?: number;
  className?: string;
}

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
  text: 'ui-skeleton-text',
  block: 'ui-skeleton-block',
  circle: 'ui-skeleton-circle'
};

/**
 * Inline loading placeholder for cards, list rows and stat tiles. Decorative by
 * design (`aria-hidden`) so it never announces an untranslated string — the
 * caller owns the `role="status"` region and its translated label.
 */
export function Skeleton({ variant = 'text', lines = 1, className }: SkeletonProps) {
  const total = Math.max(0, Math.floor(lines));

  if (total <= 1) {
    return <span className={cn('ui-skeleton', VARIANT_CLASS[variant], className)} aria-hidden="true" />;
  }

  return (
    <div className={cn('ui-skeleton-group', className)} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('ui-skeleton', VARIANT_CLASS[variant])}
          style={index < total - 1 ? { width: `${88 - index * 9}%` } : undefined}
        />
      ))}
    </div>
  );
}
