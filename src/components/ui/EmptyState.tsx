import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--surface-primary)]/50 ${className}`.trim()}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] flex items-center justify-center mb-4 shadow-[var(--shadow-glow-cyan)]">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
