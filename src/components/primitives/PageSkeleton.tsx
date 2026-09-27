interface PageSkeletonProps {
  rows?: number;
  className?: string;
}

export function PageSkeleton({ rows = 4, className = '' }: PageSkeletonProps) {
  return (
    <div className={`forma-page-skeleton ${className}`.trim()} aria-label="Loading" role="status">
      <span className="forma-skeleton-heading" />
      {Array.from({ length: rows }, (_, index) => <span key={index} className="forma-skeleton-row" />)}
    </div>
  );
}
