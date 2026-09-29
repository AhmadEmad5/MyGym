import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { HTMLMotionProps } from 'framer-motion';

/**
 * A `motion.*` element typed so these primitives can swap tags via `as` and
 * still forward a ref, without a cast at every call site.
 *
 * `HTMLElement` is the honest intersection of every element the primitives
 * accept (`div`, `li`, `button`, …). `HTMLMotionProps<'div'>` is used as the
 * prop surface because it is the narrowest of the set and therefore the only
 * one every other tag is assignable to.
 */
export type AnyMotionTag = ForwardRefExoticComponent<
  Omit<HTMLMotionProps<'div'>, 'ref'> & RefAttributes<HTMLElement>
>;
