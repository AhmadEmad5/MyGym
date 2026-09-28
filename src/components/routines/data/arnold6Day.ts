import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_ARNOLD6DAY: PredefinedRoutine = {
  id: 'arnold-split-6day',
  name: 'Arnold 6-Day Split (نظام أرنولد المزدوج 6 أيام)',
  category: 'Golden Era Hypertrophy',
  description: 'Arnold Schwarzenegger antagonistic 6-day split: Chest & Back, Shoulders & Arms, Legs & Core repeated twice across the week for maximum hypertrophy.',
  daysRequired: 6,
  difficulty: 'Advanced',
  difficultyScore: 5,
  estTime: '60 - 75 min',
  primaryMuscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'],
  accentColor: '#f59e0b',
  badge: 'ARNOLD SPLIT 🔥',
  sessions: [
    {
      title: 'Day 1: Chest & Back A (صدر وظهر)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-1',
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
          id: 'arn-ex1',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Compound chest press.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex2',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Vertical pulling lat builder.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex3',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Upper chest clavicular focus.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex4',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Horizontal back rowing.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 2: Shoulders & Arms A (أكتاف وذراعين)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-2',
          name: 'Treadmill Incline Walk & Warm-up (إحماء سير مائل)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes incline walk to prepare the shoulders, arms and elevate core temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex5',
          name: 'Overhead Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Standing or seated shoulder compound.',
          videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex6',
          name: 'Standing Lateral Raise',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Side delt shoulder caps.',
          videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex7',
          name: 'Barbell Bicep Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Bicep mass builder.',
          videoUrl: 'https://www.youtube.com/embed/kwG2ipFRgfo',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex8',
          name: 'Tricep Pushdown',
          targetMuscle: 'Triceps',
          restTime: 90,
          notes: 'Tricep cable extension.',
          videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 3: Legs & Core A (أرجل وبطن)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-3',
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
          id: 'arn-ex9',
          name: 'Barbell Back Squat',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Primary lower body builder.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex10',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Hamstrings loaded stretch.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex11',
          name: 'Machine Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Quad leg volume.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex12',
          name: 'Hanging Knee Raises',
          targetMuscle: 'Core',
          restTime: 90,
          notes: 'Lower abdominal contraction.',
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
      title: 'Day 4: Chest & Back B (صدر وظهر)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-4',
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
          id: 'arn-ex13',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Upper chest pressing.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex14',
          name: 'Seated Cable Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Horizontal back contraction.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex15',
          name: 'Cable Chest Flyes',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Chest isolation.',
          videoUrl: '',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex16',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Vertical back pulling.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 5: Shoulders & Arms B (أكتاف وذراعين)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-5',
          name: 'Treadmill Incline Walk & Warm-up (إحماء سير مائل)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes incline walk to prepare the shoulders, arms and elevate core temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex17',
          name: 'Dumbbell Shoulder Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Overhead shoulder builder.',
          videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex18',
          name: 'Face Pulls',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Rear delt isolation.',
          videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex19',
          name: 'Incline Dumbbell Hammer Curl',
          targetMuscle: 'Biceps',
          restTime: 90,
          notes: 'Forearm and bicep thickness.',
          videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex20',
          name: 'Skull Crushers',
          targetMuscle: 'Triceps',
          restTime: 90,
          notes: 'Tricep long head stretch.',
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
      title: 'Day 6: Legs & Calves B (أرجل وسمانة)',
      type: 'Strength',
      exercises: [
        {
          id: 'arn-cardio-6',
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
          id: 'arn-ex21',
          name: 'Machine Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Heavy lower body pushing.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex22',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Hamstrings loaded stretch.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex23',
          name: 'Standing Calf Raises',
          targetMuscle: 'Calves',
          restTime: 90,
          notes: 'Calf elevation and squeeze.',
          videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'arn-ex24',
          name: 'Hanging Knee Raises',
          targetMuscle: 'Core',
          restTime: 90,
          notes: 'Core strength and pelvic lift.',
          videoUrl: 'https://www.youtube.com/embed/hdng3Nm1x_E',
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

