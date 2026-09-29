import type { PredefinedRoutine } from '../../ProgramDeck3DCard';
import { ROUTINE_PPL } from './ppl';
import { ROUTINE_THREEDAYMUSCLE } from './threeDayMuscle';
import { ROUTINE_UPPERLOWER } from './upperLower';
import { ROUTINE_FULLBODY } from './fullBody';
import { ROUTINE_CHESTPOWER } from './chestPower';
import { ROUTINE_BROSPLIT5DAY } from './broSplit5Day';
import { ROUTINE_ARNOLD6DAY } from './arnold6Day';
import { ROUTINE_HOMEDUMBBELL4DAY } from './homeDumbbell4Day';

export const DAYS_OF_WEEK = [
  { labelEn: 'Saturday', labelAr: 'السبت', shortEn: 'Sat', shortAr: 'السبت', value: 0, isClosed: false },
  { labelEn: 'Sunday', labelAr: 'الأحد', shortEn: 'Sun', shortAr: 'الأحد', value: 1, isClosed: false },
  { labelEn: 'Monday', labelAr: 'الاثنين', shortEn: 'Mon', shortAr: 'الاثنين', value: 2, isClosed: false },
  { labelEn: 'Tuesday', labelAr: 'الثلاثاء', shortEn: 'Tue', shortAr: 'الثلاثاء', value: 3, isClosed: false },
  { labelEn: 'Wednesday', labelAr: 'الأربعاء', shortEn: 'Wed', shortAr: 'الأربعاء', value: 4, isClosed: false },
  { labelEn: 'Thursday', labelAr: 'الخميس', shortEn: 'Thu', shortAr: 'الخميس', value: 5, isClosed: false },
  { labelEn: 'Friday (Gym Closed)', labelAr: 'الجمعة (الجيم مغلق)', shortEn: 'Fri', shortAr: 'الجمعة', value: 6, isClosed: true }
] as const;

// Day values are offsets from the Saturday that starts the training week
// (buildProgramSessions does `addDays(startOfWeek(today, { weekStartsOn: 6 }), offset)`),
// so Saturday = 0 ... Friday = 6. Derive the closed day from DAYS_OF_WEEK instead
// of hardcoding it: the old literal 5 pointed at Thursday and blocked the wrong day.
export const CLOSED_DAY_VALUE = DAYS_OF_WEEK.find(day => day.isClosed)?.value ?? 6;

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
