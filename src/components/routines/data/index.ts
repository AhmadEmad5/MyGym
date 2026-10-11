import type { PredefinedRoutine } from '../../ProgramDeck3DCard';
import { REST_DAY_KEYS, REST_DAY_LABELS, closedDayOffset, type RestDaySource } from '../../../lib/restDay';
import { ROUTINE_PPL } from './ppl';
import { ROUTINE_THREEDAYMUSCLE } from './threeDayMuscle';
import { ROUTINE_UPPERLOWER } from './upperLower';
import { ROUTINE_FULLBODY } from './fullBody';
import { ROUTINE_CHESTPOWER } from './chestPower';
import { ROUTINE_BROSPLIT5DAY } from './broSplit5Day';
import { ROUTINE_ARNOLD6DAY } from './arnold6Day';
import { ROUTINE_HOMEDUMBBELL4DAY } from './homeDumbbell4Day';

export type ScheduleDayOption = {
  labelEn: string;
  labelAr: string;
  shortEn: string;
  shortAr: string;
  /** Offset from the Saturday that starts the training week. */
  value: number;
  isClosed: boolean;
};

/**
 * The routine scheduler runs on Saturday-first offsets (buildProgramSessions
 * does `addDays(startOfWeek(today, { weekStartsOn: SCHEDULE_WEEK_STARTS_ON }), offset)`),
 * so Saturday = 0 ... Friday = 6. `value` is that offset while the labels come
 * from the `Date.getDay()` order the labels themselves are written in.
 */
const SCHEDULE_DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

/**
 * The seven scheduling slots for the current athlete. Which one is closed comes
 * from `settings.restDay` instead of a literal Friday: the old hardcoded entry
 * blocked the wrong day the moment the week or the setting changed.
 */
export function buildScheduleDays(settings?: RestDaySource): ScheduleDayOption[] {
  const closedValue = closedDayOffset(settings);
  return SCHEDULE_DAY_ORDER.map((dayIndex, value) => {
    const labels = REST_DAY_LABELS[REST_DAY_KEYS[dayIndex]];
    const isClosed = value === closedValue;
    return {
      ...labels,
      labelEn: isClosed ? `${labels.labelEn} (Gym Closed)` : labels.labelEn,
      labelAr: isClosed ? `${labels.labelAr} (الجيم مغلق)` : labels.labelAr,
      value,
      isClosed
    };
  });
}

export const PREDEFINED_ROUTINES: PredefinedRoutine[] = [
  ROUTINE_PPL,
  ROUTINE_THREEDAYMUSCLE,
  ROUTINE_UPPERLOWER,
  ROUTINE_FULLBODY,
  ROUTINE_CHESTPOWER,
  ROUTINE_BROSPLIT5DAY,
  ROUTINE_ARNOLD6DAY,
  ROUTINE_HOMEDUMBBELL4DAY
];

export const PREDEFINED_ROUTINE_CATEGORIES = Array.from(new Set(PREDEFINED_ROUTINES.map(r => r.category)));
