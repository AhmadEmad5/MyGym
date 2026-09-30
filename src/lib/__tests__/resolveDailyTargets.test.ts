import { describe, it, expect } from 'vitest';
import { resolveDailyTargets } from '../selectors';

/**
 * The Today screen renders four macro targets in two places. The fallbacks
 * below are load-bearing for the `0` case: a target explicitly stored as zero
 * should resolve to the default rather than render "0 kcal" as a goal.
 */
describe('resolveDailyTargets', () => {
  it('passes through stored targets unchanged', () => {
    expect(
      resolveDailyTargets({
        dailyCalories: 2400,
        dailyProtein: 180,
        dailyCarbs: 250,
        dailyFats: 70,
      })
    ).toEqual({ calories: 2400, protein: 180, carbs: 250, fats: 70 });
  });

  it('falls back when the whole goal block is missing', () => {
    expect(resolveDailyTargets(undefined)).toEqual({ calories: 2154, protein: 162, carbs: 242, fats: 60 });
    expect(resolveDailyTargets(null)).toEqual({ calories: 2154, protein: 162, carbs: 242, fats: 60 });
  });

  it('falls back per field for a partial block', () => {
    expect(resolveDailyTargets({ dailyCalories: 2400 })).toEqual({
      calories: 2400,
      protein: 162,
      carbs: 242,
      fats: 60,
    });
  });

  it('treats a zero target as unset rather than as a goal of zero', () => {
    expect(resolveDailyTargets({ dailyCalories: 0, dailyFats: 0 })).toEqual({
      calories: 2154,
      protein: 162,
      carbs: 242,
      fats: 60,
    });
  });

  it('never returns undefined or NaN for a sparse block', () => {
    const resolved = resolveDailyTargets({ dailyProtein: 150 });
    for (const value of Object.values(resolved)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it('is stable across calls for the same input', () => {
    const goals = { dailyCalories: 2000, dailyProtein: 150 };
    expect(resolveDailyTargets(goals)).toEqual(resolveDailyTargets(goals));
  });
});
