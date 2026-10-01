import { describe, it, expect, vi } from 'vitest';
import { sanitizeAIContext, TOOLS, normalizeActionCards } from '../useAI';

// `sanitizeAIContext` is a pure function, but it lives in the hook module, so
// the two side-effecting imports below have to be stubbed out for the suite to
// load it in vitest's `node` environment.
vi.mock('../../lib/gemini', () => ({
  callWithModelFallback: vi.fn(),
  getAIClient: vi.fn()
}));
vi.mock('../../lib/firebase', () => ({ auth: { currentUser: null }, db: null, app: null, functions: null }));

const EMAIL = 'ahmad.alrashid@acmecorp.example.com';
const NAME = 'Ahmad Alrashid';

function athleteData(overrides: Record<string, unknown> = {}) {
  return {
    user: { email: EMAIL, name: NAME, pfp: 'https://cdn.example.com/avatars/ahmad.png' },
    settings: {
      weightUnit: 'kg',
      language: 'ar',
      restTimerSeconds: 90,
      theme: 'dark',
      workoutReminderTime: '18:00',
      warmTint: 'auto',
      fontScale: 'large',
      highContrast: true,
      athlete: { goal: 'hypertrophy', level: 'intermediate', equipment: 'full_gym', daysPerWeek: 4 }
    },
    bodyMetrics: [
      { id: 'b1', date: '2026-09-01', weight: 81.4, unit: 'kg', bodyFat: 14.2, waist: 84, chest: 103, arms: 38 }
    ],
    sessions: [{ id: 's1', title: 'Push Day', date: '2026-09-01', duration: 60, type: 'Strength', isCompleted: true, exercises: [{}, {}] }],
    routines: [],
    history: [],
    meals: [],
    ...overrides
  };
}

describe('sanitizeAIContext', () => {
  it('never sends the email address or the display name to the model', () => {
    const serialized = JSON.stringify(sanitizeAIContext(athleteData()));

    expect(serialized).not.toContain(EMAIL);
    expect(serialized).not.toContain('ahmad.alrashid');
    expect(serialized).not.toContain(NAME);
    // The domain identifies a work account just as well as the address does.
    expect(serialized).not.toContain('acmecorp');
    expect(serialized).not.toContain('example.com');
  });

  it('replaces the identity with a stable, opaque account handle', () => {
    const first: any = sanitizeAIContext(athleteData());
    const same: any = sanitizeAIContext(athleteData());
    const other: any = sanitizeAIContext(
      athleteData({ user: { email: 'someone.else@gmail.com', name: 'Someone Else' } })
    );

    expect(first.user.accountRef).toMatch(/^athlete_[0-9a-f]{8}$/);
    expect(first.user.accountRef).not.toContain('@');
    // Stable across requests, so the assistant keeps one handle per athlete.
    expect(same.user.accountRef).toBe(first.user.accountRef);
    expect(other.user.accountRef).not.toBe(first.user.accountRef);
  });

  it('omits the account handle entirely for a guest with no email', () => {
    expect(sanitizeAIContext(athleteData({ user: undefined })).user).toBeUndefined();
    expect(sanitizeAIContext(athleteData({ user: { email: '' } })).user).toBeUndefined();
  });

  it('keeps only the settings the assistant needs', () => {
    const { settings } = sanitizeAIContext(athleteData()) as any;

    expect(Object.keys(settings).sort()).toEqual(['language', 'weightUnit']);
    expect(settings).toEqual({ weightUnit: 'kg', language: 'ar' });
  });

  it('does not spread settings keys added to UserSettings later', () => {
    const { settings } = sanitizeAIContext(
      athleteData({ settings: { weightUnit: 'lb', language: 'en', someFuturePreference: 'secret' } })
    ) as any;

    expect(settings).toEqual({ weightUnit: 'lb', language: 'en' });
    expect(settings).not.toHaveProperty('someFuturePreference');
  });

  it('never sends body measurements', () => {
    const serialized = JSON.stringify(sanitizeAIContext(athleteData()));

    expect(serialized).not.toContain('bodyMetrics');
    for (const value of ['81.4', '14.2', 'bodyFat', 'waist', 'chest', 'arms']) {
      expect(serialized).not.toContain(value);
    }
  });

  it('keeps the training context the assistant actually reasons over', () => {
    const context: any = sanitizeAIContext(athleteData());

    expect(context.sessions).toHaveLength(1);
    expect(context.sessions[0]).toEqual({
      id: 's1',
      title: 'Push Day',
      date: '2026-09-01',
      duration: 60,
      type: 'Strength',
      isCompleted: true,
      exerciseCount: 2
    });
  });

  it('survives a missing or malformed athlete document', () => {
    expect(sanitizeAIContext(null)).toEqual({});
    expect(sanitizeAIContext('nope')).toEqual({});
    expect(sanitizeAIContext({ sessions: 'not-an-array', settings: null }).sessions).toEqual([]);
  });
});

function toolNames() {
  return TOOLS.flatMap((group: any) => group.functionDeclarations.map((fn: any) => fn.name as string));
}

function toolByName(name: string) {
  const declaration = TOOLS.flatMap((group: any) => group.functionDeclarations).find((fn: any) => fn.name === name);
  expect(declaration, `tool "${name}" should be declared`).toBeDefined();
  return declaration as any;
}

describe('assistant tool permissions', () => {
  // The bug these pin: the model could call a destructive tool and the handler
  // ran the write itself, so a misbehaving or injected reply deleted or closed
  // a session with no tap and no prompt from the athlete.
  it('never offers the model a way to delete anything', () => {
    for (const name of toolNames()) {
      expect(name).not.toMatch(/delete|remove|destroy|reset|clear|cancel/);
    }
    expect(toolNames()).not.toContain('delete_workout_session');
  });

  it('does not complete a session without the user approving it first', () => {
    // Still offered - the athlete legitimately asks for this - but described as
    // a request that renders a confirmation card rather than a write.
    const declaration = toolByName('complete_workout_session');

    expect(declaration.description).toMatch(/does NOT change anything/i);
    expect(declaration.description).toMatch(/confirmation card/i);
    expect(declaration.description).toMatch(/after they confirm/i);
  });

  it('only asks for a completion on a session that actually exists', () => {
    // Guards the handler's precondition: an id the model invented must not be
    // able to resolve into a write.
    expect(toolByName('complete_workout_session').parameters.required).toEqual(['sessionId']);
  });
});

describe('normalizeActionCards', () => {
  it('wraps the single-card shape written by older builds', () => {
    const card = { type: 'confirmation_required', data: { actionId: 'act_1', status: 'pending' } };

    expect(normalizeActionCards(card)).toEqual([card]);
  });

  it('passes a card list through unchanged', () => {
    const cards = [
      { type: 'workout_scheduled', data: { sessionId: 's1' } },
      { type: 'confirmation_required', data: { actionId: 'act_1', status: 'pending' } }
    ];

    expect(normalizeActionCards(cards)).toBe(cards);
  });

  it('yields no cards for anything unusable', () => {
    expect(normalizeActionCards(undefined)).toEqual([]);
    expect(normalizeActionCards(null)).toEqual([]);
    expect(normalizeActionCards('actionCard')).toEqual([]);
    expect(normalizeActionCards(42)).toEqual([]);
  });
});
