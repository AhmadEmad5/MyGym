/**
 * The gym's weekly closure day.
 *
 * Stored as a lowercase weekday key so the value stays readable in Firestore,
 * in exported backups and in the settings form, and stays locale independent.
 * `normalizeRestDay` also accepts a 0..6 index so older/imported payloads that
 * stored the raw `Date.getDay()` number still load.
 *
 * Every closure check in the app goes through `isRestDay` (dates) or
 * `closedDayOffset` (schedule offsets) instead of comparing `getDay() === 5`,
 * so changing the setting moves the notices, blocks and generated schedules
 * with it. The MENA default is Friday; DEFAULT_SETTINGS seeds it for everyone.
 */

export const REST_DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export type RestDayKey = (typeof REST_DAY_KEYS)[number];

export const DEFAULT_REST_DAY: RestDayKey = 'friday';

export const REST_DAY_LABELS: Record<
  RestDayKey,
  { labelEn: string; labelAr: string; shortEn: string; shortAr: string }
> = {
  sunday: { labelEn: 'Sunday', labelAr: 'الأحد', shortEn: 'Sun', shortAr: 'الأحد' },
  monday: { labelEn: 'Monday', labelAr: 'الاثنين', shortEn: 'Mon', shortAr: 'الاثنين' },
  tuesday: { labelEn: 'Tuesday', labelAr: 'الثلاثاء', shortEn: 'Tue', shortAr: 'الثلاثاء' },
  wednesday: { labelEn: 'Wednesday', labelAr: 'الأربعاء', shortEn: 'Wed', shortAr: 'الأربعاء' },
  thursday: { labelEn: 'Thursday', labelAr: 'الخميس', shortEn: 'Thu', shortAr: 'الخميس' },
  friday: { labelEn: 'Friday', labelAr: 'الجمعة', shortEn: 'Fri', shortAr: 'الجمعة' },
  saturday: { labelEn: 'Saturday', labelAr: 'السبت', shortEn: 'Sat', shortAr: 'السبت' }
};

/**
 * Anything carrying the setting. Kept structural instead of importing
 * `UserSettings` so this module stays dependency-free and `lib/api` can import
 * it without an import cycle.
 */
export type RestDaySource =
  | { restDay?: RestDayKey | string | number | null }
  | null
  | undefined;

export function normalizeRestDay(raw: unknown): RestDayKey {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= REST_DAY_KEYS.length - 1) {
    return REST_DAY_KEYS[raw];
  }
  if (typeof raw === 'string') {
    const key = raw.trim().toLowerCase();
    if ((REST_DAY_KEYS as readonly string[]).includes(key)) return key as RestDayKey;
  }
  return DEFAULT_REST_DAY;
}

/** The configured closure day as a `Date.getDay()` index (0 = Sunday). */
export function restDayIndex(settings?: RestDaySource): number {
  return REST_DAY_KEYS.indexOf(normalizeRestDay(settings?.restDay));
}

export function restDayKey(settings?: RestDaySource): RestDayKey {
  return normalizeRestDay(settings?.restDay);
}

export function restDayLabels(settings?: RestDaySource) {
  return REST_DAY_LABELS[normalizeRestDay(settings?.restDay)];
}

export function isRestDay(date: Date | string | number, settings?: RestDaySource): boolean {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return false;
  return value.getDay() === restDayIndex(settings);
}

/** The closure day as a localised name, ready to drop into a sentence. */
export function restDayName(settings: RestDaySource, isRTL: boolean): string {
  const labels = REST_DAY_LABELS[normalizeRestDay(settings?.restDay)];
  return isRTL ? labels.labelAr : labels.labelEn;
}

/**
 * Routine scheduling works in offsets from the Saturday that starts the
 * training week (`buildProgramSessions` does
 * `addDays(startOfWeek(today, { weekStartsOn: 6 }), offset)`), so Saturday = 0
 * ... Friday = 6. The closure offset has to be derived from the setting rather
 * than hardcoded, or the picker would lock the wrong day.
 */
export const SCHEDULE_WEEK_STARTS_ON = 6;

export function closedDayOffset(settings?: RestDaySource): number {
  return (restDayIndex(settings) - SCHEDULE_WEEK_STARTS_ON + 7) % 7;
}

export function isClosedDayOffset(offset: number, settings?: RestDaySource): boolean {
  return offset === closedDayOffset(settings);
}