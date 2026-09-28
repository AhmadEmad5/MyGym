import { PageSkeleton as CanonicalPageSkeleton } from '../ui/PageSkeleton';
import type { PageSkeletonProps as CanonicalPageSkeletonProps } from '../ui/PageSkeleton';

export interface PageSkeletonProps extends Omit<CanonicalPageSkeletonProps, 'variant'> {
  variant?: 'rows';
}

export function PageSkeleton({ rows = 4, variant = 'rows', className }: PageSkeletonProps) {
  return <CanonicalPageSkeleton variant={variant} rows={rows} className={className} />;
}
