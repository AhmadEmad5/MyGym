import { motion } from 'framer-motion';
import { cn } from './cn';

export type PageSkeletonVariant = 'default' | 'cards' | 'calendar' | 'nutrition' | 'rows';

export interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  rows?: number;
  className?: string;
}

function Bar({ className }: { className?: string }) {
  return <span className={cn('ui-skeleton', className)} aria-hidden="true" />;
}

export function PageSkeleton({ variant = 'default', rows = 4, className }: PageSkeletonProps = {}) {
  if (variant === 'rows') {
    return (
      <div
        className={cn('w-full flex flex-col gap-3', className)}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <Bar className="h-9 w-[min(20rem,55%)]" />
        {Array.from({ length: Math.max(0, rows) }, (_, index) => (
          <Bar key={index} className="h-[5.25rem] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full max-w-[1240px] mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6 animate-pulse',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]"
      >
        <div className="flex flex-col gap-2">
          <Bar className="w-24 h-4" />
          <Bar className="w-56 sm:w-72 h-9" />
          <Bar className="w-72 sm:w-96 h-4 opacity-70" />
        </div>
        <div className="flex items-center gap-2">
          <Bar className="w-28 h-10" />
          <Bar className="w-32 h-10 opacity-80" />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-2"
          >
            <Bar className="w-16 h-3 opacity-60" />
            <Bar className="w-24 h-7" />
            <Bar className="w-20 h-2.5 opacity-50" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-4 min-h-[180px]"
            >
              <div className="flex items-center justify-between">
                <Bar className="w-40 h-5" />
                <Bar className="w-20 h-6 opacity-60" />
              </div>
              <Bar className="w-full h-24 opacity-50" />
              <div className="flex items-center justify-between pt-2">
                <Bar className="w-28 h-3 opacity-60" />
                <Bar className="w-24 h-8 opacity-70" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-4 min-h-[260px]">
            <Bar className="w-32 h-5" />
            <Bar className="w-full h-36 opacity-50" />
            <Bar className="w-full h-9 opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}
