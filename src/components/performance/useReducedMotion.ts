import { useEffect, useState } from 'react';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function safeMatchMedia(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(MOTION_QUERY);
  } catch {
    return null;
  }
}

function readAppMotionPreference(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement?.getAttribute('data-motion') === 'reduced';
}

/**
 * Tracks both the OS-level `prefers-reduced-motion` setting and the in-app
 * `[data-motion="reduced"]` attribute so animated surfaces can degrade safely.
 *
 * Either signal alone is enough to turn motion off; both are live, so flipping
 * the app setting takes effect immediately without a reload.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    const mediaQuery = safeMatchMedia();
    return (mediaQuery?.matches ?? false) || readAppMotionPreference();
  });

  useEffect(() => {
    const sync = () => {
      const mediaQuery = safeMatchMedia();
      setReduced((mediaQuery?.matches ?? false) || readAppMotionPreference());
    };

    sync();

    const mediaQuery = safeMatchMedia();
    mediaQuery?.addEventListener?.('change', sync);

    // Older WebViews only expose the deprecated API.
    const legacyMediaQuery = mediaQuery as (MediaQueryList & { addListener?: (cb: () => void) => void }) | null;
    legacyMediaQuery?.addListener?.(sync);

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
      observer = new MutationObserver(sync);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    }

    return () => {
      mediaQuery?.removeEventListener?.('change', sync);
      legacyMediaQuery?.removeListener?.(sync);
      observer?.disconnect();
    };
  }, []);

  return reduced;
}
