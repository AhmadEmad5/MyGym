import { createContext, forwardRef, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE, MOTION_STAGGER, staggerDelay } from '../../lib/motion';
import type { AnyMotionTag } from './tags';

/**
 * Staggered entrance for grids and lists.
 *
 * `Stagger` owns the timing, `StaggerItem` owns the animation. The delay index
 * is clamped to `MOTION_STAGGER.maxIndex`, so a 60-row programme list finishes
 * revealing in well under `MOTION_STAGGER.budget` seconds instead of trickling
 * in for two seconds while the user waits on the gym floor.
 *
 * `Stagger` renders no DOM of its own unless you pass `as`, in which case it
 * replaces — never wraps — the element you already had, so `.routines-card-grid`
 * and `.calendar-plan-list` keep matching exactly.
 *
 * Under reduced motion `StaggerItem` renders the same element with no animation
 * and no delay: content is simply present.
 */

export type StaggerElement = 'div' | 'ul' | 'ol' | 'li' | 'section' | 'article' | 'span' | 'button';

const MOTION_TAGS = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  section: motion.section,
  article: motion.article,
  span: motion.span,
  button: motion.button,
} as unknown as Record<StaggerElement, AnyMotionTag>;

interface StaggerContextValue {
  motionEnabled: boolean;
  step: number;
  base: number;
  maxIndex: number;
}

const StaggerContext = createContext<StaggerContextValue>({
  motionEnabled: true,
  step: MOTION_STAGGER.step,
  base: MOTION_STAGGER.base,
  maxIndex: MOTION_STAGGER.maxIndex,
});

export interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'initial' | 'animate' | 'variants' | 'transition'> {
  children: ReactNode;
  /** Optional element to render. Omit to add no DOM at all. */
  as?: StaggerElement;
  /** Seconds added per item. Default `MOTION_STAGGER.step`. */
  step?: number;
  /** Seconds before the first item. Default `MOTION_STAGGER.base`. */
  baseDelay?: number;
  /** Highest index that still receives an increasing delay. Default 6. */
  maxIndex?: number;
  /** Escape hatch to disable staggering without changing the tree. */
  enabled?: boolean;
}

export function Stagger({
  children,
  as,
  step = MOTION_STAGGER.step,
  baseDelay = MOTION_STAGGER.base,
  maxIndex = MOTION_STAGGER.maxIndex,
  enabled = true,
  ...props
}: StaggerProps) {
  const reduced = useReducedMotion();

  const value = useMemo<StaggerContextValue>(
    () => ({ motionEnabled: enabled && !reduced, step, base: baseDelay, maxIndex }),
    [enabled, reduced, step, baseDelay, maxIndex]
  );

  const content = <StaggerContext.Provider value={value}>{children}</StaggerContext.Provider>;

  if (!as) return content;

  const Tag = MOTION_TAGS[as] ?? MOTION_TAGS.div;
  return (
    <Tag {...props}>
      {content}
    </Tag>
  );
}

export interface StaggerItemProps
  extends Omit<
    HTMLMotionProps<'div'>,
    'children' | 'initial' | 'animate' | 'variants' | 'transition' | 'viewport' | 'whileInView'
  > {
  children: ReactNode;
  /** Position in the group. Values past `maxIndex` share the last delay. */
  index: number;
  /** Rendered element. Defaults to `div`. */
  as?: StaggerElement;
  /** Forwarded only when `as="button"`. */
  type?: 'button' | 'submit' | 'reset';
  /** Pixels travelled upward into place. Transform-only. Default 8. */
  distance?: number;
  /** Seconds. Default `MOTION_DURATION.base`. */
  duration?: number;
}

export const StaggerItem = forwardRef<HTMLElement, StaggerItemProps>(function StaggerItem(
  { children, index, as = 'div', type, distance = MOTION_DISTANCE.xs, duration = MOTION_DURATION.base, ...props },
  ref
) {
  const { motionEnabled, step, base, maxIndex } = useContext(StaggerContext);
  const Tag = MOTION_TAGS[as] ?? MOTION_TAGS.div;
  const typeProps = as === 'button' ? { type: type ?? ('button' as const) } : {};

  if (!motionEnabled) {
    return (
      <Tag {...typeProps} {...props} ref={ref}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      {...typeProps}
      {...props}
      ref={ref}
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay: staggerDelay(index, step, base, maxIndex), ease: MOTION_EASE.emphasized }}
    >
      {children}
    </Tag>
  );
});
