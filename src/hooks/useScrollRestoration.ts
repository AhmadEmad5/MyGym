import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigationType, type NavigationType } from 'react-router-dom';

/* ============================================================================
   CANONICAL SCROLL MEMORY
   ----------------------------------------------------------------------------
   Forma is an app shell, not a document: `body` is `overflow: hidden` and
   `.content-area` is the ONLY vertical scroller in the tree. Because of that,
   the browser's native history scroll restoration is useless here (the
   document never scrolls) and every route swap needs an explicit, instant
   write to `.content-area.scrollTop`.

   This module is the single owner of that write. It used to be duplicated in
   `RouteTransition.tsx` (a second Map + a second pair of rAF writes against
   the same property), which produced two independent caches racing each other
   on every navigation. There is now exactly one Map, one target computation
   and one writer; `RouteTransition` only reports the commit point.

   Protocol (imperative so the caller decides *when* a route is really on
   screen instead of guessing with rAF):
     prepareRoute(key, navType) - a transition is starting. Saves the outgoing
                                 offset, resolves the incoming target, arms a
                                 fallback. Never touches scrollTop.
     commitRoute(key, navType)  - the new route is mounted. Applies the target
                                 on the next frame and settles it for a few
                                 frames while lazy/async content grows.

   Both are idempotent and safe to call in either order, and both are no-ops
   when the route key has not changed - that is what makes a re-render or an
   unmount/remount of the SAME route leave the reading position alone.
   ========================================================================== */

const DEFAULT_SCROLL_CONTAINER = '.content-area';

/** Hard cap so long sessions cannot grow the cache without bound. */
const MAX_CACHED_ROUTES = 20;

/** Frames of re-assertion after a committed route. */
const RESTORE_FRAME_BUDGET = 12;
/** A POP also races the browser's own history scroll restoration. */
const POP_RESTORE_FRAME_BUDGET = 24;

/**
 * Fallback for routes that never reach `commitRoute` (the `<Navigate replace>`
 * aliases, the admin shell, which has no `.content-area` at all). Without it a
 * redirect would keep the previous route's offset.
 */
const FALLBACK_COMMIT_MS = 450;

const SCROLL_EPSILON = 1;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* -------------------------------------------------------------------------- */
/* Module state - one cache, one writer, one target at a time.                 */
/* -------------------------------------------------------------------------- */

const positions = new Map<string, number>();

/** Scroller the hook was told to own; survives detach so it can re-resolve. */
let activeSelector = DEFAULT_SCROLL_CONTAINER;
let container: HTMLElement | null = null;
let detachListeners: (() => void) | null = null;

/** Route key the next commit belongs to. */
let preparedKey: string | null = null;
/** Route key whose position is currently authoritative. */
let committedKey: string | null = null;

let pendingTarget: number | null = null;
let pendingBudget = RESTORE_FRAME_BUDGET;
let settleFramesLeft = 0;
let applyFrame = 0;

/** The scrollTop we last wrote, used to recognise our own scroll event. */
let expectScrollTop: number | null = null;

let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Route identity. The app keeps in-route state in the query string
 * (`CalendarView` reads `?tab=`), so the search is part of the identity.
 */
export function buildRouteKey(pathname: string, search: string): string {
  return search ? `${pathname}${search}` : pathname;
}

/**
 * Re-resolve the scroller. `.content-area` is destroyed when the shell swaps
 * to the admin layout and rebuilt on the way back, so the cached node has to be
 * re-queried on every route boundary rather than only when the hook mounts.
 */
function resolveContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (!container || !container.isConnected) {
    container = document.querySelector<HTMLElement>(activeSelector);
  }
  return container;
}

/** LRU-ish write: re-inserting keeps the most recent route at the tail. */
function remember(key: string | null, value: number): void {
  if (!key) return;
  positions.delete(key);
  positions.set(key, Math.max(0, value));
  if (positions.size <= MAX_CACHED_ROUTES) return;
  const oldest = positions.keys().next();
  if (oldest.done) return;
  positions.delete(oldest.value);
}

