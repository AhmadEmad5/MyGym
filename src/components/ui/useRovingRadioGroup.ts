import { useCallback, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

/** Minimal shape the keyboard maths needs: everything else is ignored. */
export interface RovingOption {
  disabled?: boolean;
}

export function firstEnabledIndex(items: readonly RovingOption[]): number {
  return items.findIndex((item) => !item.disabled);
}

export function lastEnabledIndex(items: readonly RovingOption[]): number {
  let found = -1;
  for (let index = 0; index < items.length; index += 1) {
    if (!items[index].disabled) found = index;
  }
  return found;
}

/**
 * Walks `step` positions away from `from`, skipping disabled options and
 * wrapping around. Returns -1 when no other option is reachable.
 */
export function stepEnabledIndex(items: readonly RovingOption[], from: number, step: number): number {
  const total = items.length;
  if (total === 0) return -1;
  for (let offset = 1; offset <= total; offset += 1) {
    const index = (((from + step * offset) % total) + total) % total;
    if (!items[index].disabled) return index;
  }
  return -1;
}

export interface ResolveRovingTargetInput {
  key: string;
  items: readonly RovingOption[];
  /** Index of the currently tabbable option, or -1 when none is reachable. */
  activeIndex: number;
  rtl: boolean;
}

/**
 * Maps one keystroke to the option it should move to, per the WAI-ARIA
 * radiogroup pattern. Returns null when the key is not ours or when no other
 * option is reachable, so the caller can leave the event alone.
 *
 * Horizontal arrows follow the writing direction: under `dir="rtl"` ArrowRight
 * steps backwards and ArrowLeft forwards, which is what keeps "the arrow points
 * at the next segment" true in both scripts. Vertical arrows always move down
 * and up the list.
 */
export function resolveRovingTarget({ key, items, activeIndex, rtl }: ResolveRovingTargetInput): number | null {
  if (activeIndex < 0 || activeIndex >= items.length) return null;

  if (key === 'Home') {
    const first = firstEnabledIndex(items);
    return first < 0 ? null : first;
  }
  if (key === 'End') {
    const last = lastEnabledIndex(items);
    return last < 0 ? null : last;
  }

  const step =
    key === 'ArrowDown' ? 1
    : key === 'ArrowUp' ? -1
    : key === 'ArrowRight' ? (rtl ? -1 : 1)
    : key === 'ArrowLeft' ? (rtl ? 1 : -1)
    : 0;
  if (step === 0) return null;

  const target = stepEnabledIndex(items, activeIndex, step);
  return target < 0 ? null : target;
}

export interface RovingRadioItem<T extends string | number> extends RovingOption {
  value: T;
}

export interface UseRovingRadioGroupOptions<T extends string | number> {
  items: readonly RovingRadioItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Forces the writing direction. When omitted the DOM decides. */
  dir?: 'ltr' | 'rtl';
}

export interface RovingRadioGroup {
  /** Attach to the `role="radiogroup"` element. */
  containerRef: RefObject<HTMLDivElement | null>;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** 0 for the single tabbable option, -1 for every other one. */
  tabIndexFor: (index: number) => 0 | -1;
  registerOption: (index: number, node: HTMLElement | null) => void;
  /** Index of the tabbable option, or -1 when every option is disabled. */
  activeIndex: number;
}

/**
 * `direction` is an inherited CSS property, so a computed read already accounts
 * for a `dir` attribute on any ancestor and for direction set by a stylesheet.
 * The document root is only the last resort.
 */
function readRTL(container: HTMLElement | null): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (container && typeof window.getComputedStyle === 'function') {
    try {
      return window.getComputedStyle(container).direction === 'rtl';
    } catch {
      // Detached or mid-unmount node: fall through to the root direction.
    }
  }
  return document.documentElement.dir === 'rtl';
}

/**
 * Implements the WAI-ARIA radiogroup keyboard contract once, so every segmented
 * control in the app behaves identically: exactly one option is tabbable,
 * arrows move the selection *and* the focus, Home/End jump to the ends, and the
 * horizontal arrows follow the writing direction.
 *
 * Direction is read inside the key handler rather than during render so it is
 * always current without subscribing to `dir` changes.
 */
export function useRovingRadioGroup<T extends string | number>({
  items,
  value,
  onChange,
  dir
}: UseRovingRadioGroupOptions<T>): RovingRadioGroup {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLElement | null)[]>([]);

  const selectedIndex = items.findIndex((item) => item.value === value);
  // Roving tabindex needs exactly one entry point. Fall back to the first
  // enabled option when the value is missing from `items` or points at a
  // disabled one, so the group can never become unreachable by Tab.
  const activeIndex =
    selectedIndex >= 0 && !items[selectedIndex].disabled ? selectedIndex : firstEnabledIndex(items);

  const registerOption = useCallback((index: number, node: HTMLElement | null) => {
    optionRefs.current[index] = node;
  }, []);

  const tabIndexFor = useCallback(
    (index: number) => (index === activeIndex ? 0 : -1) as 0 | -1,
    [activeIndex]
  );

  const selectAndFocus = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      onChange(item.value);
      // Safe to focus synchronously: React keeps the same node for a given key,
      // so the ref still points at the button after the re-render.
      optionRefs.current[index]?.focus();
    },
    [items, onChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const rtl = dir ? dir === 'rtl' : readRTL(event.currentTarget);
      const target = resolveRovingTarget({ key: event.key, items, activeIndex, rtl });
      if (target === null) return;
      event.preventDefault();
      if (target === activeIndex) optionRefs.current[target]?.focus();
      else selectAndFocus(target);
    },
    [activeIndex, dir, items, selectAndFocus]
  );

  return { containerRef, handleKeyDown, tabIndexFor, registerOption, activeIndex };
}
