import { describe, expect, it } from 'vitest';
import {
  CATALOG_EXERCISES,
  filterCatalog,
  MUSCLE_GROUPS
} from '../exerciseCatalog';

describe('exerciseCatalog', () => {
  it('exposes a comprehensive list of catalog exercises across major muscle groups', () => {
    expect(CATALOG_EXERCISES.length).toBeGreaterThanOrEqual(25);
    for (const item of CATALOG_EXERCISES) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.nameAr).toBeTruthy();
      expect(item.muscle).toBeTruthy();
      expect(item.defaultSets).toBeGreaterThan(0);
      expect(item.defaultReps).toBeGreaterThan(0);
      expect(item.restTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('contains expected muscle categories', () => {
    expect(MUSCLE_GROUPS).toContain('All');
    expect(MUSCLE_GROUPS).toContain('Chest');
    expect(MUSCLE_GROUPS).toContain('Back');
    expect(MUSCLE_GROUPS).toContain('Legs');
    expect(MUSCLE_GROUPS).toContain('Shoulders');
    expect(MUSCLE_GROUPS).toContain('Biceps');
    expect(MUSCLE_GROUPS).toContain('Triceps');
    expect(MUSCLE_GROUPS).toContain('Core');
    expect(MUSCLE_GROUPS).toContain('Cardio');
  });

  it('filters catalog exercises by query and muscle category accurately', () => {
    const chestAll = filterCatalog('', 'Chest');
    expect(chestAll.length).toBeGreaterThan(0);
    expect(chestAll.every(e => e.muscle === 'Chest')).toBe(true);

    const benchPressResults = filterCatalog('bench', 'All');
    expect(benchPressResults.some(e => e.name.toLowerCase().includes('bench'))).toBe(true);

    const arabicMatch = filterCatalog('سكوات', 'All');
    expect(arabicMatch.some(e => e.nameAr.includes('سكوات'))).toBe(true);

    const emptyResult = filterCatalog('xyznonexistent12345', 'All');
    expect(emptyResult).toHaveLength(0);
  });
});
