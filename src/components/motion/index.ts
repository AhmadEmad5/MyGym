/**
 * FORMA motion primitives.
 *
 * Every primitive here honours both reduced-motion signals — the OS
 * `prefers-reduced-motion` media query and the in-app
 * `html[data-motion="reduced"]` setting — through
 * `src/components/performance/useReducedMotion.ts`. Importing from this barrel
 * is the only supported entry point; import the individual files only when you
 * need to avoid a cycle.
 */

export { CountUp } from './CountUp';
export type { CountUpProps } from './CountUp';

export { Pressable } from './Pressable';
export type { PressableElement, PressableProps } from './Pressable';

export { Reveal } from './Reveal';
export type { RevealElement, RevealProps } from './Reveal';

export { Stagger, StaggerItem } from './Stagger';
export type { StaggerElement, StaggerItemProps, StaggerProps } from './Stagger';

export { fireHaptic, supportsHaptics } from './haptics';
export type { HapticPattern } from './haptics';
