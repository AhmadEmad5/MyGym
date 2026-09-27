import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'emerald' | 'cyan' | 'lime' | 'amber' | 'purple' | 'rose' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const toneClass = {
    emerald: 'ui-badge-emerald',
    cyan: 'ui-badge-cyan',
    lime: 'ui-badge-lime',
    amber: 'ui-badge-amber',
    purple: 'ui-badge-purple',
    rose: 'ui-badge-rose',
    neutral: 'ui-badge-neutral'
  }[tone];

  const sizeClass = size === 'sm' ? 'text-[0.7rem] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`ui-badge ${toneClass} ${sizeClass} ${className}`.trim()} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
