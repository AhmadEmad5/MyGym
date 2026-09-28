import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  titleAs?: 'h2' | 'h3';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  titleAs = 'h3'
}: EmptyStateProps) {
  const Heading = titleAs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={cn('ui-empty-state', className)}
    >
      {icon && <div className="ui-empty-icon">{icon}</div>}
      <Heading className="ui-empty-title">{title}</Heading>
      {description && <p className="ui-empty-description">{description}</p>}
      {(action || secondaryAction) && (
        <div className="ui-empty-actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
