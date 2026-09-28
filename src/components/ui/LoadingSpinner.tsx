import { Dumbbell } from 'lucide-react';
import { cn } from './cn';

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<LoadingSpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export function LoadingSpinner({ size = 'md', message, className }: { size?: LoadingSpinnerSize; message?: string; className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center p-8 gap-3', className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        <Dumbbell className={cn(SIZE_CLASS[size], 'animate-bounce')} aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
      {message && (
        <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">{message}</span>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('ui-skeleton block w-full h-4', className)} aria-hidden="true" />;
}
