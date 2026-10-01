import { describe, it, expect } from 'vitest';
import { DEFAULT_NUTRITION_TARGETS } from '../api';
import { resolveDailyTargets } from '../selectors';

/**
 * The Today screen and NutritionView both resolve their four macro targets
 * through here, so these fallbacks are load-bearing for the `0` case: a target
 * explicitly stored as zero should resolve to the app-wide default rather than
 * render "0 kcal" as a goal.
 */
const FALLBACK = DEFAULT_NUTRITION_TARGETS;

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

  it('falls back to the shared default when the whole goal block is missing', () => {
    expect(resolveDailyTargets(undefined)).toEqual(FALLBACK);
    expect(resolveDailyTargets(null)).toEqual(FALLBACK);
  });

  it('falls back per field for a partial block', () => {
    expect(resolveDailyTargets({ dailyCalories: 2400 })).toEqual({
      calories: 2400,
      protein: FALLBACK.protein,
      carbs: FALLBACK.carbs,
      fats: FALLBACK.fats,
    });
  });

  it('treats a zero target as unset rather than as a goal of zero', () => {
    expect(resolveDailyTargets({ dailyCalories: 0, dailyFats: 0 })).toEqual({
      calories: FALLBACK.calories,
      protein: FALLBACK.protein,
      carbs: FALLBACK.carbs,
      fats: FALLBACK.fats,
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
