import type { Transition } from 'framer-motion';

/* ==========================================================================
   FORMA — Motion Token Layer

   Single source of truth for every duration, easing curve and spring in the
   app. `src/components/layout/navMotion.ts` holds the nav/sheet/popover tokens;
   the values below are deliberately identical to that file so the app speaks
   one motion vocabulary instead of three:

     springSnappy          ===  NAV_SPRING        (420 / 32 / 0.75)
     sheetTransition       ===  SHEET_SPRING      (380 / 34)
     popoverTransition     ===  POPOVER_TRANSITION(duration 0.16)
     pageTransition        ===  microTransition's curve, longer window

   Rules encoded here:
     - Only `transform` and `opacity` belong on a hot path. Nothing in this file
       encourages animating width/height/top/left.
     - Nothing runs longer than 0.45s. A gym-floor tap must resolve instantly.
     - `resolveTransition()` is the only sanctioned way to hand a transition to
       a component that must degrade under reduced motion.
   ========================================================================== */

/** A cubic-bezier control quadruple, matching motion-dom's `BezierDefinition`. */
export type MotionEasing = readonly [number, number, number, number];

/* --------------------------------------------------------------------------
   Easing — mirrors `--ease-*` in src/styles/design-tokens.css
   -------------------------------------------------------------------------- */
export const MOTION_EASE = {
  /** No curve; for opacity-only crossfades. */
  linear: [0, 0, 1, 1] as const,
  /** `--ease-standard`. General purpose: entrances, small elements. */
  standard: [0.16, 1, 0.3, 1] as const,
  /** `--ease-out`. The app's default — fast start, confident settle. */
  emphasized: [0.22, 1, 0.36, 1] as const,
  /** Deceleration-only, for long travel (sheets, sheets of content). */
  decelerate: [0.05, 0.7, 0.1, 1] as const,
  /** `--ease-in`. Exits only. */
  accelerate: [0.4, 0, 1, 1] as const,
} satisfies Record<string, MotionEasing>;

/* --------------------------------------------------------------------------
   Duration scale (seconds) — mirrors `--motion-*` in design-tokens.css
   -------------------------------------------------------------------------- */
export const MOTION_DURATION = {
  /** Reduced-motion placeholder: land on the final frame immediately. */
  instant: 0,
  /** `--motion-fast` (140ms). Press feedback, chip toggles. */
  quick: 0.14,
  /** 160ms. The micro-interaction default. */
  fast: 0.16,
  /** `--motion-base` (200ms). Cards, list entrances, sheets. */
  base: 0.2,
  /** 220ms. Route/page transitions. */
  page: 0.22,
  /** `--motion-slow` (320ms). Large surfaces only. */
  slow: 0.32,
} as const;

/* --------------------------------------------------------------------------
   Distance ramp (px) — transform translateY only, never a layout property
   -------------------------------------------------------------------------- */
export const MOTION_DISTANCE = {
  hairline: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
} as const;

/* --------------------------------------------------------------------------
   Scale ramp — press feedback. All are transform: scale().
   -------------------------------------------------------------------------- */
export const MOTION_SCALE = {
  /** Strong press (cards, rows). */
  press: 0.97,
  /** Match for `.forma-primary-button:active` in src/styles/forma-shell.css. */
  pressPrimary: 0.98,
  /** Match for `.ui-segmented-trigger` press. */
  pressControl: 0.95,
  /** Almost imperceptible; dense lists where every row is tappable. */
  pressSubtle: 0.995,
  /** Keyboard focus affordance. Never reads as a "pop". */
  focus: 1.015,
} as const;

/* --------------------------------------------------------------------------
   Stagger — capped so a 60-item list never takes a second to appear.
   -------------------------------------------------------------------------- */
export const MOTION_STAGGER = {
  /** Delay added per item, in seconds. */
  step: 0.028,
  /** Delay before the first item starts, in seconds. */
  base: 0.04,
  /** Highest index that still receives an increasing delay. */
  maxIndex: 6,
  /** Hard ceiling: `base + step * maxIndex` must stay under this. */
  budget: 0.24,
} as const;

