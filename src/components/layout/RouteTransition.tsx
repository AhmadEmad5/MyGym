import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotionEnabled } from './useMotionPreference';
import { buildRouteKey, commitRoute } from '../../hooks/useScrollRestoration';

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Transform/opacity only - never width, height, top or anything that would
 * force a layout pass on every route swap.
 */
const ENTER = { opacity: 1, y: 0 };
const EXIT = { opacity: 0, y: -6 };
const EXIT_REDUCED = { opacity: 1 };
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const DURATION = 0.18;

/**
 * Module-scope, so every instance and every re-render reuses the SAME object
 * identity. Under `<AnimatePresence mode="wait">` the outgoing route stays
 * mounted and re-renders with the new location; handing framer-motion a fresh
 * `animate` object there restarts the enter animation mid-exit, which is what
 * made the leaving page twitch while the new one mounted.
 */
const TRANSITION_MOTION = { duration: DURATION, ease: EASE };
const TRANSITION_REDUCED = { duration: 0 };

/**
 * Wraps a route with a short transform/opacity swap.
 *
 * It owns no scroll state at all. Scroll memory lives in
 * `useScrollRestoration`; this component only reports the one moment that
 * matters - the entering route is mounted - so the restore is applied against
 * the real content instead of racing the exit animation.
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  const navType = useNavigationType();
  const motionEnabled = useMotionEnabled();

  const routeKey = buildRouteKey(location.pathname, location.search);

  // A RouteTransition instance belongs to exactly one route key. The outgoing
  // copy re-renders with the new location while it animates out; comparing
  // against its own birth key is what stops the exiting route from committing
  // a restore for a page it is no longer showing.
  const birthKeyRef = useRef(routeKey);

  useLayoutEffect(() => {
    if (birthKeyRef.current !== routeKey) return;
    commitRoute(routeKey, navType);
  }, [routeKey, navType]);

  const style = useMemo(
    () => (motionEnabled ? { width: '100%', minHeight: '100%', willChange: 'opacity, transform' } : { width: '100%', minHeight: '100%' }),
    [motionEnabled],
  );

  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 8 } : false}
      animate={ENTER}
      exit={motionEnabled ? EXIT : EXIT_REDUCED}
      transition={motionEnabled ? TRANSITION_MOTION : TRANSITION_REDUCED}
      style={style}
    >
      {children}
    </motion.div>
  );
}
