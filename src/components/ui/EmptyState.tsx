import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** One short actionable next step, shown under the description. */
  hint?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  titleAs?: 'h2' | 'h3';
  /** `compact` fits inside a card or side panel instead of filling a page. */
  size?: 'default' | 'compact';
}

const SIZE_CLASS: Record<'default' | 'compact', string> = {
  default: '',
  compact: 'ui-empty-state-compact'
};

export function EmptyState({
  icon,
  title,
  description,
  hint,
  action,
  secondaryAction,
  className,
  titleAs = 'h3',
  size = 'default'
}: EmptyStateProps) {
  const Heading = titleAs;
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: MOTION_DISTANCE.xs }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: MOTION_DURATION.instant }
          : { duration: MOTION_DURATION.base, ease: MOTION_EASE.standard }
      }
      className={cn('ui-empty-state', SIZE_CLASS[size], className)}
    >
      {icon && <div className="ui-empty-icon">{icon}</div>}
      <Heading className="ui-empty-title">{title}</Heading>
      {description && <p className="ui-empty-description">{description}</p>}
      {hint && <p className="ui-empty-hint">{hint}</p>}
      {(action || secondaryAction) && (
        <div className="ui-empty-actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
