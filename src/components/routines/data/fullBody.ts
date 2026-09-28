import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_FULLBODY: PredefinedRoutine = {
  id: 'full-body-routine',
  name: 'Full Body 3-Day Split',
  category: 'Efficiency & Functional',
  description: 'High-frequency 3-day training triggering maximum protein synthesis across all muscle groups every workout.',
  daysRequired: 3,
  difficulty: 'Beginner',
  difficultyScore: 2,
  estTime: '45 - 55 min',
  primaryMuscles: ['Full Body', 'Functional Strength'],
  accentColor: '#10b981',
  badge: 'HIGH FREQUENCY ⚡',
  sessions: [
    {
      title: 'Full Body Workout A',
      type: 'Strength',
      exercises: [
        {
          id: 'fb-cardio-1',
          name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
          targetMuscle: 'Cardio',
          restTime: 60,
          notes: '5-10 minutes of aerobic warm-up to prepare joints and elevate core temperature.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
          duration: 10,
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'kg', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex1',
          name: 'Squats',
          targetMuscle: 'Legs',
          restTime: 120,
          notes: 'Primary lower body builder.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex2',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 120,
          notes: 'Primary horizontal press.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex3',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Primary vertical pull.',
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
      title: 'Full Body Workout B',
      type: 'Strength',
      exercises: [
        {
          id: 'fb-cardio-2',
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
          id: 'fb-ex4',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 120,
          notes: 'Posterior chain and hip hinge power.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex5',
          name: 'Overhead Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Vertical overhead push.',
          videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex6',
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
      title: 'Full Body Workout C',
      type: 'Strength',
      exercises: [
        {
          id: 'fb-cardio-3',
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
          id: 'fb-ex7',
          name: 'Machine Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Quad volume and pump.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex8',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Upper chest angle.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'fb-ex9',
          name: 'Bicep Curls',
          targetMuscle: 'Biceps',
          restTime: 60,
          notes: 'Arm finisher.',
          videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    }
  ]
};

