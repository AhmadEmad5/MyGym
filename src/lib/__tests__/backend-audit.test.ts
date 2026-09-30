import { describe, it, expect, beforeEach } from 'vitest';
import {
  api,
  computeAllPersonalRecords,
  normalizeSettings,
  normalizeAthleteProfile,
  type AppData,
  type HistoryRecord,
  type MealRecord,
  type SessionExercise,
  type WorkoutSession,
} from '../api';
import { validateClientFile, ALLOWED_IMAGE_MIME_TYPES } from '../fileValidation';

// The suite runs in vitest's `node` environment (no jsdom in this project), so
// stand in a minimal localStorage. It also lets the offline-first mirror write
// be asserted instead of only the validation that runs before it.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

function readMirror(): AppData {
  return JSON.parse(storage.getItem('gym_data') || '{}') as AppData;
}

function makeSet(weight: number, reps: number, unit: 'lb' | 'kg') {
  return { id: `set-${weight}-${unit}`, weight, repsTarget: reps, repsActual: reps, unit, isCompleted: true };
}

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'sess-1',
    title: 'Push Day',
    date: '2026-01-05T10:00:00.000Z',
    duration: 60,
    type: 'strength',
    notes: '',
    isCompleted: true,
    exercises: [],
    ...overrides,
  };
}

function makeHistory(id: string, sessionId: string, title: string, date: string, exercises: SessionExercise[]): HistoryRecord {
  return { id, sessionId, date, title, snapshot: makeSession({ id: sessionId, title, date, exercises }) };
}

describe('computeAllPersonalRecords', () => {
  it('ranks a heavier kilogram set above a numerically similar pound set', () => {
    // 100 kg must beat 100 lb (45 kg) even though the raw numbers are equal.
    const kg = makeHistory('h1', 's1', 'Kg day', '2026-01-01T00:00:00.000Z', [
      { id: 'e1', name: 'Bench Press', targetMuscle: 'Chest', restTime: 90, notes: '', sets: [makeSet(100, 5, 'kg')] },
    ]);
    const lb = makeHistory('h2', 's2', 'Lb day', '2026-02-01T00:00:00.000Z', [
      { id: 'e2', name: 'bench press', targetMuscle: 'Chest', restTime: 90, notes: '', sets: [makeSet(100, 5, 'lb')] },
    ]);

    const records = computeAllPersonalRecords([kg, lb]);
    const record = records['bench press'];

    expect(record.unit).toBe('kg');
    expect(record.maxWeight).toBe(100);
    expect(record.date).toBe('2026-01-01T00:00:00.000Z');
  });

  it('still reports a pound record when no kilogram set exists', () => {
    const lb = makeHistory('h1', 's1', 'Lb day', '2026-02-01T00:00:00.000Z', [
      { id: 'e1', name: 'Squat', targetMuscle: 'Legs', restTime: 90, notes: '', sets: [makeSet(225, 1, 'lb')] },
    ]);
    const records = computeAllPersonalRecords([lb]);
    expect(records.squat).toMatchObject({ maxWeight: 225, unit: 'lb', estimated1RM: 225, reps: 1 });
  });

  it('stores a record for an exercise literally named __proto__ without touching the prototype', () => {
    const tricky = makeHistory('h1', 's1', 'Tricky', '2026-01-01T00:00:00.000Z', [
      { id: 'e1', name: '__proto__', targetMuscle: 'Chest', restTime: 90, notes: '', sets: [makeSet(60, 5, 'kg')] },
    ]);
    const records = computeAllPersonalRecords([tricky]);

    expect(Object.getPrototypeOf(records)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(records, '__proto__')).toBe(true);
    expect(records['__proto__'].maxWeight).toBe(60);
  });

  it('records an exercise named "constructor" instead of reading Object.prototype', () => {
    const tricky = makeHistory('h1', 's1', 'Tricky', '2026-01-01T00:00:00.000Z', [
      { id: 'e1', name: 'constructor', targetMuscle: 'Chest', restTime: 90, notes: '', sets: [makeSet(40, 5, 'kg')] },
    ]);
    const records = computeAllPersonalRecords([tricky]);
    expect(records.constructor).toMatchObject({ exerciseName: 'constructor', maxWeight: 40 });
  });
});

