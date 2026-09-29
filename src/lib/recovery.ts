import { HistoryRecord, WorkoutSession } from './api';

export type MuscleGroupId = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface MuscleRecoveryStatus {
  id: MuscleGroupId;
  nameEn: string;
  nameAr: string;
  percent: number; // 0 - 100
  status: 'ready' | 'recovering' | 'fatigued';
  hoursAgo: number | null;
  lastTrainedDate: string | null;
}

export interface RecoveryOverview {
  overallScore: number; // 0 - 100
  muscles: MuscleRecoveryStatus[];
  recommendedMuscles: MuscleRecoveryStatus[];
}

const MUSCLE_SPECS: {
  id: MuscleGroupId;
  nameEn: string;
  nameAr: string;
  recoveryHoursNeeded: number;
  aliases: string[];
}[] = [
  {
    id: 'chest',
    nameEn: 'Chest',
    nameAr: 'الصدر',
    recoveryHoursNeeded: 60,
    aliases: ['chest', 'pectoral', 'pecs']
  },
  {
    id: 'back',
    nameEn: 'Back',
    nameAr: 'الظهر',
    recoveryHoursNeeded: 60,
    aliases: ['back', 'lats', 'traps', 'lowerback', 'upper back', 'rhomboids']
  },
  {
    id: 'legs',
    nameEn: 'Legs',
    nameAr: 'الأرجل',
    recoveryHoursNeeded: 72,
    aliases: ['legs', 'quads', 'hamstrings', 'glutes', 'calves', 'thighs']
  },
  {
    id: 'shoulders',
    nameEn: 'Shoulders',
    nameAr: 'الأكتاف',
    recoveryHoursNeeded: 48,
    aliases: ['shoulders', 'deltoids', 'delts']
  },
  {
    id: 'arms',
    nameEn: 'Arms',
    nameAr: 'الذراعين',
    recoveryHoursNeeded: 44,
    aliases: ['arms', 'biceps', 'triceps', 'forearms']
  },
  {
    id: 'core',
    nameEn: 'Core / Abs',
    nameAr: 'البطن والوسط',
    recoveryHoursNeeded: 36,
    aliases: ['core', 'abs', 'abdominals', 'obliques']
  }
];

export function computeMuscleRecovery(
  history: HistoryRecord[] = [],
  sessions: WorkoutSession[] = []
): RecoveryOverview {
  const now = new Date();

  // Aggregate all completed sessions with exercises and dates
  type WorkoutStamp = { date: Date; targetMuscles: string[] };
  const allStamps: WorkoutStamp[] = [];

  for (const h of history) {
    if (!h.date) continue;
    const muscles = (h.snapshot?.exercises || [])
      .map(e => (e.targetMuscle || '').toLowerCase().trim())
      .filter(Boolean);
    allStamps.push({ date: new Date(h.date), targetMuscles: muscles });
  }

  for (const s of sessions) {
    if (!s.isCompleted || !s.date) continue;
    const muscles = (s.exercises || [])
      .map(e => (e.targetMuscle || '').toLowerCase().trim())
      .filter(Boolean);
    allStamps.push({ date: new Date(s.date), targetMuscles: muscles });
  }

  const musclesStatus: MuscleRecoveryStatus[] = MUSCLE_SPECS.map(spec => {
    let mostRecentDate: Date | null = null;

    for (const stamp of allStamps) {
      const touchesMuscle = stamp.targetMuscles.some(m =>
        spec.aliases.some(alias => m.includes(alias))
      );
      if (touchesMuscle) {
        if (!mostRecentDate || stamp.date.getTime() > mostRecentDate.getTime()) {
          mostRecentDate = stamp.date;
        }
      }
    }

    if (!mostRecentDate) {
      // Never trained or rested a long time: 100% ready
      return {
        id: spec.id,
        nameEn: spec.nameEn,
        nameAr: spec.nameAr,
        percent: 100,
        status: 'ready',
        hoursAgo: null,
        lastTrainedDate: null
      };
    }

    const hoursElapsed = Math.max(0, (now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60));
    const recoveryRatio = Math.min(1, hoursElapsed / spec.recoveryHoursNeeded);
    const percent = Math.min(100, Math.max(15, Math.round(recoveryRatio * 100)));

    let status: 'ready' | 'recovering' | 'fatigued' = 'ready';
    if (percent < 50) {
      status = 'fatigued';
    } else if (percent < 85) {
      status = 'recovering';
    } else {
      status = 'ready';
    }

    return {
      id: spec.id,
      nameEn: spec.nameEn,
      nameAr: spec.nameAr,
      percent,
      status,
      hoursAgo: Math.round(hoursElapsed),
      lastTrainedDate: mostRecentDate.toISOString()
    };
  });

  const overallScore = Math.round(
    musclesStatus.reduce((acc, m) => acc + m.percent, 0) / musclesStatus.length
  );

  const recommendedMuscles = musclesStatus.filter(m => m.status === 'ready');

  return {
    overallScore,
    muscles: musclesStatus,
    recommendedMuscles: recommendedMuscles.length > 0 ? recommendedMuscles : musclesStatus.filter(m => m.status === 'recovering')
  };
}
