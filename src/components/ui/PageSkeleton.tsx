/**
 * PageSkeleton:
 * Layout-accurate shimmering skeleton component.
 * Replaces jarring full-screen spinners with a smooth, content-matched preview
 * that eliminates cumulative layout shift (CLS) during async view loading.
 */
export interface PageSkeletonProps {
  variant?: 'default' | 'cards' | 'calendar' | 'nutrition';
}

export function PageSkeleton({ variant = 'default' }: PageSkeletonProps = {}) {
  void variant;
  return (
    <div className="w-full max-w-[1240px] mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6 animate-pulse" aria-busy="true">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex flex-col gap-2">
          <div className="w-24 h-4 rounded-full bg-white/[0.08]" />
          <div className="w-56 sm:w-72 h-9 rounded-xl bg-white/[0.1]" />
          <div className="w-72 sm:w-96 h-4 rounded-lg bg-white/[0.05]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-10 rounded-xl bg-white/[0.08]" />
          <div className="w-32 h-10 rounded-xl bg-white/[0.12]" />
        </div>
      </div>

      {/* Hero / Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-2"
          >
            <div className="w-16 h-3 rounded bg-white/[0.06]" />
            <div className="w-24 h-7 rounded-lg bg-white/[0.12]" />
            <div className="w-20 h-2.5 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>

      {/* Main Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-4 min-h-[180px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-40 h-5 rounded-lg bg-white/[0.1]" />
                <div className="w-20 h-6 rounded-full bg-white/[0.06]" />
              </div>
              <div className="w-full h-24 rounded-xl bg-white/[0.04]" />
              <div className="flex items-center justify-between pt-2">
                <div className="w-28 h-3 rounded bg-white/[0.05]" />
                <div className="w-24 h-8 rounded-lg bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar / Secondary Card Column */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-card)] flex flex-col gap-4 min-h-[260px]">
            <div className="w-32 h-5 rounded-lg bg-white/[0.1]" />
            <div className="w-full h-36 rounded-xl bg-white/[0.05]" />
            <div className="w-full h-9 rounded-xl bg-white/[0.08]" />
          </div>
        </div>
      </div>
    </div>
  );
}
