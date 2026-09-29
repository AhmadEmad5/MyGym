import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from './cn';
import { useReducedMotion } from '../performance/useReducedMotion';
import { Pressable } from '../motion/Pressable';
import { MOTION_DISTANCE, MOTION_SCALE, popoverTransition, resolveTransition } from '../../lib/motion';

export type HintPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';

export interface HintProps {
  /** Explanatory copy. Fully caller-owned so it stays translatable via `t()`. */
  content: ReactNode;
  /** Accessible name for the trigger. Supply it from `t()` — never hardcode. */
  label?: string;
  placement?: HintPlacement;
  /** Overrides the default lucide `Info` glyph. Decorative either way. */
  icon?: ReactNode;
  className?: string;
  panelClassName?: string;
  /** Controlled open state. Pairs with `onOpenChange`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  id?: string;
}

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'center' | 'start' | 'end';

interface Axis {
  side: Side;
  align: Align;
}

const AXIS: Record<HintPlacement, Axis> = {
  top: { side: 'top', align: 'center' },
  'top-start': { side: 'top', align: 'start' },
  'top-end': { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  'bottom-start': { side: 'bottom', align: 'start' },
  'bottom-end': { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  right: { side: 'right', align: 'center' }
};

/** Breathing room between the panel and the viewport edge. */
const VIEWPORT_MARGIN = 12;
/** Distance between the trigger and the panel, arrow included. */
const ANCHOR_GAP = 12;
/** Minimum distance between the arrow and the panel's corner, in px. */
const ARROW_EDGE = 26;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readDirection(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dir === 'rtl';
}

/** `:focus-visible` decides whether a focus came from a keyboard or a tap. */
function isFocusVisible(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).matches !== 'function') return false;
  try {
    return (target as Element).matches(':focus-visible');
  } catch {
    return false;
  }
}

/**
 * Resolves the panel rect in viewport coordinates, flipping to the opposite side
 * when the requested one does not fit and clamping so it can never leave the
 * viewport. `-start`/`-end` are resolved against the writing direction, which is
 * what makes the placement names behave the same in `dir="rtl"`.
 */
function resolvePanelRect(
  anchor: DOMRect,
  width: number,
  height: number,
  axis: Axis,
  rtl: boolean
): { side: Side; left: number; top: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const vertical = axis.side === 'top' || axis.side === 'bottom';

  let side = axis.side;
  let left: number;
  let top: number;

  if (vertical) {
    const needed = height + ANCHOR_GAP;
    const roomAbove = anchor.top;
    const roomBelow = viewportHeight - anchor.bottom;

    if (side === 'top' && roomAbove < needed && roomBelow > roomAbove) side = 'bottom';
    else if (side === 'bottom' && roomBelow < needed && roomAbove > roomBelow) side = 'top';

    if (axis.align === 'center') left = anchor.left + anchor.width / 2 - width / 2;
    else if (axis.align === 'start') left = rtl ? anchor.right - width : anchor.left;
    else left = rtl ? anchor.left : anchor.right - width;

    top = side === 'top' ? anchor.top - height - ANCHOR_GAP : anchor.bottom + ANCHOR_GAP;
  } else {
    const needed = width + ANCHOR_GAP;
    const roomBefore = rtl ? viewportWidth - anchor.right : anchor.left;
    const roomAfter = rtl ? anchor.left : viewportWidth - anchor.right;

    if (side === 'left' && roomBefore < needed && roomAfter > roomBefore) side = 'right';
    else if (side === 'right' && roomAfter < needed && roomBefore > roomAfter) side = 'left';

    left = side === 'left' ? anchor.left - width - ANCHOR_GAP : anchor.right + ANCHOR_GAP;
    top = anchor.top + anchor.height / 2 - height / 2;
  }

  return {
    side,
    left: clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN)),
    top: clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN))
  };
}

