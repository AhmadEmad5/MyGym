import type { Transition } from 'framer-motion';

export const NAV_SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.75,
};

export const SHEET_SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
};

export const POPOVER_TRANSITION: Transition = {
  duration: 0.16,
};

export const DRAG_CLOSE_DISTANCE = 96;
export const DRAG_CLOSE_VELOCITY = 650;

export function resolveTransition(
  transition: Transition,
  motionEnabled: boolean,
): Transition {
  if (motionEnabled) return transition;
  return { duration: 0 };
}