function recall(key: string): number | undefined {
  const saved = positions.get(key);
  if (saved === undefined) return undefined;
  positions.delete(key);
  positions.set(key, saved);
  return saved;
}

function currentKey(): string | null {
  return committedKey ?? preparedKey;
}

function clearFallback(): void {
  if (fallbackTimer === null) return;
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
}

/* -------------------------------------------------------------------------- */
/* Applying a target                                                           */
/* -------------------------------------------------------------------------- */

function applyOnce(el: HTMLElement, target: number): number {
  const max = Math.max(0, el.scrollHeight - el.clientHeight);
  const next = Math.min(Math.max(0, target), max);
  if (Math.abs(el.scrollTop - next) > SCROLL_EPSILON) {
    // Instant by contract: `.content-area` is `scroll-behavior: auto`, so this
    // is a hard write and never an animated "flying" scroll.
    el.scrollTop = next;
  }
  expectScrollTop = next;
  return next;
}

function finishSettle(): void {
  settleFramesLeft = 0;
  applyFrame = 0;
  expectScrollTop = null;
  const el = container;
  const key = currentKey();
  const target = pendingTarget;
  pendingTarget = null;
  if (el && key) remember(key, target === null ? el.scrollTop : target);
}

function stepSettle(): void {
  const el = container;
  const target = pendingTarget;
  if (!el || target === null) {
    finishSettle();
    return;
  }

  settleFramesLeft -= 1;

  const max = Math.max(0, el.scrollHeight - el.clientHeight);
  if (target > max && settleFramesLeft > 0) {
    // The new route is not tall enough yet (Suspense skeleton, lazy chunk,
    // async list). Clamping now is exactly what produces the "flashes back to
    // the top" bug, so wait for the real content instead.
    applyFrame = requestAnimationFrame(stepSettle);
    return;
  }

  const applied = applyOnce(el, target);
  const key = currentKey();
  if (key) remember(key, applied);

  if (settleFramesLeft > 0) {
    applyFrame = requestAnimationFrame(stepSettle);
    return;
  }
  finishSettle();
}

function startSettle(budget: number): void {
  if (typeof window === 'undefined' || pendingTarget === null) return;
  if (applyFrame) cancelAnimationFrame(applyFrame);
  expectScrollTop = null;
  pendingBudget = budget;
  settleFramesLeft = budget;
  applyFrame = requestAnimationFrame(stepSettle);
}

/** The reader (or a view's `scrollIntoView`) took over - stop fighting it. */
function abortSettle(): void {
  if (settleFramesLeft <= 0 && pendingTarget === null) return;
  const el = container;
  const key = currentKey();
  settleFramesLeft = 0;
  pendingTarget = null;
  expectScrollTop = null;
  if (applyFrame) {
    cancelAnimationFrame(applyFrame);
    applyFrame = 0;
  }
  if (el && key) remember(key, el.scrollTop);
}

function handleScroll(): void {
  const el = container;
  if (!el) return;
  if (settleFramesLeft > 0) {
    // Our own write echoes back as a scroll event; anything else is foreign
    // (a view calling `scrollIntoView`, or a real finger) and wins.
    if (expectScrollTop === null) return;
    if (Math.abs(el.scrollTop - expectScrollTop) <= SCROLL_EPSILON) return;
    abortSettle();
    return;
  }
  remember(currentKey(), el.scrollTop);
}

/* -------------------------------------------------------------------------- */
/* Listener lifecycle                                                          */
/* -------------------------------------------------------------------------- */

function attach(selector: string): void {
  if (typeof document === 'undefined') return;
  if (detachListeners) detachListeners();

  activeSelector = selector;
  const el = document.querySelector<HTMLElement>(selector);
  container = el;
  if (!el) return;

  const onScroll = () => handleScroll();
  const onInteract = () => abortSettle();
  const onKeyDown = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) abortSettle();
  };

  el.addEventListener('scroll', onScroll, { passive: true });
  el.addEventListener('touchstart', onInteract, { passive: true });
  el.addEventListener('pointerdown', onInteract, { passive: true });
  el.addEventListener('wheel', onInteract, { passive: true });
  el.addEventListener('keydown', onKeyDown);

  detachListeners = () => {
    el.removeEventListener('scroll', onScroll);
    el.removeEventListener('touchstart', onInteract);
    el.removeEventListener('pointerdown', onInteract);
    el.removeEventListener('wheel', onInteract);
    el.removeEventListener('keydown', onKeyDown);
  };

  // A container that appears after a redirect still owes us a restore.
  if (pendingTarget !== null) startSettle(pendingBudget);
}

