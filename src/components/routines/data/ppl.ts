import type { PredefinedRoutine } from '../../ProgramDeck3DCard';

export const ROUTINE_PPL: PredefinedRoutine = {
  id: 'ppl-routine',
  name: 'PPL (Push, Pull, Legs) (نظام الدفع والسحب والأرجل)',
  category: 'Hypertrophy & Strength',
  description: 'The golden-standard 3-day split. Separates muscles by their movement mechanics for optimal recovery and growth.',
  daysRequired: 3,
  difficulty: 'Advanced',
  difficultyScore: 4,
  estTime: '60 - 75 min',
  primaryMuscles: ['Chest', 'Shoulders', 'Triceps', 'Back', 'Legs'],
  accentColor: '#0ea5e9',
  badge: 'GOLD STANDARD ⭐',
  sessions: [
    {
      title: 'Push (Chest, Shoulders, Triceps)',
      type: 'Strength',
      exercises: [
        {
          id: 'ppl-cardio-1',
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
          id: 'ppl-ex1',
          name: 'Barbell Bench Press',
          targetMuscle: 'Chest',
          restTime: 120,
          notes: 'Keep shoulder blades retracted and feet planted firmly.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex2',
          name: 'Overhead Press',
          targetMuscle: 'Shoulders',
          restTime: 90,
          notes: 'Brace your core and press the bar directly overhead.',
          videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex3',
          name: 'Incline Dumbbell Press',
          targetMuscle: 'Chest',
          restTime: 90,
          notes: 'Set bench to 30 degrees. Focus on upper chest squeeze.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex-lat-raise',
          name: 'Dumbbell Lateral Raises',
          targetMuscle: 'Shoulders',
          restTime: 60,
          notes: 'Isolate lateral deltoids for wide, 3D boulder shoulders.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/pKZ-lkKKMws',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex4',
          name: 'Tricep Pushdown',
          targetMuscle: 'Triceps',
          restTime: 60,
          notes: 'Pin elbows to ribs and flare rope at the bottom.',
          videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        }
      ]
    },
    {
      title: 'Pull (Back, Biceps, Rear Delts)',
      type: 'Strength',
      exercises: [
        {
          id: 'ppl-cardio-2',
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
          id: 'ppl-ex5',
          name: 'Lat Pulldown',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Pull elbows down toward back pockets with chest proud.',
          videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex6',
          name: 'Barbell Row',
          targetMuscle: 'Back',
          restTime: 90,
          notes: 'Hinge at hips, keep back flat and row toward lower ribcage.',
          videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex7',
          name: 'Face Pulls',
          targetMuscle: 'Shoulders',
          restTime: 60,
          notes: 'Great for rear delts and rotator cuff health. Pull to eye level.',
          videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
          sets: [
            { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex8',
          name: 'Bicep Curls',
          targetMuscle: 'Biceps',
          restTime: 60,
          notes: 'Control the descent for 2-3 seconds on each repetition.',
          videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex-hammer',
          name: 'Hammer Curls',
          targetMuscle: 'Biceps',
          restTime: 60,
          notes: 'Target the brachialis and brachioradialis for forearm thickness.',
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
      title: 'Legs (Quads, Hamstrings, Calves)',
      type: 'Strength',
      exercises: [
        {
          id: 'ppl-cardio-3',
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
          id: 'ppl-ex9',
          name: 'Squats',
          targetMuscle: 'Legs',
          restTime: 120,
          notes: 'Push knees out over toes and maintain a neutral spine.',
          videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
          sets: [
            { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex10',
          name: 'Machine Leg Press',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Do not lock out knees at peak. Keep continuous tension on quads.',
          videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex11',
          name: 'Romanian Deadlift',
          targetMuscle: 'Legs',
          restTime: 90,
          notes: 'Push hips backwards to load hamstrings. Keep spine rigid.',
          videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
          sets: [
            { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex-leg-curls',
          name: 'Lying Leg Curls',
          targetMuscle: 'Legs',
          restTime: 60,
          notes: 'Direct hamstring isolation and knee flexion.',
          videoUrl: 'https://www.youtube-nocookie.com/embed/2-LAMcpzODU',
          sets: [
            { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
            { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
          ]
        },
        {
          id: 'ppl-ex12',
          name: 'Calf Raises',
          targetMuscle: 'Calves',
          restTime: 60,
          notes: 'Pause at bottom for full calf stretch, drive onto big toes.',
          videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
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

