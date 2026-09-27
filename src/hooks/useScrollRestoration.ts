import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// In-memory cache for scroll positions across routes
const scrollPositions = new Map<string, number>();

/**
 * useScrollRestoration:
 * Silky-smooth, instant scroll restoration for the main .content-area container.
 * Caches scroll offsets per route pathname and restores them on back/forward or tab switch.
 */
export function useScrollRestoration(contentAreaSelector: string = '.content-area') {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    const contentArea = document.querySelector(contentAreaSelector);
    if (!contentArea) return;

    // 1. Save scroll position of previous route before leaving
    const prevPath = prevPathRef.current;
    if (prevPath && prevPath !== location.pathname) {
      scrollPositions.set(prevPath, contentArea.scrollTop);
    }
    prevPathRef.current = location.pathname;

    // 2. Restore saved scroll position for current route, or scroll to top for fresh routes
    const savedPosition = scrollPositions.get(location.pathname) || 0;

    // Use requestAnimationFrame to ensure the new DOM is painted before restoring scroll
    const frameId = requestAnimationFrame(() => {
      contentArea.scrollTop = savedPosition;
    });

    return () => {
      cancelAnimationFrame(frameId);
      // Ensure we cache the scroll position when unmounting
      if (contentArea) {
        scrollPositions.set(location.pathname, contentArea.scrollTop);
      }
    };
  }, [location.pathname, contentAreaSelector]);
}
