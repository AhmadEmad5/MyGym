import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../../lib/motion';
import type { AnyMotionTag } from './tags';

/**
 * Viewport-triggered entrance for content that starts below the fold.
 *
 * - Transform + opacity only. No `height`/`top`/`margin`, so revealing a row
 *   never reflows the scroll container.
 * - IntersectionObserver-backed via framer-motion's `whileInView`, `once: true`
 *   so a long workout list does not re-animate while the user scrolls back up.
 * - Renders exactly one element and never an extra wrapper: `as` lets the
 *   consumer keep the semantic tag (`li`, `section`, `article`) it already had,
 *   and the className passed is emitted verbatim.
 * - Never blocks content: if the observer never fires (a `display:none`
 *   ancestor, a zero-height row, a browser quirk) a fallback timer completes
 *   the reveal so nothing can get stuck invisible.
 * - No-op under reduced motion: the initial frame is skipped entirely.
 */

export type RevealElement = 'div' | 'section' | 'article' | 'li' | 'span' | 'header' | 'footer';

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
  header: motion.header,
  footer: motion.footer,
} as unknown as Record<RevealElement, AnyMotionTag>;

export interface RevealProps
  extends Omit<
    HTMLMotionProps<'div'>,
    'children' | 'initial' | 'animate' | 'variants' | 'transition' | 'viewport' | 'whileInView'
  > {
  children: ReactNode;
  /** Rendered tag. Defaults to `div`. */
  as?: RevealElement;
  /** Pixels travelled upward into place. Transform-only. Default 8. */
  distance?: number;
  /** Seconds. Default `MOTION_DURATION.base`. */
  duration?: number;
  /** Seconds. */
  delay?: number;
  /** IntersectionObserver root margin. Negative bottom trims the trigger line. */
  margin?: string;
  /** Fraction of the element that must be visible to trigger. Default `0`. */
  amount?: number;
  /**
   * Safety net in ms: the reveal completes even if the observer never fires.
   * Pass `0` to disable. Default 1200.
   */
  fallbackMs?: number;
}

export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(
  {
    children,
    as = 'div',
    distance = MOTION_DISTANCE.xs,
    duration = MOTION_DURATION.base,
    delay = 0,
    margin = '0px 0px -6% 0px',
    amount = 0,
    fallbackMs = 1200,
    ...props
  },
  ref
) {
  const reduced = useReducedMotion();
  const [forceShown, setForceShown] = useState(false);
  const Tag = useMemo(() => MOTION_TAGS[as] ?? MOTION_TAGS.div, [as]);

  useEffect(() => {
    if (reduced || forceShown || fallbackMs <= 0) return;
    const timer = window.setTimeout(() => setForceShown(true), fallbackMs);
    return () => window.clearTimeout(timer);
  }, [reduced, forceShown, fallbackMs]);

  if (reduced) {
    return (
      <Tag {...props} ref={ref}>
        {children}
      </Tag>
    );
  }

  const hidden = { opacity: 0, y: distance };
  const shown = { opacity: 1, y: 0 };

  return (
    <Tag
      {...props}
      ref={ref}
      initial={hidden}
      {...(forceShown
        ? { animate: shown }
        : {
            whileInView: shown,
            viewport: { once: true, amount, margin },
          })}
      transition={{ duration, delay, ease: MOTION_EASE.emphasized }}
    >
      {children}
    </Tag>
  );
});