describe('normalizeSettings / normalizeAthleteProfile', () => {
  it('keeps repairing stored data on the read path', () => {
    const settings = normalizeSettings({ theme: 'neon', athlete: { goal: 'nonsense', daysPerWeek: 99 } });
    expect(settings.theme).toBe('neon');
    expect(settings.athlete).toEqual({ goal: 'general', level: 'beginner', equipment: 'full_gym', daysPerWeek: 3 });
    expect(settings.weightUnit).toBe('lb');
  });

  it('does not invent an athlete profile when the stored settings have none', () => {
    expect('athlete' in normalizeSettings({ theme: 'dark' })).toBe(false);
  });

  it('drops a non-object profile instead of throwing', () => {
    expect(normalizeAthleteProfile(null)).toEqual({
      goal: 'general',
      level: 'beginner',
      equipment: 'full_gym',
      daysPerWeek: 3,
    });
  });
});

describe('write validation matches the Firestore rules', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('accepts a session the rules accept and mirrors it locally', async () => {
    await expect(api.saveSession(makeSession({ title: 'a'.repeat(150) }))).resolves.toBeUndefined();
    expect(readMirror().sessions.map(s => s.id)).toEqual(['sess-1']);
  });

  it('rejects a session title longer than the rules allow instead of failing silently in the cloud', async () => {
    await expect(api.saveSession(makeSession({ title: 'a'.repeat(151) }))).rejects.toThrow(/150/);
  });

  it('rejects an identifier containing a path separator', async () => {
    await expect(api.saveSession(makeSession({ id: 'sess/1' }))).rejects.toThrow(/identifier/);
  });

  it('rejects a missing workout type', async () => {
    await expect(api.saveSession(makeSession({ type: undefined as unknown as string }))).rejects.toThrow(/type/);
  });

  it('rejects oversized notes', async () => {
    await expect(api.saveSession(makeSession({ notes: 'n'.repeat(3001) }))).rejects.toThrow(/notes/);
  });

  it('rejects more exercises than the rules allow', async () => {
    const exercises: SessionExercise[] = Array.from({ length: 61 }, (_, i) => ({
      id: `e${i}`, name: 'Squat', targetMuscle: 'Legs', restTime: 90, notes: '', sets: [],
    }));
    await expect(api.saveSession(makeSession({ exercises }))).rejects.toThrow(/60 exercises/);
  });

  it('rejects an exercise whose sets are not a list', async () => {
    const exercises = [{ id: 'e1', name: 'Squat', targetMuscle: 'Legs', restTime: 90, notes: '', sets: 'nope' }] as unknown as SessionExercise[];
    await expect(api.saveSession(makeSession({ exercises }))).rejects.toThrow(/list of sets/);
  });

  const meal = (overrides: Partial<MealRecord> = {}): MealRecord => ({
    id: 'meal-1',
    date: '2026-01-05T10:00:00.000Z',
    mealType: 'lunch',
    title: 'Chicken bowl',
    calories: 600,
    protein: 50,
    carbs: 60,
    fats: 20,
    ...overrides,
  });

  it('accepts a valid meal', async () => {
    await expect(api.saveMeal(meal())).resolves.toBeUndefined();
  });

  it('rejects a meal type the rules do not allow', async () => {
    await expect(api.saveMeal(meal({ mealType: 'brunch' as MealRecord['mealType'] }))).rejects.toThrow(/Meal type/);
  });

  it('rejects macros above the rules limit', async () => {
    await expect(api.saveMeal(meal({ calories: 25001 }))).rejects.toThrow(/calories/);
    await expect(api.saveMeal(meal({ protein: 1001 }))).rejects.toThrow(/protein/);
  });

  it('rejects a history record the rules would reject', async () => {
    const base = makeHistory('hist-1', 'sess-1', 'Push Day', '2026-01-05T10:00:00.000Z', []);
    await expect(api.saveHistory({ ...base, sessionId: 's'.repeat(101) })).rejects.toThrow(/History session/);
    await expect(api.saveHistory({ ...base, title: 't'.repeat(151) })).rejects.toThrow(/History title/);
    await expect(api.saveHistory({ ...base, date: 'not-a-date' })).rejects.toThrow(/History date/);
  });
});

