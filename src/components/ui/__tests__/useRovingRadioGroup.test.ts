import { describe, expect, it } from 'vitest';
import {
  firstEnabledIndex,
  lastEnabledIndex,
  resolveRovingTarget,
  stepEnabledIndex,
  type RovingOption
} from '../useRovingRadioGroup';

const opts = (count: number, disabled: number[] = []): RovingOption[] =>
  Array.from({ length: count }, (_, index) => (disabled.includes(index) ? { disabled: true } : {}));

describe('resolveRovingTarget', () => {
  describe('direction', () => {
    it('moves forward on ArrowRight and back on ArrowLeft in ltr', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3), activeIndex: 0, rtl: false })).toBe(1);
      expect(resolveRovingTarget({ key: 'ArrowLeft', items: opts(3), activeIndex: 1, rtl: false })).toBe(0);
    });

    it('mirrors the horizontal arrows in rtl so they always point at the next segment', () => {
      expect(resolveRovingTarget({ key: 'ArrowLeft', items: opts(3), activeIndex: 0, rtl: true })).toBe(1);
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3), activeIndex: 1, rtl: true })).toBe(0);
    });

    it('wraps around at both ends', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3), activeIndex: 2, rtl: false })).toBe(0);
      expect(resolveRovingTarget({ key: 'ArrowLeft', items: opts(3), activeIndex: 0, rtl: false })).toBe(2);
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3), activeIndex: 2, rtl: true })).toBe(1);
      expect(resolveRovingTarget({ key: 'ArrowLeft', items: opts(3), activeIndex: 0, rtl: true })).toBe(1);
    });

    it('keeps the vertical arrows direction-independent', () => {
      expect(resolveRovingTarget({ key: 'ArrowDown', items: opts(3), activeIndex: 0, rtl: true })).toBe(1);
      expect(resolveRovingTarget({ key: 'ArrowUp', items: opts(3), activeIndex: 2, rtl: false })).toBe(1);
    });
  });

  describe('home and end', () => {
    it('jumps to the first and last enabled option', () => {
      expect(resolveRovingTarget({ key: 'Home', items: opts(4, [0, 1]), activeIndex: 3, rtl: false })).toBe(2);
      expect(resolveRovingTarget({ key: 'End', items: opts(4, [2, 3]), activeIndex: 0, rtl: false })).toBe(1);
    });
  });

  describe('disabled options', () => {
    it('skips disabled options instead of stopping on them', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(4, [1]), activeIndex: 0, rtl: false })).toBe(2);
      expect(resolveRovingTarget({ key: 'ArrowLeft', items: opts(4, [1]), activeIndex: 2, rtl: false })).toBe(0);
    });

    it('stays put when the current option is the only enabled one', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3, [1, 2]), activeIndex: 0, rtl: false })).toBe(0);
    });

    it('returns null when nothing is enabled at all', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(3, [0, 1, 2]), activeIndex: 0, rtl: false })).toBeNull();
      expect(resolveRovingTarget({ key: 'Home', items: opts(3, [0, 1, 2]), activeIndex: 0, rtl: false })).toBeNull();
      expect(resolveRovingTarget({ key: 'End', items: opts(3, [0, 1, 2]), activeIndex: 0, rtl: false })).toBeNull();
    });
  });

  describe('unhandled input', () => {
    it('ignores keys the group does not own so the browser keeps them', () => {
      for (const key of ['Enter', ' ', 'Spacebar', 'Tab', 'a', 'Escape', 'ArrowUpLeft']) {
        expect(resolveRovingTarget({ key, items: opts(3), activeIndex: 0, rtl: false })).toBeNull();
      }
    });

    it('returns null when the group has no reachable option', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(2, [0, 1]), activeIndex: -1, rtl: false })).toBeNull();
      expect(resolveRovingTarget({ key: 'Home', items: [], activeIndex: -1, rtl: false })).toBeNull();
    });

    it('returns null for an activeIndex outside the option list', () => {
      expect(resolveRovingTarget({ key: 'ArrowRight', items: opts(2), activeIndex: 7, rtl: false })).toBeNull();
    });
  });
});

describe('enabled option helpers', () => {
  it('reports the first and last enabled option', () => {
    const items = opts(4, [0, 2]);
    expect(firstEnabledIndex(items)).toBe(1);
    expect(lastEnabledIndex(items)).toBe(3);
    expect(firstEnabledIndex(opts(3, [0, 1, 2]))).toBe(-1);
    expect(lastEnabledIndex(opts(3, [0, 1, 2]))).toBe(-1);
    expect(firstEnabledIndex([])).toBe(-1);
  });

  it('steps past disabled options in either direction and wraps once', () => {
    const items = opts(5, [1, 3]);
    expect(stepEnabledIndex(items, 0, 1)).toBe(2);
    expect(stepEnabledIndex(items, 4, 1)).toBe(0);
    expect(stepEnabledIndex(items, 2, -1)).toBe(0);
    expect(stepEnabledIndex(items, 0, -1)).toBe(4);
  });
});