function resolveArrow(
  anchor: DOMRect,
  width: number,
  height: number,
  side: Side,
  left: number,
  top: number,
  rtl: boolean
): { offset: string; shift: string } {
  if (side === 'top' || side === 'bottom') {
    const fromPhysicalLeft = anchor.left + anchor.width / 2 - left;
    const fromInlineStart = rtl ? width - fromPhysicalLeft : fromPhysicalLeft;
    return {
      offset: `${clamp(fromInlineStart, ARROW_EDGE, Math.max(ARROW_EDGE, width - ARROW_EDGE))}px`,
      shift: rtl ? '50%' : '-50%'
    };
  }

  const fromBlockStart = anchor.top + anchor.height / 2 - top;
  return {
    offset: `${clamp(fromBlockStart, ARROW_EDGE, Math.max(ARROW_EDGE, height - ARROW_EDGE))}px`,
    shift: side === 'right' ? '50%' : '-50%'
  };
}

/**
 * `Hint` — a thumb-sized disclosure for a short piece of explanatory text.
 *
 * Tap-to-open is the primary path: the trigger is a real `<button>` with a 44px
 * minimum target, and the panel is portalled to `<body>` with `position: fixed`
 * coordinates so the clipped `.content-area` scroller can never crop it. Hover
 * and keyboard focus are additive, never required.
 */
export function Hint({
  content,
  label,
  placement = 'top',
  icon,
  className,
  panelClassName,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  id
}: HintProps) {
  const generatedId = useId();
  const panelId = id ?? `${generatedId}-hint`;
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : uncontrolledOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverOpenedRef = useRef(false);
  const reduced = useReducedMotion();
  const motionEnabled = !reduced;

  const setOpenState = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const layer = layerRef.current;
    const panel = panelRef.current;
    if (!trigger || !layer || !panel) return;

    const rtl = readDirection();
    const anchor = trigger.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    if (width === 0 || height === 0) return;

    const rect = resolvePanelRect(anchor, width, height, AXIS[placement], rtl);
    const arrow = resolveArrow(anchor, width, height, rect.side, rect.left, rect.top, rtl);

    layer.dataset.side = rect.side;
    layer.style.setProperty(
      '--ui-hint-inset-inline',
      `${rtl ? window.innerWidth - (rect.left + width) : rect.left}px`
    );
    layer.style.setProperty('--ui-hint-inset-block', `${rect.top}px`);
    layer.style.setProperty('--ui-hint-arrow', arrow.offset);
    layer.style.setProperty('--ui-hint-arrow-shift', arrow.shift);
  }, [placement]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, content, panelClassName, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onViewportChange = () => updatePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDownOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenState(false);
    };
    document.addEventListener('pointerdown', onPointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', onPointerDownOutside, true);
  }, [isOpen, setOpenState]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest?.('[role="dialog"]')) return;
      setOpenState(false);
      triggerRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpenState]);

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.pointerType !== 'mouse') return;
    hoverOpenedRef.current = true;
    setOpenState(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return;
    hoverOpenedRef.current = false;
    setOpenState(false);
  };

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    if (disabled || !isFocusVisible(event.target)) return;
    setOpenState(true);
  };

  const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
    setOpenState(false);
  };

  const handleClick = () => {
    if (disabled) return;
    if (hoverOpenedRef.current) {
      hoverOpenedRef.current = false;
      return;
    }
    setOpenState(!isOpen);
  };

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <div ref={layerRef} className="ui-hint-layer">
          <motion.div
            ref={panelRef}
            id={panelId}
            role="tooltip"
            data-placement={placement}
            initial={
              motionEnabled
                ? { opacity: 0, scale: MOTION_SCALE.press, y: MOTION_DISTANCE.hairline }
                : false
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={resolveTransition(popoverTransition, motionEnabled)}
            className={cn('ui-hint-panel', panelClassName)}
          >
            <span className="ui-hint-arrow" aria-hidden="true" />
            <span className="ui-hint-body">{content}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Pressable
        ref={triggerRef}
        as="button"
        type="button"
        disabled={disabled}
        scale={MOTION_SCALE.pressControl}
        haptic
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={isOpen ? panelId : undefined}
        data-open={isOpen ? 'true' : 'false'}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className={cn('ui-hint-trigger', className)}
      >
        <span className="ui-hint-icon" aria-hidden="true">
          {icon ?? <Info />}
        </span>
      </Pressable>
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
}