function detach(): void {
  if (detachListeners) {
    detachListeners();
    detachListeners = null;
  }
  if (applyFrame) {
    cancelAnimationFrame(applyFrame);
    applyFrame = 0;
  }
  clearFallback();
  container = null;
  // `pendingTarget` survives on purpose: a StrictMode remount or a shell swap
  // (the admin layout has no `.content-area`) tears the scroller down and
  // rebuilds it, and the already-resolved target must not be thrown away.
  settleFramesLeft = 0;
  expectScrollTop = null;
}

/* -------------------------------------------------------------------------- */
/* Imperative API                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A transition is starting. Records where we are leaving from and what the
 * incoming route should land on, but deliberately does NOT write scrollTop:
 * with `<AnimatePresence mode="wait">` the outgoing route is still painted at
 * this point, so writing here is what used to produce the visible jump.
 */
export function prepareRoute(key: string, navType: NavigationType): void {
  if (preparedKey === key) {
    // Already resolved for this key, but never written (StrictMode remount, or
    // the scroller was torn down and rebuilt). Re-arm instead of dropping it.
    if (committedKey === key || pendingTarget === null || !resolveContainer()) return;
    committedKey = key;
    clearFallback();
    startSettle(pendingBudget);
    return;
  }

  const previousKey = preparedKey;
  const el = resolveContainer();
  if (previousKey && el) remember(previousKey, el.scrollTop);

  preparedKey = key;

  const saved = recall(key);
  // A route we have never seen (fresh PUSH, a deep link, a POP into an entry
  // that was trimmed or restored from a cold start) has no trustworthy offset
  // and must land at the top - instantly, never animated.
  pendingTarget = saved ?? 0;
  pendingBudget = navType === 'POP' ? POP_RESTORE_FRAME_BUDGET : RESTORE_FRAME_BUDGET;

  clearFallback();
  fallbackTimer = setTimeout(() => {
    fallbackTimer = null;
    if (pendingTarget === null) return;
    if (committedKey !== key && resolveContainer()) committedKey = key;
    startSettle(pendingBudget);
  }, FALLBACK_COMMIT_MS);
}

/**
 * The new route is committed and on screen. Applies the prepared offset,
 * clamped to the freshly measured scroll range, and re-asserts it for a few
 * frames so late-growing content does not silently clamp it away.
 */
export function commitRoute(key: string, navType: NavigationType): void {
  if (committedKey === key) return;
  prepareRoute(key, navType);
  // No scroller (the admin shell has no `.content-area`): leave the fallback
  // armed so the restore still lands if one appears before the timer expires.
  if (!resolveContainer() || pendingTarget === null) return;
  committedKey = key;
  clearFallback();
  startSettle(pendingBudget);
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The single call site. Attach the shell scroller, and keep the module's view
 * of "which route is live" in sync with the router. Restoration itself is
 * driven by `commitRoute` from the route transition so it lands after the new
 * route is mounted, not after the pathname changes.
 */
export function useScrollRestoration(selector: string = DEFAULT_SCROLL_CONTAINER): string {
  const location = useLocation();
  const navType = useNavigationType();

  const routeKey = useMemo(
    () => buildRouteKey(location.pathname, location.search),
    [location.pathname, location.search],
  );

  useIsomorphicLayoutEffect(() => {
    attach(selector);
  }, [selector]);

  useIsomorphicLayoutEffect(() => {
    prepareRoute(routeKey, navType);
  }, [routeKey, navType]);

  useEffect(() => detach, []);

  return routeKey;
}
