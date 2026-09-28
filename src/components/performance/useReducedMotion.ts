import { useEffect, useState } from 'react';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function readMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    if (window.matchMedia(MOTION_QUERY).matches) return true;
  } catch {
    return false;
  }
  return document.documentElement?.getAttribute('data-motion') === 'reduced';
}

/**
 * Tracks both the OS-level `prefers-reduced-motion` setting and the in-app
 * `[data-motion="reduced"]` attribute so animated surfaces can degrade safely.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readMotionPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = window.matchMedia(MOTION_QUERY);
    } catch {
      return;
    }

    const sync = () => {
      const appReduced = document.documentElement?.getAttribute('data-motion') === 'reduced';
      setReduced(mediaQuery.matches || appReduced);
    };

    sync();
    mediaQuery.addEventListener?.('change', sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });

    return () => {
      mediaQuery.removeEventListener?.('change', sync);
      observer.disconnect();
    };
  }, []);

  return reduced;
}
