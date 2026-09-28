import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_BROSPLIT5DAY: PredefinedRoutine = {
  id: 'classic-bro-split-5day',
  name: 'Classic Bodybuilding Split (تقسيم العضلات الكلاسيكي 5 أيام)',
  category: 'Hypertrophy & Aesthetics',
  description: 'The golden standard 5-day targeted split: Chest, Back, Legs, Shoulders, and Arms. Dedicated focus for peak muscle hypertrophy.',
  daysRequired: 5,
  difficulty: 'Intermediate',
  difficultyScore: 4,
  estTime: '55 - 65 min',
  primaryMuscles: ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps'],
  accentColor: '#3b82f6',
  badge: 'PRO CHOICE 🏆',
  sessions: [
    {
      title: 'Day 1: Chest & Core (صدر وبطن)',
      type: 'Strength',
      exercises: [
        {
          id: 'cbs-cardio-1',
          name: 'Treadmill Incline Walk & Warm-up (إحماء سير مائل)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes incline walk to prepare the shoulders, chest and elevate core temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex1',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Primary horizontal chest mass compound.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex2',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Upper chest clavicular head builder.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex3',
          name: 'Cable Chest Flyes',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Continuous tension inner chest squeeze.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex4',
          name: 'Hanging Knee Raises',
          targetMuscle: 'Core',
          restTime: 90,
          notes: 'Lower abdominal flexion and core stability.',
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
      title: 'Day 2: Back & Rear Delts (ظهر وترابيس)',
      type: 'Strength',
      exercises: [
        {
          id: 'cbs-cardio-2',
          name: 'Rowing Machine or Treadmill Warm-up (إحماء سير أو تجديف)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes to mobilize the thoracic spine, lats, and activate full body circulation.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex5',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Wide lat development and V-taper sweep.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex6',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Back thickness for lats and rhomboids.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex7',
          name: 'Seated Cable Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Mid-back horizontal squeeze.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex8',
          name: 'Face Pulls',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Rear delts and rotator cuff health.',
          videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 3: Legs & Calves (أرجل وسمانة)',
      type: 'Strength',
      exercises: [
        {
          id: 'cbs-cardio-3',
          name: 'Stationary Bike Warm-up & Cardio (إحماء دراجة هوائية)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes low resistance cycling to lubricate knee joints, hips, and prep quads.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex9',
          name: 'Barbell Back Squat',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'The king of quad and overall leg mass.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex10',
          name: 'Machine Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Heavy compound quad builder.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex11',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Loaded stretch for hamstrings and glutes.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex12',
          name: 'Standing Calf Raises',
          targetMuscle: 'Calves',
          restTime: 90,
          notes: 'Full ankle extension for calf fullness.',
          videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 4: Shoulders & Traps (أكتاف وترابيس)',
      type: 'Strength',
      exercises: [
        {
          id: 'cbs-cardio-4',
          name: 'Treadmill Incline Walk & Warm-up (إحماء سير مائل)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes incline walk to prepare the shoulders, rotator cuffs and core temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex13',
          name: 'Dumbbell Shoulder Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Strict vertical press for shoulder caps.',
          videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex14',
          name: 'Standing Lateral Raise',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Side lateral delt isolation for shoulder width.',
          videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex15',
          name: 'Face Pulls',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Rear delts and postural reinforcement.',
          videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex16',
          name: 'Dumbbell Shrugs',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Upper trapezius vertical contraction.',
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
      title: 'Day 5: Arms Blast (Biceps & Triceps) (ذراعين شامل)',
      type: 'Strength',
      exercises: [
        {
          id: 'cbs-cardio-5',
          name: 'Treadmill Interval Walk & Warm-up (إحماء سير وتنشيط الدورة الدموية)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes brisk walking to elevate heart rate and prime upper body blood flow.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex17',
          name: 'Barbell Bicep Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Foundational bicep peak and mass builder.',
          videoUrl: 'https://www.youtube.com/embed/kwG2ipFRgfo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex18',
          name: 'Tricep Rope Pushdown',
          targetMuscle: 'Triceps',
          restTime: 90,
          notes: 'Triceps lateral and medial head isolation.',
          videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex19',
          name: 'Incline Dumbbell Hammer Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Brachialis thickness and forearm integration.',
          videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'cbs-ex20',
          name: 'Skull Crushers',
          targetMuscle: 'Triceps',
          restTime: 90,
          notes: 'Deep stretch on tricep long head.',
          videoUrl: 'https://www.youtube.com/embed/d_KZxkY_0cM',
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