describe('offline mirror', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('records a body metric without a second localStorage round trip losing earlier entries', async () => {
    await api.saveBodyMetric({ id: 'bm-1', date: '2026-01-01T00:00:00.000Z', weight: 80, unit: 'kg' });
    await api.saveBodyMetric({ id: 'bm-2', date: '2026-01-08T00:00:00.000Z', weight: 79, unit: 'kg' });

    expect(readMirror().bodyMetrics?.map(m => m.id)).toEqual(['bm-2', 'bm-1']);
  });

  it('replaces a body metric with the same id instead of duplicating it', async () => {
    await api.saveBodyMetric({ id: 'bm-1', date: '2026-01-01T00:00:00.000Z', weight: 80, unit: 'kg' });
    await api.saveBodyMetric({ id: 'bm-1', date: '2026-01-01T00:00:00.000Z', weight: 78, unit: 'kg' });

    const metrics = readMirror().bodyMetrics || [];
    expect(metrics).toHaveLength(1);
    expect(metrics[0].weight).toBe(78);
  });

  it('keeps the water total for a day', async () => {
    await api.logWater('2026-03-04', 750);
    expect(readMirror().waterLogs).toEqual({ '2026-03-04': 750 });
  });

  it('rejects a malformed water date key', async () => {
    await expect(api.logWater('04-03-2026', 500)).rejects.toThrow(/YYYY-MM-DD/);
  });

  it('updates a session in place instead of appending a duplicate', async () => {
    await api.saveSession(makeSession({ title: 'Push Day' }));
    await api.saveSession(makeSession({ title: 'Push Day B' }));
    expect(readMirror().sessions).toHaveLength(1);
    expect(readMirror().sessions[0].title).toBe('Push Day B');
  });
});

describe('importAllData', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('drops unusable history entries and keeps the valid ones', async () => {
    const result = await api.importAllData({
      history: [
        makeHistory('hist-1', 'sess-1', 'Push Day', '2026-01-05T10:00:00.000Z', []),
        { id: 'hist-2', sessionId: '', date: 'nope', title: '' } as unknown as HistoryRecord,
        null as unknown as HistoryRecord,
      ],
    } as unknown as AppData);

    expect(result.history.map(h => h.id)).toEqual(['hist-1']);
  });

  it('keeps only well-formed water log entries', async () => {
    const result = await api.importAllData({
      waterLogs: { '2026-03-04': 1500, 'yesterday': 900, '2026-03-05': -20, '2026-03-06': 'lots' },
    } as unknown as AppData);

    expect(result.waterLogs).toEqual({ '2026-03-04': 1500 });
  });

  it('rejects a non-object payload', async () => {
    await expect(api.importAllData(null as unknown as AppData)).rejects.toThrow(/Invalid backup file format/);
  });

  it('never lets a reserved key reach the stored mirror', async () => {
    const result = await api.importAllData(JSON.parse('{"waterLogs":{"__proto__":{"polluted":true},"2026-03-04":10}}'));
    expect(Object.getPrototypeOf(result.waterLogs)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(readMirror().waterLogs).toEqual({ '2026-03-04': 10 });
  });
});

describe('validateClientFile', () => {
  const png = { size: 1024, type: 'image/png' } as File;

  it('rejects a disallowed image type', () => {
    const result = validateClientFile({ size: 1024, type: 'application/pdf' } as File, {
      maxSizeBytes: 2048,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects a file above the size limit', () => {
    const result = validateClientFile({ size: 4096, type: 'image/png' } as File, {
      maxSizeBytes: 2048,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('treats a "*/*" allowlist as "everything allowed" instead of rejecting everything', () => {
    expect(validateClientFile(png, { maxSizeBytes: 2048, allowedMimeTypes: ['*/*'] }).valid).toBe(true);
  });

  it('still supports a "type/*" wildcard', () => {
    expect(validateClientFile(png, { maxSizeBytes: 2048, allowedMimeTypes: ['image/*'] }).valid).toBe(true);
    expect(validateClientFile(png, { maxSizeBytes: 2048, allowedMimeTypes: ['video/*'] }).valid).toBe(false);
  });
});
