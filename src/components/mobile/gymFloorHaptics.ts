import { fireHaptic, supportsHaptics } from '../motion/haptics';

export const GYM_FLOOR_HAPTICS = {
  step: 12,
  select: 18,
  setComplete: [26, 40, 26],
  sessionStart: [30, 50, 30],
  restStarted: [30, 50, 30],
  pr: [40, 60, 40, 60, 90]
};

/**
 * Gym-floor naming for the shared guarded vibration helper. Wet hands cannot
 * confirm a press visually, so every commit on a gym-floor surface gets a
 * pulse. No-ops on desktop and on WebViews where the Vibration API is stripped,
 * and never throws into a commit handler.
 */
export function pulseHaptic(pattern: number | number[] = GYM_FLOOR_HAPTICS.step): boolean {
  if (!supportsHaptics()) return false;
  fireHaptic(pattern);
  return true;
}
