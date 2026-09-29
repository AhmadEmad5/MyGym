import { forwardRef, useCallback, useMemo, useState } from 'react';
import type { FocusEvent, PointerEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_SCALE, pressTransition, resolveTransition } from '../../lib/motion';
import { fireHaptic } from './haptics';
import type { HapticPattern } from './haptics';

/**
 * Press feedback for anything tappable.
 *
 * - Transform-only (`scale`), so it can never cause layout shift — not even on
 *   the scroll container.
 * - Never swallows or delays the click: no `preventDefault`, no
 *   `stopPropagation`, and the haptic fires on `pointerdown` rather than on
 *   `click`, so the action dispatches immediately and the buzz lands with it.
 * - Keyboard reachable: `Space`/`Enter` still activate the element, and the
 *   subtle focus nudge is gated on `:focus-visible` so it never fights a
 *   mouse press. The real focus ring stays in CSS (`.ui-focus-ring`).
 * - A hard no-op under reduced motion: `whileTap`/`whileFocus` are removed
 *   rather than shortened. Haptics stay available — they are not motion.
 */

export type PressableElement = 'button' | 'a' | 'div' | 'span' | 'li';

const MOTION_TAGS = {
  button: motion.button,
  a: motion.a,
  div: motion.div,
  span: motion.span,
  li: motion.li,
} as unknown as Record<PressableElement, typeof motion.button>;

/**
 * `onDrag*` are omitted because framer-motion re-declares them as pan gestures;
 * `src/components/ui/Button.tsx` omits the same keys for the same reason.
 */
export interface PressableProps
  extends Omit<HTMLMotionProps<'button'>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** Rendered element. Defaults to `button`. */
  as?: PressableElement;
  /** Scale held while pressed. Default `MOTION_SCALE.press`. */
  scale?: number;
  /** Blocks the press animation and any haptic. Mirrors `disabled`. */
  disabled?: boolean;
  /** `true` for a short tick, a ms number, or a vibrate pattern. */
  haptic?: HapticPattern;
  children?: ReactNode;
}

/** True when the browser considers the focus ring appropriate (keyboard only). */
function isFocusVisible(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).matches !== 'function') return false;
  try {
    return (target as Element).matches(':focus-visible');
  } catch {
    return false;
  }
}

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  {
    as = 'button',
    scale = MOTION_SCALE.press,
    disabled = false,
    haptic = false,
    className,
    style,
    children,
    whileTap,
    whileFocus,
    onPointerDown,
    onFocus,
    onBlur,
    type,
    ...props
  },
  ref
) {
  const reduced = useReducedMotion();
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const Tag = useMemo(() => MOTION_TAGS[as] ?? MOTION_TAGS.button, [as]);
  const isButton = as === 'button';
  const interactive = !reduced && !disabled;

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!disabled) fireHaptic(haptic);
      onPointerDown?.(event);
    },
    [disabled, haptic, onPointerDown]
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      setKeyboardFocused(isFocusVisible(event.target));
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      setKeyboardFocused(false);
      onBlur?.(event);
    },
    [onBlur]
  );

  return (
    <Tag
      ref={ref}
      {...(isButton ? { type: type ?? 'button' } : {})}
      className={className}
      style={style}
      disabled={isButton ? disabled || undefined : undefined}
      aria-disabled={isButton ? undefined : disabled || undefined}
      whileTap={interactive ? (whileTap ?? { scale }) : undefined}
      whileFocus={interactive && keyboardFocused ? (whileFocus ?? { scale: MOTION_SCALE.focus }) : undefined}
      transition={resolveTransition(pressTransition, interactive)}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </Tag>
  );
});
