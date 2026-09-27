import { Dumbbell } from 'lucide-react';

export function LoadingSpinner({
  size = 'md',
  message
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative flex items-center justify-center">
        <Dumbbell className={`${sizeMap[size]} text-[var(--accent-cyan)] animate-bounce`} />
      </div>
      {message && (
        <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
          {message}
        </span>
      )}
    </div>
  );
}

export function Skeleton({
  className = ''
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-white/[0.07] rounded-lg ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
