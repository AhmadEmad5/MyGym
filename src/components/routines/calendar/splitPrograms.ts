import { addDays, format } from 'date-fns';
import type { WorkoutSession, SessionExercise, SetRecord } from '../../../lib/api';
import { ensureCardioWarmup } from './templates';

export interface SplitProgramDay {
  dayOffset: number; // 0 = start of week (e.g. Saturday or Monday)
  title: string;
  titleAr: string;
  targetMuscles: string[];
  durationMinutes: number;
  exercises: {
    name: string;
    targetMuscle?: string;
    notes?: string;
    restTime?: number;
    sets: Omit<SetRecord, 'id'>[];
  }[];
}

export interface SplitProgram {
  id: string;
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  daysPerWeek: number;
  goal: 'Hypertrophy' | 'Strength' | 'Conditioning';
  goalAr: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  levelAr: string;
  description: string;
  descriptionAr: string;
  days: SplitProgramDay[];
}

export const WORKOUT_SPLIT_PROGRAMS: SplitProgram[] = [
  {
    id: 'ppl-6day',
    name: 'Push / Pull / Legs (PPL)',
    nameAr: 'دفع / سحب / أرجل (PPL)',
    tagline: 'The gold standard for hypertrophy & progressive overload',
    taglineAr: 'المعيار الذهبي لتضخيم العضلات وزيادة الأوزان المستمرة',
    daysPerWeek: 6,
    goal: 'Hypertrophy',
    goalAr: 'تضخيم عضلي',
    level: 'Intermediate',
    levelAr: 'متوسط إلى متقدم',
    description: 'High-frequency 6-day split training every muscle group twice a week with optimal recovery on Friday.',
    descriptionAr: 'جدول احترافي 6 أيام يدرب كل مجموعة عضلية مرتين أسبوعياً مع راحة يوم الجمعة.',
    days: [
      {
        dayOffset: 0, // Saturday
        title: 'Push A (Chest & Front Delts Focus)',
        titleAr: 'دفع أ (تركيز الصدر والأكتاف)',
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Seated Machine Chest Press',
            targetMuscle: 'Chest',
            notes: 'تركيز على منتصف الصدر مع مد كامل وعصر متحكم به.',
            sets: [
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 6, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Incline Machine Chest Press',
            targetMuscle: 'Chest',
            notes: 'استهداف أعلى الصدر لبناء مظهر الصدر الممتلئ.',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Shoulder Press',
            targetMuscle: 'Shoulders',
            notes: 'دفع عمودي للأكتاف بزاوية آمنة.',
            sets: [
              { weight: 40, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 45, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 50, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Lateral Raise',
            targetMuscle: 'Shoulders',
            notes: 'عزل الكتف الجانبي لمظهر 3D عريض.',
            sets: [
              { weight: 10, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Rope Triceps Pushdown',
            targetMuscle: 'Triceps',
            notes: 'فتح الحبل عند أسفل الحركة لعصر الرأس الخارجي.',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 1, // Sunday
        title: 'Pull A (Lats & Upper Back Focus)',
        titleAr: 'سحب أ (تركيز عضلات الظهر والبايسبس)',
        targetMuscles: ['Back', 'Biceps', 'Shoulders'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Wide-Grip Lat Pulldown',
            targetMuscle: 'Back',
            notes: 'سحب باتجاه الترقوة مع تثبيت الجذع لمنح الظهر عرض V-Shape.',
            sets: [
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 6, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Seated Cable Row',
            targetMuscle: 'Back',
            notes: 'سحب نحو السرة لعصر منتصف وسماكة الظهر.',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Reverse Pec Deck Machine',
            targetMuscle: 'Shoulders',
            notes: 'عزل الكتف الخلفي بامتياز لتحسين استقامة الوقفة.',
            sets: [
              { weight: 35, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Preacher Curl',
            targetMuscle: 'Biceps',
            notes: 'عزل البايسبس التام ومنع الأرجحة.',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Rope Cable Hammer Curl',
            targetMuscle: 'Biceps',
            notes: 'استهداف العضلة العضدية لزيادة سمك الذراع.',
            sets: [
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 2, // Monday
        title: 'Legs & Core A (Quad & Glute Dominant)',
        titleAr: 'أرجل وبطن أ (تركيز عضلات الفخذ الأمامي)',
        targetMuscles: ['Legs', 'Core'],
        durationMinutes: 70,
        exercises: [
          {
            name: 'Leg Press',
            targetMuscle: 'Legs',
            notes: 'أقدام بمنتصف المنصة بعرض الكتفين لدفع قوي بالأفخاذ.',
            sets: [
              { weight: 120, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 140, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 160, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 180, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Romanian Deadlift',
            targetMuscle: 'Legs',
            notes: 'دفع الحوض للخلف لشعور تمدد عميق في أوتار الركبة وخلفية الفخذ.',
            sets: [
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 80, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Back Extension',
            targetMuscle: 'Back',
            notes: 'تقوية عضلات أسفل الظهر وحماية العمود الفقري.',
            sets: [
              { weight: 0, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 10, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 15, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Ab Crunch Machine',
            targetMuscle: 'Core',
            notes: 'انقباض محكم في عضلات البطن مع ثبات الورك.',
            sets: [
              { weight: 35, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 45, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 3, // Tuesday
        title: 'Push B (Incline & Lateral Delt Focus)',
        titleAr: 'دفع ب (تركيز الصدر العلوي والكتف الجانبي)',
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Incline Machine Chest Press',
            targetMuscle: 'Chest',
            notes: 'تركيز أثقل على الجزء العلوي من الصدر.',
            sets: [
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 6, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'High-to-Low Cable Crossover',
            targetMuscle: 'Chest',
            notes: 'استهداف أسفل الصدر والخط الداخلي بتمدد كامل.',
            sets: [
              { weight: 15, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 17.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 20, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Lateral Raise',
            targetMuscle: 'Shoulders',
            notes: 'مقاومة مستمرة للكتف الجانبي.',
            sets: [
              { weight: 10, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Overhead Cable Triceps Extension',
            targetMuscle: 'Triceps',
            notes: 'تمدد كامل للرأس الطويل للترايسبس.',
            sets: [
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Triceps Dip Machine',
            targetMuscle: 'Triceps',
            notes: 'ضغط عميق لعضلات الترايسبس بأمان.',
            sets: [
              { weight: 60, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 80, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 4, // Wednesday
        title: 'Pull B (Row & Bicep Peak Focus)',
        titleAr: 'سحب ب (تركيز سماكة الظهر وقمة البايسبس)',
        targetMuscles: ['Back', 'Biceps'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Chest-Supported Machine Row',
            targetMuscle: 'Back',
            notes: 'سحب قوي مع عزل تام للقطنية.',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Wide-Grip Lat Pulldown',
            targetMuscle: 'Back',
            notes: 'سحب متوسط العرض مع عصر اللاتس.',
            sets: [
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Behind-The-Back Cable Curl',
            targetMuscle: 'Biceps',
            notes: 'تمدد قوي للرأس الطويل لبناء قمة البايسبس.',
            sets: [
              { weight: 15, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 17.5, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 17.5, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Reverse Curl',
            targetMuscle: 'Forearms',
            notes: 'تقوية قبضة اليد والساعدين.',
            sets: [
              { weight: 15, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 5, // Thursday
        title: 'Legs & Core B (Hamstrings & Abs Focus)',
        titleAr: 'أرجل وبطن ب (تركيز الفخذ الخلفي والبطن)',
        targetMuscles: ['Legs', 'Core'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Romanian Deadlift',
            targetMuscle: 'Legs',
            notes: 'تركيز محكم على أوتار الركبة والمؤخرة.',
            sets: [
              { weight: 65, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 75, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 85, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Leg Press',
            targetMuscle: 'Legs',
            notes: 'تركيز حجمي عالي 12-15 عدة.',
            sets: [
              { weight: 130, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 150, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 160, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Kneeling Cable Crunch',
            targetMuscle: 'Core',
            notes: 'ثني الجذع بعضلات البطن فقط لبناء الـ 6-pack.',
            sets: [
              { weight: 30, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 35, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'upper-lower-4day',
    name: 'Upper / Lower Split (4 Days)',
    nameAr: 'علوي / سفلي (4 أيام)',
    tagline: 'Maximum recovery, balanced frequency, perfect for busy schedules',
    taglineAr: 'استشفاء فائق، توازن مثالي بين القوة والتضخيم',
    daysPerWeek: 4,
    goal: 'Strength',
    goalAr: 'قوة وتضخيم متوازن',
    level: 'Intermediate',
    levelAr: 'جميع المستويات',
    description: '4 focused sessions per week splitting upper and lower body. Great for balancing training with work or study.',
    descriptionAr: '4 جلسات أسبوعية تفصل الجزء العلوي والسفلي مع 3 أيام راحة كاملة.',
    days: [
      {
        dayOffset: 0, // Saturday
        title: 'Upper Body A (Power & Heavy Compound)',
        titleAr: 'علوي أ (قوة وتمارين مركبة)',
        targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Seated Machine Chest Press',
            targetMuscle: 'Chest',
            sets: [
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 75, repsTarget: 6, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Wide-Grip Lat Pulldown',
            targetMuscle: 'Back',
            sets: [
              { weight: 60, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 6, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Shoulder Press',
            targetMuscle: 'Shoulders',
            sets: [
              { weight: 45, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 50, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Rope Triceps Pushdown',
            targetMuscle: 'Triceps',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Preacher Curl',
            targetMuscle: 'Biceps',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 1, // Sunday
        title: 'Lower Body A (Heavy Leg Press & Hinges)',
        titleAr: 'سفلي أ (تمارين أرجل ثقيلة)',
        targetMuscles: ['Legs', 'Core'],
        durationMinutes: 60,
        exercises: [
          {
            name: 'Leg Press',
            targetMuscle: 'Legs',
            sets: [
              { weight: 140, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 160, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 180, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Romanian Deadlift',
            targetMuscle: 'Legs',
            sets: [
              { weight: 70, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 80, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Ab Crunch Machine',
            targetMuscle: 'Core',
            sets: [
              { weight: 40, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 45, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 3, // Tuesday
        title: 'Upper Body B (Hypertrophy & Isolation)',
        titleAr: 'علوي ب (تضخيم وعزل عالي الدقة)',
        targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
        durationMinutes: 65,
        exercises: [
          {
            name: 'Incline Machine Chest Press',
            targetMuscle: 'Chest',
            sets: [
              { weight: 50, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Seated Cable Row',
            targetMuscle: 'Back',
            sets: [
              { weight: 50, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Lateral Raise',
            targetMuscle: 'Shoulders',
            sets: [
              { weight: 10, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Overhead Cable Triceps Extension',
            targetMuscle: 'Triceps',
            sets: [
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Rope Cable Hammer Curl',
            targetMuscle: 'Biceps',
            sets: [
              { weight: 20, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 25, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 4, // Wednesday
        title: 'Lower Body B (Volume & Posterior Chain)',
        titleAr: 'سفلي ب (حجم عضلي وسلسلة خلفية)',
        targetMuscles: ['Legs', 'Core'],
        durationMinutes: 60,
        exercises: [
          {
            name: 'Leg Press',
            targetMuscle: 'Legs',
            sets: [
              { weight: 120, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 140, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 150, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Back Extension',
            targetMuscle: 'Back',
            sets: [
              { weight: 10, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 15, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Kneeling Cable Crunch',
            targetMuscle: 'Core',
            sets: [
              { weight: 35, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'full-body-3day',
    name: 'Full Body 3-Day Strength',
    nameAr: 'كامل الجسم 3 أيام (قوة ولياقة)',
    tagline: 'High impact compound movements with 4 full days of rest',
    taglineAr: 'تمارين مركبة أساسية مع 4 أيام راحة تامة',
    daysPerWeek: 3,
    goal: 'Conditioning',
    goalAr: 'قوة ولياقة شاملة',
    level: 'Beginner',
    levelAr: 'مبتدئ إلى متوسط',
    description: '3 full-body sessions (Saturday, Monday, Wednesday) maximizing training stimulus per hour.',
    descriptionAr: '3 جلسات أسبوعية تشمل كامل عضلات الجسم لرفع معدل الأيض والقوة العامة.',
    days: [
      {
        dayOffset: 0, // Saturday
        title: 'Full Body Workout A',
        titleAr: 'تمرين كامل الجسم أ',
        targetMuscles: ['Legs', 'Chest', 'Back', 'Core'],
        durationMinutes: 60,
        exercises: [
          {
            name: 'Leg Press',
            targetMuscle: 'Legs',
            sets: [
              { weight: 130, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 150, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 170, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Seated Machine Chest Press',
            targetMuscle: 'Chest',
            sets: [
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Wide-Grip Lat Pulldown',
            targetMuscle: 'Back',
            sets: [
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 65, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Ab Crunch Machine',
            targetMuscle: 'Core',
            sets: [
              { weight: 35, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 40, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 2, // Monday
        title: 'Full Body Workout B',
        titleAr: 'تمرين كامل الجسم ب',
        targetMuscles: ['Legs', 'Shoulders', 'Back', 'Arms'],
        durationMinutes: 60,
        exercises: [
          {
            name: 'Romanian Deadlift',
            targetMuscle: 'Legs',
            sets: [
              { weight: 60, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 70, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 80, repsTarget: 8, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Shoulder Press',
            targetMuscle: 'Shoulders',
            sets: [
              { weight: 40, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 45, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Chest-Supported Machine Row',
            targetMuscle: 'Back',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Rope Triceps Pushdown',
            targetMuscle: 'Triceps',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      },
      {
        dayOffset: 4, // Wednesday
        title: 'Full Body Workout C',
        titleAr: 'تمرين كامل الجسم ج',
        targetMuscles: ['Chest', 'Back', 'Shoulders', 'Legs'],
        durationMinutes: 60,
        exercises: [
          {
            name: 'Incline Machine Chest Press',
            targetMuscle: 'Chest',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Seated Cable Row',
            targetMuscle: 'Back',
            sets: [
              { weight: 50, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 55, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Cable Lateral Raise',
            targetMuscle: 'Shoulders',
            sets: [
              { weight: 10, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 12.5, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          },
          {
            name: 'Machine Preacher Curl',
            targetMuscle: 'Biceps',
            sets: [
              { weight: 25, repsTarget: 12, repsActual: 0, unit: 'kg', isCompleted: false },
              { weight: 30, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false },
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Builds a concrete array of WorkoutSession objects for a target week
 * based on a chosen SplitProgram, guaranteeing Friday rest day exclusion.
 */
export function buildSplitProgramSessions(
  program: SplitProgram,
  weekStartDate: Date
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const baseTimestamp = Date.now();

  program.days.forEach((day, dayIndex) => {
    const targetDate = addDays(weekStartDate, day.dayOffset);
    // Friday is day 5 in JS (0=Sun, 5=Fri, 6=Sat)
    if (targetDate.getDay() === 5) {
      return; // Skip Friday gym closure
    }

    targetDate.setHours(18, 0, 0, 0);
    const dateStr = format(targetDate, "yyyy-MM-dd'T'HH:mm");

    const fullExercises: SessionExercise[] = day.exercises.map((rawEx, exIndex) => ({
      ...rawEx,
      targetMuscle: rawEx.targetMuscle || 'Other',
      restTime: rawEx.restTime || 90,
      notes: rawEx.notes || '',
      id: `ex-${baseTimestamp}-${dayIndex}-${exIndex}`,
      sets: rawEx.sets.map((set, setIndex) => ({
        ...set,
        id: `s-${baseTimestamp}-${dayIndex}-${exIndex}-${setIndex}`,
        repsActual: 0,
        isCompleted: false
      }))
    }));

    sessions.push({
      id: `session-split-${baseTimestamp}-${dayIndex}`,
      title: day.title,
      date: dateStr,
      duration: day.durationMinutes,
      type: 'Strength',
      notes: `${program.name} · ${day.targetMuscles.join(', ')}`,
      isCompleted: false,
      exercises: ensureCardioWarmup(fullExercises)
    });
  });

  return sessions;
}
