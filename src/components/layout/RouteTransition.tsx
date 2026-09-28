import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotionEnabled } from './useMotionPreference';

interface RouteTransitionProps {
  children: ReactNode;
}

const SCROLL_CONTAINER_SELECTOR = '.content-area';

const scrollMemory = new Map<string, number>();

/**
 * Applies a transform/opacity-only route transition and re-asserts the outgoing
 * scroll offset once the entering route is committed, so a route swap never
 * loses the reader position or produces a layout jump.
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const { pathname } = useLocation();
  const motionEnabled = useMotionEnabled();
  const committedPathRef = useRef(pathname);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
    if (!container) return;

    const previousPathname = committedPathRef.current;
    if (previousPathname !== pathname) {
      scrollMemory.set(previousPathname, container.scrollTop);
      committedPathRef.current = pathname;
    }

    const target = scrollMemory.get(pathname) ?? 0;
    let nestedFrame = 0;

    const outerFrame = requestAnimationFrame(() => {
      container.scrollTop = target;
      nestedFrame = requestAnimationFrame(() => {
        if (container.scrollTop !== target) {
          container.scrollTop = target;
        }
      });
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(nestedFrame);
    };
  }, [pathname]);

  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={motionEnabled ? { opacity: 0, y: -6 } : { opacity: 1 }}
      transition={motionEnabled ? { duration: 0.18, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
      style={{
        width: '100%',
        minHeight: '100%',
        ...(motionEnabled ? { willChange: 'opacity, transform' } : null),
      }}
    >
      {children}
    </motion.div>
  );
}
