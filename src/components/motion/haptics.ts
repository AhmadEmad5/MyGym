/**
 * Guarded haptics.
 *
 * `navigator.vibrate` exists on Android WebView and desktop Chrome, is absent
 * on iOS Safari / WKWebView (including the Capacitor iOS shell) and can throw
 * when the page is not user-activated. Everything here is feature-detected and
 * wrapped: a haptic is a nice-to-have and must never break a tap or a log.
 */

/** `false` (no pulse), `true` (short default tick), or a vibrate pattern in ms. */
export type HapticPattern = boolean | number | readonly number[];

type MaybeVibratingNavigator = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

const DEFAULT_TICK = 12;

function getVibrate(): ((pattern: number | number[]) => boolean) | null {
  if (typeof navigator === 'undefined') return null;
  const candidate = (navigator as MaybeVibratingNavigator).vibrate;
  return typeof candidate === 'function' ? candidate.bind(navigator) : null;
}

function resolvePattern(pattern: HapticPattern): number | number[] | null {
  if (pattern === true) return DEFAULT_TICK;
  if (pattern === false) return null;
  if (typeof pattern === 'number') return pattern > 0 ? pattern : null;
  return pattern.length > 0 ? pattern.slice() : null;
}

/** True when this device can actually vibrate. */
export function supportsHaptics(): boolean {
  return getVibrate() !== null;
}

/**
 * Fire a haptic pulse. Silently no-ops when unsupported, when the pattern is
 * `false`/`0`, or when the platform rejects the call.
 */
export function fireHaptic(pattern: HapticPattern = true): void {
  const vibrate = getVibrate();
  if (!vibrate) return;

  const resolved = resolvePattern(pattern);
  if (resolved === null) return;

  try {
    vibrate(resolved);
  } catch {
    /* Haptics are decorative. Ignore every failure mode. */
  }
}
