import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_CHESTPOWER: PredefinedRoutine = {
  id: 'chest-hypertrophy-mastery',
  name: 'Chest & Upper Body Power (تمارين الصدر المتكاملة)',
  category: 'Targeted Chest Mastery',
  description: 'Targeted chest progression hitting all angles with verified technique videos: Barbell Bench Press, Incline Dumbbell Press, Chest Cable Fly, Dips, and Push-ups.',
  daysRequired: 3,
  difficulty: 'Advanced',
  difficultyScore: 4,
  estTime: '60 - 70 min',
  primaryMuscles: ['Chest', 'Triceps', 'Shoulders'],
  accentColor: '#ef4444',
  badge: 'CHEST FOCUS 🎯',
  sessions: [
    {
      title: 'Chest & Triceps Power Blast',
      type: 'Strength',
      exercises: [
        {
          id: 'ch-cardio-1',
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
          id: 'ch-ex1',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 120,
          notes: 'Compound chest mass foundation. Drive feet into floor and tuck elbows.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '4', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex2',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Clavicular upper chest builder. 30 degree incline angle.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex3',
          name: 'Chest Cable Fly',
          targetMuscle: 'Chest',
          restTime: 60,
          notes: 'Continuous tension and deep stretch for sternal chest fibers.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/I-Ue34qLxc4',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex4',
          name: 'Dips (Chest Dips)',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Lean forward 30 degrees to bias the lower chest and outer pectoral line.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/eicOUO9WaJc',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex5',
          name: 'Push-ups',
          targetMuscle: 'Chest',
          restTime: 60,
          notes: 'Bodyweight chest finisher to muscular exhaustion. Maintain strict plank.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/pKZ-lkKKMws',
          sets: [
            { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Back & Core Counterbalance',
      type: 'Strength',
      exercises: [
        {
          id: 'ch-cardio-2',
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
          id: 'ch-ex6',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Vertical pull for posture and lat width.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex7',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Thickens mid-back to balance heavy pressing.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Lower Body & Conditioning',
      type: 'Strength',
      exercises: [
        {
          id: 'ch-cardio-3',
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
          id: 'ch-ex8',
          name: 'Squats',
          targetMuscle: 'Legs',
          restTime: 120,
          notes: 'Lower body powerhouse.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ch-ex9',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Hamstring stretch and posterior strength.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
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

