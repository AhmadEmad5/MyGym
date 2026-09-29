import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

export type BadgeTone = 'emerald' | 'cyan' | 'lime' | 'amber' | 'purple' | 'rose' | 'neutral';
export type BadgeSize = 'sm' | 'md';

/**
 * `BadgeProps` deliberately stays a plain `HTMLAttributes<HTMLSpanElement>`
 * surface. framer-motion re-declares `onDrag*` as pan gestures, which is not
 * structurally compatible with the DOM handlers, so the passthrough is widened
 * once here rather than changing what every existing caller may pass.
 */
type BadgeMotionProps = Omit<HTMLMotionProps<'span'>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'>;

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
  const reduced = useReducedMotion();

  return (
    <motion.span
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduced
          ? { duration: MOTION_DURATION.instant }
          : { duration: MOTION_DURATION.quick, ease: MOTION_EASE.emphasized }
      }
      className={cn('ui-badge', TONE_CLASS[tone], SIZE_CLASS[size], className)}
      {...(props as unknown as BadgeMotionProps)}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'currentColor' }} aria-hidden="true" />}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </motion.span>
  );
}
