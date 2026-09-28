import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'emerald' | 'cyan' | 'lime' | 'amber' | 'purple' | 'rose' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  emerald: 'ui-badge-emerald',
  cyan: 'ui-badge-cyan',
  lime: 'ui-badge-lime',
  amber: 'ui-badge-amber',
  purple: 'ui-badge-purple',
  rose: 'ui-badge-rose',
  neutral: 'ui-badge-neutral'
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'text-[0.7rem] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1'
};

export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn('ui-badge', TONE_CLASS[tone], SIZE_CLASS[size], className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'currentColor' }} aria-hidden="true" />}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </span>
  );
}