/* --------------------------------------------------------------------------
   CountUp
   -------------------------------------------------------------------------- */
export const MOTION_COUNTUP = {
  /** Deltas larger than this start partially filled rather than from zero. */
  bigDelta: 500,
  /** Fraction of a big delta that is pre-filled before animating. */
  bigDeltaFill: 0.6,
  /** Value units covered per second, used to derive a duration. */
  unitsPerSecond: 900,
  minDuration: 0.25,
  maxDuration: 1.1,
  /** Deltas at or below this are not animated at all. */
  epsilon: 0.005,
} as const;

/* --------------------------------------------------------------------------
   Springs
   -------------------------------------------------------------------------- */

/** The app's default spring. Identical to `NAV_SPRING` in navMotion.ts. */
export const springSnappy = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.75,
};

/** Softer, heavier spring for large surfaces. Identical to `SHEET_SPRING`. */
export const springSoft = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
};

/** Slightly under-damped; used for press release so a tap feels physical. */
export const springBouncy = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 28,
  mass: 0.55,
};

/* --------------------------------------------------------------------------
   Tinted transitions (kept as the legacy exports — nothing may break)
   -------------------------------------------------------------------------- */

/** Route / page swap. */
export const pageTransition: Transition = {
  duration: MOTION_DURATION.page,
  ease: MOTION_EASE.emphasized,
};

/** Chip, tab, icon toggle. */
export const microTransition: Transition = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE.emphasized,
};

/** Bottom sheet / drawer. Mirrors `SHEET_SPRING`. */
export const sheetTransition: Transition = springSoft;

/** Anchored menu. Mirrors `POPOVER_TRANSITION`. */
export const popoverTransition: Transition = {
  duration: MOTION_DURATION.fast,
};

/** Press-down / release feel for `Pressable`. Settles in roughly 200ms. */
export const pressTransition: Transition = {
  type: 'spring',
  stiffness: springBouncy.stiffness,
  damping: springBouncy.damping,
  mass: springBouncy.mass,
};

/** Returned whenever motion is disabled. */
export const zeroTransition: Transition = { duration: MOTION_DURATION.instant };

/* --------------------------------------------------------------------------
   Named presets
   -------------------------------------------------------------------------- */
export const MOTION_TRANSITION = {
  /** Route swap. Transform + opacity over ~220ms. */
  page: pageTransition,
  /** Small toggles, chips, icon swaps. */
  micro: microTransition,
  /** Default spring for anything interactive. */
  spring: springSnappy,
  /** Crisper spring for press release and small controls. */
  snappy: springBouncy,
  /** Bottom sheets and drawers. */
  sheet: sheetTransition,
  /** Anchored popovers and menus. */
  popover: popoverTransition,
} as const satisfies Record<string, Transition>;

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

/**
 * The single gate for reduced motion. Returns the transition untouched when
 * motion is allowed, and a zero-duration transition when it is not.
 *
 * ```tsx
 * <motion.div transition={resolveTransition(MOTION_TRANSITION.page, motionEnabled)} />
 * ```
 */
export function resolveTransition(transition: Transition, motionEnabled: boolean): Transition {
  if (motionEnabled) return transition;
  return zeroTransition;
}

/**
 * Delay, in seconds, for the `index`-th item of a staggered group.
 *
 * The index is clamped to `maxIndex` so a 60-row list finishes revealing in
 * under `MOTION_STAGGER.budget` seconds instead of trickling in.
 */
export function staggerDelay(
  index: number,
  step: number = MOTION_STAGGER.step,
  base: number = MOTION_STAGGER.base,
  maxIndex: number = MOTION_STAGGER.maxIndex,
): number {
  if (!Number.isFinite(index) || index <= 0) return base;
  const clamped = Math.min(index, Math.max(0, maxIndex));
  return base + clamped * step;
}
