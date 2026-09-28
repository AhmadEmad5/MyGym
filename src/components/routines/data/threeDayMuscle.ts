import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_THREEDAYMUSCLE: PredefinedRoutine = {
  id: '3days-routine',
  name: '3-Day Muscle Split (تقسيم العضلات الثلاثي الشامل)',
  category: 'Targeted Hypertrophy & Strength',
  description: 'Day 1: Chest, Delts & Triceps | Day 2: Back, Rear Delts & Biceps | Day 3: Complete Legs, Calves & Core. Perfect 3-day balance for muscle growth.',
  daysRequired: 3,
  difficulty: 'Intermediate',
  difficultyScore: 3,
  estTime: '55 - 70 min',
  primaryMuscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'],
  accentColor: '#ec4899',
  badge: 'POPULAR 🔥',
  sessions: [
    {
      title: 'Day 1: Chest, Delts & Triceps (صدر وأكتاف وتراي)',
      type: 'Strength',
      exercises: [
        {
          id: 'ms-cardio-1',
          name: 'Treadmill Incline Walk & Warm-up (إحماء سير مائل)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes incline walk at moderate pace to elevate heart rate and body temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex1',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 120,
          notes: 'Primary horizontal compound. Retract scapula and drive with legs.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex2',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: '30-degree incline to target upper clavicular pectoral head.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex3',
          name: 'Overhead Dumbbell Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Vertical deltoid press with controlled descent.',
          videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex4',
          name: 'Dumbbell Lateral Raises',
          targetMuscle: 'Shoulders',
          restTime: 60,
          notes: 'Isolate lateral deltoids for wide V-taper shoulders.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/pKZ-lkKKMws',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex5',
          name: 'Tricep Rope Pushdown',
          targetMuscle: 'Triceps',
          restTime: 60,
          notes: 'Keep elbows locked at sides and spread rope apart at contraction.',
          videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex6',
          name: 'Overhead Dumbbell Tricep Extension',
          targetMuscle: 'Triceps',
          restTime: 60,
          notes: 'Deep stretch on the long head of the triceps.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/Kl3LEzQ5Zqs',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 2: Back, Rear Delts & Biceps (ظهر وأكتاف خلفية وباي)',
      type: 'Strength',
      exercises: [
        {
          id: 'ms-cardio-2',
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
          id: 'ms-ex7',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Vertical pull for wide lats and upper back sweep.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex8',
          name: 'Barbell Bent-Over Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Heavy compound row for lat thickness, rhomboids, and traps.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex9',
          name: 'Seated Cable Row',
          targetMuscle: 'Back',
          restTime: 75,
          notes: 'Continuous cable tension targeting middle and lower lats.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/eicOUO9WaJc',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex10',
          name: 'Face Pulls',
          targetMuscle: 'Shoulders',
          restTime: 60,
          notes: 'Essential rear delt work and rotator cuff external rotation.',
          videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
          sets: [
            { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex11',
          name: 'Incline Dumbbell Bicep Curls',
          targetMuscle: 'Biceps',
          restTime: 60,
          notes: 'Maximum stretch on long head of the bicep for peak growth.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/bEv6CCg2BC8',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex12',
          name: 'Dumbbell Hammer Curls',
          targetMuscle: 'Biceps',
          restTime: 60,
          notes: 'Builds the brachialis muscle and thickens the forearms and grip.',
          videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Day 3: Complete Legs, Calves & Core (أرجل وسمانة وبطن)',
      type: 'Strength',
      exercises: [
        {
          id: 'ms-cardio-3',
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
          id: 'ms-ex13',
          name: 'Barbell Back Squat',
          targetMuscle: 'Legs',
          restTime: 120,
          notes: 'Foundational lower body compound for quad and glute strength.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex14',
          name: 'Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Safe heavy quad and glute overload with full range of motion.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex15',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Crucial hip hinge for powerful hamstrings, glutes, and posterior chain.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/JCXUYuzwNrM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex16',
          name: 'Lying Leg Curls',
          targetMuscle: 'Legs',
          restTime: 60,
          notes: 'Isolated knee flexion for complete hamstring development.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/2-LAMcpzODU',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex17',
          name: 'Standing Calf Raises',
          targetMuscle: 'Legs',
          restTime: 60,
          notes: 'Pause for 1-2 seconds at the top and stretch fully at the bottom.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/ykJmrZ5v0Oo',
          sets: [
            { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ms-ex18',
          name: 'Kneeling Cable Crunch',
          targetMuscle: 'Core',
          restTime: 60,
          notes: 'Curl torso down using abdominals, avoid pulling with arms.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          sets: [
            { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    }
  ]
};

