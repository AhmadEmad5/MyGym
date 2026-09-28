import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function readMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  const systemReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const appSetting = document.documentElement.getAttribute('data-motion');
  return systemReduced || appSetting === 'reduced';
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });

  return () => {
    mediaQuery.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

export function useMotionEnabled() {
  return !useSyncExternalStore(subscribe, readMotionPreference, () => false);
}
