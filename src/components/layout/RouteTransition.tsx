import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * RouteTransition:
 * Hardware-accelerated fluid page entry/exit transition using transform & opacity exclusively.
 * Operates at native 60/120fps with zero layout shift (CLS).
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: '100%',
        minHeight: '100%',
        willChange: 'opacity, transform',
        transform: 'translateZ(0)'
      }}
    >
      {children}
    </motion.div>
  );
}
