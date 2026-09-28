import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_HOMEDUMBBELL4DAY: PredefinedRoutine = {
  id: 'home-dumbbell-4day',
  name: 'Home & Dumbbell Mastery (جدول منزلي بالدمبلز 4 أيام)',
  category: 'Home & Dumbbells',
  description: 'Complete 4-day muscle-building program requiring only a pair of dumbbells and bodyweight. Train anywhere with high efficiency.',
  daysRequired: 4,
  difficulty: 'Beginner',
  difficultyScore: 2,
  estTime: '40 - 50 min',
  primaryMuscles: ['Full Body', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms'],
  accentColor: '#10b981',
  badge: 'HOME & DUMBBELLS 🏠',
  sessions: [
    {
      title: 'Day 1: Dumbbell Upper Push (دفع علوي بالدمبلز)',
      type: 'Strength',
      exercises: [
        {
          id: 'hdb-cardio-1',
          name: 'Jump Rope & Dynamic Cardio (نط الحبل وإحماء ديناميكي)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes jump rope or dynamic calisthenics to elevate heart rate and prime joints.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex1',
          name: 'Dumbbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Dumbbell horizontal press on floor or bench.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex2',
          name: 'Dumbbell Shoulder Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Standing or seated overhead press.',
          videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex3',
          name: 'Standing Lateral Raise',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Side delt dumbbell raise.',
          videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex4',
          name: 'Skull Crushers',
          targetMuscle: 'Triceps',
          restTime: 90,
          notes: 'Dumbbell tricep extension behind head.',
          videoUrl: 'https://www.youtube.com/embed/d_KZxkY_0cM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 2: Dumbbell Upper Pull (سحب علوي بالدمبلز)',
      type: 'Strength',
      exercises: [
        {
          id: 'hdb-cardio2',
          name: 'Jump Rope & Dynamic Warm-up (نط حبل وإحماء ديناميكي)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: 'نط حبل خفيف أو هرولة في المكان لرفع نبضات القلب وإعداد مفاصل الظهر والأكتاف.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 8,
          sets: [{ id: '1', weight: 0, repsTarget: 8, repsActual: 8, unit: 'kg', isCompleted: false }]
        },
        {
          id: 'hdb-ex5',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Dumbbell bent-over row.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex6',
          name: 'Barbell Bicep Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Standing dumbbell curl.',
          videoUrl: 'https://www.youtube.com/embed/kwG2ipFRgfo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex7',
          name: 'Incline Dumbbell Hammer Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Hammer grip curl for forearms and arms.',
          videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex8',
          name: 'Dumbbell Shrugs',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Upper trapezius dumbbell shrugs.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 3: Lower Body & Abs (أرجل ومعدة بالدمبلز)',
      type: 'Strength',
      exercises: [
        {
          id: 'hdb-cardio3',
          name: 'Stationary Bike / High Knees (دراجة أو ركض موضعي)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: 'كارديو خفيف 8-10 دقائق لضخ الدم في أوتار الركبة والعضلات السفلية قبل السكوات.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 8,
          sets: [{ id: '1', weight: 0, repsTarget: 8, repsActual: 8, unit: 'kg', isCompleted: false }]
        },
        {
          id: 'hdb-ex9',
          name: 'Squats',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Dumbbell goblet squat.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex10',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Dumbbell Romanian deadlift for hamstrings.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex11',
          name: 'Standing Calf Raises',
          targetMuscle: 'Calves',
          restTime: 90,
          notes: 'Dumbbell calf raises.',
          videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex12',
          name: 'Hanging Knee Raises',
          targetMuscle: 'Core',
          restTime: 90,
          notes: 'Floor leg raises or abdominal crunches.',
          videoUrl: 'https://www.youtube.com/embed/hdng3Nm1x_E',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 4: Full Body Dumbbell Circuit (شامل ولياقة بالدمبلز)',
      type: 'Strength',
      exercises: [
        {
          id: 'hdb-cardio4',
          name: 'Aerobic HIIT Warm-up (كارديو وإحماء لكامل الجسم)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: 'حركات كارديو هوائية خفيفة لتجهيز كامل عضلات الجسم للدائرة التدريبية.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 8,
          sets: [{ id: '1', weight: 0, repsTarget: 8, repsActual: 8, unit: 'kg', isCompleted: false }]
        },
        {
          id: 'hdb-ex13',
          name: 'Squats',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Dumbbell squats.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex14',
          name: 'Dumbbell Shoulder Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Shoulder push.',
          videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex15',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Dumbbell row.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'hdb-ex16',
          name: 'Incline Dumbbell Hammer Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Bicep finisher.',
          videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    }
  ]
};

