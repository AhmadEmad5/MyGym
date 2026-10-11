import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REST_DAY,
  REST_DAY_KEYS,
  closedDayOffset,
  isRestDay,
  normalizeRestDay,
  restDayIndex,
  restDayName
} from '../restDay';
import { buildScheduleDays } from '../../components/routines/data';

// 2026-01-04 is a Sunday and 2026-01-03 the Saturday before it.
const dayAt = (offset: number) => new Date(2026, 0, 4 + offset);
const saturdayAt = (offset: number) => new Date(2026, 0, 3 + offset);

describe('normalizeRestDay', () => {
  it('defaults to Friday for the MENA region', () => {
    expect(DEFAULT_REST_DAY).toBe('friday');
    expect(normalizeRestDay(undefined)).toBe('friday');
    expect(normalizeRestDay(null)).toBe('friday');
    expect(normalizeRestDay('')).toBe('friday');
    expect(normalizeRestDay('not-a-day')).toBe('friday');
  });

  it('accepts a stored weekday key in any casing or spacing', () => {
    expect(normalizeRestDay('sunday')).toBe('sunday');
    expect(normalizeRestDay('  Tuesday ')).toBe('tuesday');
    expect(normalizeRestDay('SATURDAY')).toBe('saturday');
  });

  it('accepts the legacy 0..6 Date.getDay() index', () => {
    REST_DAY_KEYS.forEach((key, index) => {
      expect(normalizeRestDay(index)).toBe(key);
    });
    expect(normalizeRestDay(9)).toBe('friday');
    expect(normalizeRestDay(2.5)).toBe('friday');
  });
});

describe('restDayIndex', () => {
  it('maps a key onto the Date.getDay() index', () => {
    expect(restDayIndex({ restDay: 'sunday' })).toBe(0);
    expect(restDayIndex({ restDay: 'friday' })).toBe(5);
    expect(restDayIndex({ restDay: 'saturday' })).toBe(6);
  });

  it('falls back to Friday when the setting is missing', () => {
    expect(restDayIndex(undefined)).toBe(5);
    expect(restDayIndex(null)).toBe(5);
    expect(restDayIndex({})).toBe(5);
  });
});

describe('isRestDay', () => {
  it('only matches the configured closure day', () => {
    const friday = dayAt(5);
    expect(isRestDay(friday, { restDay: 'friday' })).toBe(true);
    expect(isRestDay(friday, { restDay: 'sunday' })).toBe(false);
    expect(isRestDay(dayAt(6), { restDay: 'friday' })).toBe(false);
  });

  it('accepts the string forms sessions are stored with', () => {
    expect(isRestDay('2026-01-09', { restDay: 'friday' })).toBe(true);
    expect(isRestDay('2026-01-08', { restDay: 'friday' })).toBe(false);
  });

  it('treats an unparseable date as not a rest day instead of throwing', () => {
    expect(isRestDay('not-a-date', { restDay: 'friday' })).toBe(false);
  });
});

describe('closedDayOffset', () => {
  it('converts the closure day into a Saturday-first week offset', () => {
    expect(closedDayOffset({ restDay: 'saturday' })).toBe(0);
    expect(closedDayOffset({ restDay: 'sunday' })).toBe(1);
    expect(closedDayOffset({ restDay: 'friday' })).toBe(6);
  });
});

describe('buildScheduleDays', () => {
  it('always produces seven Saturday-first slots', () => {
    const days = buildScheduleDays({ restDay: 'friday' });
    expect(days.map(day => day.value)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(days[0].shortEn).toBe('Sat');
    expect(days[6].shortEn).toBe('Fri');
  });

  it('locks the configured rest day and no other', () => {
    const closed = buildScheduleDays({ restDay: 'sunday' }).filter(day => day.isClosed);
    expect(closed).toHaveLength(1);
    expect(closed[0].shortEn).toBe('Sun');
    expect(closed[0].labelEn).toContain('Gym Closed');
  });

  it('moves the lock when the setting changes', () => {
    // Saturday = 0 ... Friday = 6.
    expect(buildScheduleDays({ restDay: 'friday' }).find(day => day.isClosed)?.value).toBe(6);
    expect(buildScheduleDays({ restDay: 'monday' }).find(day => day.isClosed)?.value).toBe(2);
    expect(buildScheduleDays({ restDay: 'saturday' }).find(day => day.isClosed)?.value).toBe(0);
    expect(buildScheduleDays(undefined).find(day => day.isClosed)?.value).toBe(6);
  });
});

describe('restDayName', () => {
  it('renders the closure day in the active language', () => {
    expect(restDayName({ restDay: 'friday' }, false)).toBe('Friday');
    expect(restDayName({ restDay: 'friday' }, true)).toBe('الجمعة');
    expect(restDayName({ restDay: 'saturday' }, false)).toBe('Saturday');
  });
});

describe('the closure day lines up with the schedule slots', () => {
  it('locks the slot that lands on the configured weekday', () => {
    REST_DAY_KEYS.forEach((key) => {
      const offset = buildScheduleDays({ restDay: key }).find(day => day.isClosed)!.value;
      // The scheduler adds this offset to the Saturday that starts the week,
      // so the locked slot must be the same real date the closure check reads.
      expect(isRestDay(saturdayAt(offset), { restDay: key })).toBe(true);
    });
    expect(saturdayAt(0).getDay()).toBe(6);
  });
});