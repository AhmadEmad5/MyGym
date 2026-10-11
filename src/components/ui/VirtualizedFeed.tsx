import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualizedFeedProps<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  emptyState?: React.ReactNode;
  maxHeight?: string | number;
}

/**
 * High-performance virtualized list container powered by @tanstack/react-virtual.
 * Eliminates DOM bloat and layout thrashing by mounting only the rows currently
 * visible in the viewport + overscan buffer, guaranteeing consistent 60fps scrolling
 * even across feeds with hundreds of workout sessions, history logs, or meal entries.
 */
export function VirtualizedFeed<T>({
  items,
  estimateSize = 72,
  overscan = 5,
  gap = 0,
  renderItem,
  getItemKey,
  className = '',
  emptyState = null,
  maxHeight = '650px'
}: VirtualizedFeedProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
    getItemKey: (index) => {
      if (getItemKey && items[index]) {
        return getItemKey(items[index], index);
      }
      return index;
    }
  });

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  // If item count is small (< 15), avoid virtualization overhead and render directly
  if (items.length < 15) {
    return (
      <div className={`virtualized-feed-direct ${className}`} style={gap ? { display: 'flex', flexDirection: 'column', gap: `${gap}px` } : undefined}>
        {items.map((item, index) => {
          const key = getItemKey ? getItemKey(item, index) : index;
          return <React.Fragment key={key}>{renderItem(item, index)}</React.Fragment>;
        })}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`virtualized-scroll-container ${className}`}
      style={{
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        contain: 'strict',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                willChange: 'transform'
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
