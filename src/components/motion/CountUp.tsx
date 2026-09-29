import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_COUNTUP } from '../../lib/motion';

/**
 * Animates a numeric metric — weight, reps, calories, rest seconds — so a
 * number visibly "lands" instead of teleporting.
 *
 * - Text only: content changes, layout never does. The wrapper is an inline
 *   `<span>` so it can drop into a heading or a stat block.
 * - Depends on the target value alone. Re-rendering the parent does not restart
 *   the animation — the previously displayed value lives in a ref and the
 *   effect deps are `[value, reduced, duration, delay]`.
 * - Starts from a sensible offset: first paint lands instantly, and a huge jump
 *   (0 -> 1200 kcal) is pre-filled rather than crawling up from zero.
 * - Cancels its own `requestAnimationFrame` on unmount and on every new target.
 * - Under reduced motion the final value is rendered immediately.
 */

export interface CountUpProps {
  /** Target value. The only input the animation depends on. */
  value: number;
  /** Rendered form of a value. Default: nearest integer. */
  format?: (value: number) => string;
  /** Explicit start value. Defaults to the previously displayed value. */
  from?: number;
  /** Seconds. Omit to derive one from the size of the delta. */
  duration?: number;
  /** Seconds before counting begins. Default 0. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

const defaultFormat = (value: number): string => `${Math.round(value)}`;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  format = defaultFormat,
  from,
  duration,
  delay = 0,
  className,
  style,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState<number>(value);
  const previousRef = useRef<number | null>(null);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const previous = previousRef.current;

    if (reduced || previous === null || !Number.isFinite(target)) {
      previousRef.current = target;
      setDisplay(target);
      return;
    }

    const delta = target - previous;
    if (Math.abs(delta) <= MOTION_COUNTUP.epsilon) {
      setDisplay(target);
      return;
    }

    previousRef.current = target;

    // Pre-fill large jumps so a 0 -> 1200 kcal counter ticks up from 720
    // instead of spinning from zero.
    const isBigJump = Math.abs(delta) > MOTION_COUNTUP.bigDelta;
    const start = from ?? (isBigJump ? previous + delta * MOTION_COUNTUP.bigDeltaFill : previous);
    const travelled = Math.abs(target - start);

    const resolvedDuration =
      duration ??
      Math.min(
        MOTION_COUNTUP.maxDuration,
        Math.max(MOTION_COUNTUP.minDuration, travelled / MOTION_COUNTUP.unitsPerSecond)
      );

    if (resolvedDuration <= 0 || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDisplay(target);
      return;
    }

    const startTime = window.performance.now();
    const beginsAt = startTime + Math.max(0, delay) * 1000;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - beginsAt) / (resolvedDuration * 1000)));
      setDisplay(progress >= 1 ? target : start + (target - start) * easeOutCubic(progress));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
    // `format` is applied at render time and `from` is an opt-in start override
    // read only when the target changes, so neither can restart a running count.
  }, [value, reduced, duration, delay]);

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  );
}
