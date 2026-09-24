import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { WorkoutSession, SessionExercise } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

const DAYS_OF_WEEK = [
  { labelEn: 'Sunday', labelAr: 'الأحد', shortEn: 'Sun', shortAr: 'الأحد', value: 0 },
  { labelEn: 'Monday', labelAr: 'الاثنين', shortEn: 'Mon', shortAr: 'الاثنين', value: 1 },
  { labelEn: 'Tuesday', labelAr: 'الثلاثاء', shortEn: 'Tue', shortAr: 'الثلاثاء', value: 2 },
  { labelEn: 'Wednesday', labelAr: 'الأربعاء', shortEn: 'Wed', shortAr: 'الأربعاء', value: 3 },
  { labelEn: 'Thursday', labelAr: 'الخميس', shortEn: 'Thu', shortAr: 'الخميس', value: 4 },
  { labelEn: 'Friday (Rest)', labelAr: 'الجمعة (راحة)', shortEn: 'Fri', shortAr: 'الجمعة', value: 5, isRest: true },
  { labelEn: 'Saturday', labelAr: 'السبت', shortEn: 'Sat', shortAr: 'السبت', value: 6 }
];

interface PredefinedRoutine {
  id: string;
  name: string;
  category: string;
  description: string;
  daysRequired: number;
  sessions: {
    title: string;
    type: string;
    exercises: SessionExercise[];
  }[];
}

const PREDEFINED_ROUTINES: PredefinedRoutine[] = [
  {
    id: 'ppl-routine',
    name: 'PPL (Push, Pull, Legs)',
    category: 'Hypertrophy & Strength',
    description: 'The golden-standard 3-day split. Separates muscles by their movement mechanics for optimal recovery and growth.',
    daysRequired: 3,
    sessions: [
      {
        title: 'Push (Chest, Shoulders, Triceps)',
        type: 'Strength',
        exercises: [
          {
            id: 'ppl-ex1',
            name: 'Barbell Bench Press',
            targetMuscle: 'Chest',
            restTime: 120,
            notes: 'Keep shoulder blades retracted and feet planted firmly.',
            videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4',
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
            videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
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
          }
        ]
      },
      {
        title: 'Legs (Quads, Hamstrings, Calves)',
        type: 'Strength',
        exercises: [
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
  },
  {
    id: '3days-routine',
    name: '3 Days Muscle Split',
    category: 'Targeted Hypertrophy',
    description: 'Day 1: Chest, Triceps, Shoulders | Day 2: Back, Rear Delts, Biceps, Forearms | Day 3: Legs, Core',
    daysRequired: 3,
    sessions: [
      {
        title: 'Chest, Triceps, Shoulders',
        type: 'Strength',
        exercises: [
          {
            id: 'ms-ex1',
            name: 'Bench Press',
            targetMuscle: 'Chest',
            restTime: 120,
            notes: 'Classic compound lift for overall chest mass.',
            videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4',
            sets: [
              { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex2',
            name: 'Overhead Press',
            targetMuscle: 'Shoulders',
            restTime: 90,
            notes: 'Strict vertical press for shoulder caps and front delts.',
            videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex3',
            name: 'Tricep Pushdown',
            targetMuscle: 'Triceps',
            restTime: 60,
            notes: 'Lock elbows in place to isolate triceps lateral head.',
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
        title: 'Back, Rear Delts, Biceps, Forearms',
        type: 'Strength',
        exercises: [
          {
            id: 'ms-ex4',
            name: 'Lat Pulldown',
            targetMuscle: 'Back',
            restTime: 90,
            notes: 'Focus on wide V-taper wing development.',
            videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex5',
            name: 'Barbell Row',
            targetMuscle: 'Back',
            restTime: 90,
            notes: 'Thickens the lats, rhomboids, and mid-back.',
            videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex6',
            name: 'Bicep Curls',
            targetMuscle: 'Biceps',
            restTime: 60,
            notes: 'Full range of motion curl with controlled eccentric.',
            videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0',
            sets: [
              { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex7',
            name: 'Cable Wrist Curls',
            targetMuscle: 'Forearms',
            restTime: 60,
            notes: 'Strengthens grip and builds forearm roundness.',
            videoUrl: '',
            sets: [
              { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          }
        ]
      },
      {
        title: 'Legs and Core',
        type: 'Strength',
        exercises: [
          {
            id: 'ms-ex8',
            name: 'Squats',
            targetMuscle: 'Legs',
            restTime: 120,
            notes: 'Foundational lower body strength movement.',
            videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
            sets: [
              { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex9',
            name: 'Leg Press',
            targetMuscle: 'Legs',
            restTime: 90,
            notes: 'Heavy quad volume without lower back fatigue.',
            videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ms-ex10',
            name: 'Kneeling Cable Crunch',
            targetMuscle: 'Core',
            restTime: 60,
            notes: 'Curl torso down using abdominals, avoid pulling with arms.',
            videoUrl: '',
            sets: [
              { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'upper-lower-routine',
    name: 'Upper / Lower Split',
    category: 'Balanced Progression',
    description: '4-day split hitting every major muscle group twice per week for maximum hypertrophy and balanced recovery.',
    daysRequired: 4,
    sessions: [
      {
        title: 'Upper Body A (Push Focus)',
        type: 'Strength',
        exercises: [
          {
            id: 'ul-ex1',
            name: 'Barbell Bench Press',
            targetMuscle: 'Chest',
            restTime: 120,
            notes: 'Heavy compound chest press.',
            videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4',
            sets: [
              { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex2',
            name: 'Barbell Row',
            targetMuscle: 'Back',
            restTime: 90,
            notes: 'Counterbalance bench with horizontal pulling.',
            videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk',
            sets: [
              { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex3',
            name: 'Overhead Press',
            targetMuscle: 'Shoulders',
            restTime: 90,
            notes: 'Vertical push for shoulders and upper chest.',
            videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex4',
            name: 'Tricep Pushdown',
            targetMuscle: 'Triceps',
            restTime: 60,
            notes: 'Direct triceps arm work.',
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
        title: 'Lower Body A (Quad Focus)',
        type: 'Strength',
        exercises: [
          {
            id: 'ul-ex5',
            name: 'Barbell Back Squat',
            targetMuscle: 'Legs',
            restTime: 120,
            notes: 'Full depth knee flexion for quad development.',
            videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE',
            sets: [
              { id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex6',
            name: 'Romanian Deadlift',
            targetMuscle: 'Legs',
            restTime: 90,
            notes: 'Hamstring and glute loaded stretch.',
            videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex7',
            name: 'Calf Raises',
            targetMuscle: 'Calves',
            restTime: 60,
            notes: 'Deep stretch at bottom.',
            videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
            sets: [
              { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          }
        ]
      },
      {
        title: 'Upper Body B (Pull Focus)',
        type: 'Strength',
        exercises: [
          {
            id: 'ul-ex8',
            name: 'Lat Pulldown',
            targetMuscle: 'Back',
            restTime: 90,
            notes: 'Drive elbows down to waist.',
            videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex9',
            name: 'Incline Dumbbell Press',
            targetMuscle: 'Chest',
            restTime: 90,
            notes: 'Target upper clavicular head of pectoralis.',
            videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
            sets: [
              { id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex10',
            name: 'Bicep Curls',
            targetMuscle: 'Biceps',
            restTime: 60,
            notes: 'Arm hypertrophy isolation.',
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
        title: 'Lower Body B (Posterior & Core)',
        type: 'Strength',
        exercises: [
          {
            id: 'ul-ex11',
            name: 'Machine Leg Press',
            targetMuscle: 'Legs',
            restTime: 90,
            notes: 'Foot placement high on sled to recruit hamstrings/glutes.',
            videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w',
            sets: [
              { id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          },
          {
            id: 'ul-ex12',
            name: 'Kneeling Cable Crunch',
            targetMuscle: 'Core',
            restTime: 60,
            notes: 'Direct abdominal core flexion.',
            videoUrl: '',
            sets: [
              { id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false },
              { id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'full-body-routine',
    name: 'Full Body 3-Day Split',
    category: 'Efficiency & Functional',
    description: 'High-frequency 3-day training triggering maximum protein synthesis across all muscle groups every workout.',
    daysRequired: 3,
    sessions: [
      {
        title: 'Full Body Workout A',
        type: 'Strength',
        exercises: [
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
            videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4',
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
            videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
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
  }
];

export function RoutinesView() {
  const { data, saveSessions, deleteSessions } = useData();
  const { t, isRTL, formatDate, tTitle } = useTranslation();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<PredefinedRoutine | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleStart, setScheduleStart] = useState<'thisWeek' | 'nextWeek'>('thisWeek');
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const isSubmittingRef = React.useRef(false);

  if (!data) return null;

  const openSchedulingModal = (routine: PredefinedRoutine) => {
    setSelectedRoutine(routine);
    setSelectedDays([]);
    setScheduleStart('thisWeek');
    setRepeatWeeks(4);
    setReplaceExisting(true);
    setIsModalOpen(true);
  };

  const toggleDay = (dayValue: number) => {
    if (dayValue === 5) {
      alert(isRTL ? "أيام الجمعة مخصصة دائماً للراحة والاستشفاء في MyGym!" : "Fridays are strictly rest days in MyGym!");
      return;
    }

    if (selectedDays.includes(dayValue)) {
      setSelectedDays(prev => prev.filter(d => d !== dayValue));
    } else {
      if (selectedRoutine && selectedDays.length < selectedRoutine.daysRequired) {
        setSelectedDays(prev => [...prev, dayValue]);
      } else {
        alert(isRTL ? `يمكنك اختيار ${selectedRoutine?.daysRequired} أيام فقط لهذا الجدول.` : `You can only select ${selectedRoutine?.daysRequired} days for this routine.`);
      }
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutine || selectedDays.length !== selectedRoutine.daysRequired) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setIsScheduling(true);
      const sortedDays = [...selectedDays].sort((a, b) => a - b);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Current week's Sunday (day 0)
      const currentWeekSunday = startOfWeek(today, { weekStartsOn: 0 });
      let baseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSunday, 7) : currentWeekSunday;

      // If user selected "thisWeek" but all selected days for this week have already passed, roll over to next week
      if (scheduleStart === 'thisWeek') {
        const remainingThisWeek = sortedDays.filter(dayOffset => addDays(currentWeekSunday, dayOffset) >= today);
        if (remainingThisWeek.length === 0) {
          baseStart = addDays(currentWeekSunday, 7);
        }
      }

      const sessionsToSave: WorkoutSession[] = [];
      const timestamp = Date.now();

      for (let w = 0; w < repeatWeeks; w++) {
        for (let i = 0; i < sortedDays.length; i++) {
          if (i >= selectedRoutine.sessions.length) break;

          const dayOffset = sortedDays[i]; // 0-6 (Sun-Sat)
          const targetDate = addDays(baseStart, w * 7 + dayOffset);
          targetDate.setHours(18, 0, 0, 0); // 6:00 PM default

          // CRITICAL: NEVER schedule sessions on past days!
          if (targetDate < today) {
            continue;
          }

          // Use consistent local date slice format (compatible with Calendar & SessionDetail)
          const dateStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
          const sessionTemplate = selectedRoutine.sessions[i];

          // Generate fresh unique IDs for sets and exercises in each scheduled session
          const exercises: SessionExercise[] = sessionTemplate.exercises.map((ex, exIdx) => ({
            ...ex,
            id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}`,
            sets: ex.sets.map((set, setIdx) => ({
              ...set,
              id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}-s${setIdx}`,
              repsActual: 0,
              isCompleted: false
            }))
          }));

          sessionsToSave.push({
            id: `${timestamp}-w${w}-d${dayOffset}`,
            title: sessionTemplate.title,
            date: dateStr,
            duration: 60,
            type: sessionTemplate.type,
            notes: `Routine: ${selectedRoutine.name}${repeatWeeks > 1 ? ` (Week ${w + 1})` : ''}`,
            isCompleted: false,
            exercises
          });
        }
      }

      // If replaceExisting is true, remove any uncompleted sessions on these scheduled dates from TODAY forward
      if (replaceExisting && data && data.sessions.length > 0 && sessionsToSave.length > 0) {
        const targetDatesSet = new Set(
          sessionsToSave.map(s => format(new Date(s.date), 'yyyy-MM-dd'))
        );
        const oldSessionsToDelete = data.sessions
          .filter(s => {
            if (s.isCompleted) return false;
            const sessionDate = new Date(s.date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= today && targetDatesSet.has(format(new Date(s.date), 'yyyy-MM-dd'));
          })
          .map(s => s.id);

        if (oldSessionsToDelete.length > 0) {
          await deleteSessions(oldSessionsToDelete);
        }
      }

      await saveSessions(sessionsToSave);
      setIsModalOpen(false);
      navigate('/calendar');
    } catch (error) {
      console.error('Failed to schedule routine:', error);
      alert(t('scheduleRoutineError'));
    } finally {
      setIsScheduling(false);
      isSubmittingRef.current = false;
    }
  };

  // Helper to preview when the workouts will be scheduled
  const getSchedulePreview = () => {
    if (!selectedRoutine || selectedDays.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekSunday = startOfWeek(today, { weekStartsOn: 0 });
    const sortedDays = [...selectedDays].sort((a, b) => a - b);

    let effectiveBaseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSunday, 7) : currentWeekSunday;
    let startsNextWeekAutomatically = false;

    if (scheduleStart === 'thisWeek') {
      const remainingThisWeek = sortedDays.filter(dayOffset => addDays(currentWeekSunday, dayOffset) >= today);
      if (remainingThisWeek.length === 0) {
        effectiveBaseStart = addDays(currentWeekSunday, 7);
        startsNextWeekAutomatically = true;
      }
    }

    let firstDateObj: Date | null = null;
    let totalWorkouts = 0;

    for (let w = 0; w < repeatWeeks; w++) {
      for (let i = 0; i < sortedDays.length; i++) {
        if (i >= selectedRoutine.sessions.length) break;
        const dayOffset = sortedDays[i];
        const targetDate = addDays(effectiveBaseStart, w * 7 + dayOffset);
        targetDate.setHours(18, 0, 0, 0);
        if (targetDate >= today) {
          totalWorkouts++;
          if (!firstDateObj) {
            firstDateObj = targetDate;
          }
        }
      }
    }

    return {
      firstDate: firstDateObj ? formatDate(firstDateObj, 'EEEE, d MMMM') : formatDate(today, 'EEEE, d MMMM'),
      totalWorkouts,
      startsNextWeekAutomatically,
      hasExcludedPastDays: scheduleStart === 'thisWeek' && !startsNextWeekAutomatically && sortedDays.some(d => addDays(currentWeekSunday, d) < today)
    };
  };

  const preview = getSchedulePreview();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="page-surface routines-page flex-col h-full" 
      style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}
    >
      {/* Header Area */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{t('routinesLibrary')}</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {t('routinesHeroDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAIModalOpen(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.8rem 1.4rem',
            borderRadius: '0.85rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            border: 'none',
            color: '#fff',
            boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.4)',
            cursor: 'pointer'
          }}
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>{t('generateWithAI')}</span>
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ 
        padding: '1rem 1.25rem', 
        marginBottom: '2rem', 
        backgroundColor: 'rgba(14, 165, 233, 0.08)', 
        border: '1px solid rgba(14, 165, 233, 0.25)', 
        borderRadius: '1rem', 
        color: 'var(--text-primary)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.85rem' 
      }}>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '50%', 
          backgroundColor: 'rgba(14, 165, 233, 0.15)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--accent-primary)'
        }}>
          <Calendar className="w-5 h-5" />
        </div>
        <div style={{ fontSize: '0.925rem' }}>
          <strong style={{ color: 'var(--accent-primary)' }}>{isRTL ? 'التكامل مع التقويم: ' : 'Calendar Integration: '}</strong>
          {isRTL 
            ? 'اختر أي جدول أدناه لتحديد أيام تمرينك. يمكنك البدء فوراً هذا الأسبوع أو بدءاً من الأسبوع القادم مع جدولة لعدة أسابيع.'
            : 'Select any routine below to pick your training days. You can start immediately This Week or starting Next Week with multi-week scheduling.'
          }
        </div>
      </div>

      {/* Routines Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', paddingBottom: '2rem' }}>
        {PREDEFINED_ROUTINES.map(routine => (
          <motion.div 
            key={routine.id} 
            className="card routine-card" 
            whileHover={{ y: -5 }} 
            whileTap={{ scale: 0.985 }} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              cursor: 'pointer', 
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
              border: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              textAlign: isRTL ? 'right' : 'left'
            }} 
            onClick={() => openSchedulingModal(routine)}
          >
            {/* Category tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: 'var(--accent-primary)',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.5rem'
              }}>
                {routine.category}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers className="w-3.5 h-3.5" />
                {routine.daysRequired} {isRTL ? 'أيام/أسبوع' : 'days/wk'}
              </span>
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              {tTitle(routine.name)}
            </h3>

            <p style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              {routine.description}
            </p>

            {/* Sessions preview pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {routine.sessions.map((sess, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    fontSize: '0.8rem', 
                    padding: '0.35rem 0.65rem', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {isRTL ? `اليوم ${idx + 1}: ${tTitle(sess.title.split('(')[0].trim())}` : `Day ${idx + 1}: ${sess.title.split('(')[0].trim()}`}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {sess.exercises.length} {t('exercises')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {isRTL ? 'يتضمن شروحات بالفيديو' : 'Includes video demonstrations'}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openSchedulingModal(routine);
                }}
              >
                <span>{isRTL ? 'تطبيق الجدول' : 'Apply Routine'}</span>
                <ArrowRight className="w-4 h-4" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scheduling Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isScheduling && setIsModalOpen(false)} 
        title={isRTL ? `تطبيق ${tTitle(selectedRoutine?.name || '')}` : `Apply ${selectedRoutine?.name}`}
      >
        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: isRTL ? 'right' : 'left' }}>
          
          {/* Step 1: Days of Week */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {isRTL ? '1. اختر أيام التمرين' : '1. Select Workout Days'}
              </label>
              <span style={{ 
                fontSize: '0.825rem', 
                fontWeight: 600, 
                color: selectedDays.length === selectedRoutine?.daysRequired ? 'var(--success)' : 'var(--warning)' 
              }}>
                {selectedDays.length} / {selectedRoutine?.daysRequired} {isRTL ? 'محدد' : 'selected'}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              {isRTL 
                ? <>اختر بالضبط <strong>{selectedRoutine?.daysRequired} أيام</strong> في الأسبوع. (يوم الجمعة مخصص للراحة والاستشفاء).</>
                : <>Pick exactly <strong>{selectedRoutine?.daysRequired} days</strong> per week. (Friday is reserved as a mandatory rest day for recovery).</>
              }
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem' }}>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.value);
                const isDisabled = day.isRest || (!isSelected && selectedDays.length >= (selectedRoutine?.daysRequired || 0));

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    disabled={isDisabled}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '0.6rem',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: isSelected 
                        ? 'rgba(14, 165, 233, 0.15)' 
                        : (day.isRest ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)'),
                      color: isSelected 
                        ? 'var(--accent-primary)' 
                        : (day.isRest ? 'rgba(239, 68, 68, 0.6)' : (isDisabled ? 'var(--text-muted)' : 'var(--text-primary)')),
                      cursor: isDisabled && !isSelected ? 'not-allowed' : 'pointer',
                      fontWeight: isSelected ? 600 : 500,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      fontSize: '0.85rem',
                      opacity: isDisabled && !isSelected ? 0.45 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{isRTL ? day.shortAr : day.shortEn}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                      {day.isRest ? (isRTL ? 'يوم راحة' : 'Rest Day') : (isRTL ? day.labelAr : day.labelEn)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: When to Start */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isRTL ? '2. موعد البدء' : '2. When to Start'}
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setScheduleStart('thisWeek')}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${scheduleStart === 'thisWeek' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                  backgroundColor: scheduleStart === 'thisWeek' ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-secondary)',
                  color: scheduleStart === 'thisWeek' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textAlign: isRTL ? 'right' : 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isRTL ? 'هذا الأسبوع' : 'This Week'}</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    backgroundColor: 'var(--accent-primary)', 
                    color: '#fff', 
                    padding: '0.15rem 0.45rem', 
                    borderRadius: '1rem',
                    fontWeight: 700 
                  }}>
                    {isRTL ? 'موصى به' : 'RECOMMENDED'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  {isRTL ? 'يبدأ فوراً في أسبوعك الحالي بالتقويم.' : 'Starts immediately on your current calendar view.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScheduleStart('nextWeek')}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${scheduleStart === 'nextWeek' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                  backgroundColor: scheduleStart === 'nextWeek' ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-secondary)',
                  color: scheduleStart === 'nextWeek' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textAlign: isRTL ? 'right' : 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {isRTL ? 'الأسبوع القادم' : 'Next Week'}
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  {isRTL ? 'يبدأ اعتباراً من الأحد القادم.' : 'Starts starting next Sunday.'}
                </p>
              </button>
            </div>
          </div>

          {/* Step 3: Duration / Repeat */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isRTL ? '3. مدة البرنامج التدريبي' : '3. Program Duration'}
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { weeks: 1, labelEn: '1 Week', labelAr: 'أسبوع 1', descEn: 'Trial', descAr: 'تجربة' },
                { weeks: 4, labelEn: '4 Weeks', labelAr: '4 أسابيع', descEn: 'Standard', descAr: 'شائع', isDefault: true },
                { weeks: 8, labelEn: '8 Weeks', labelAr: '8 أسابيع', descEn: 'Mesocycle', descAr: 'دورة تدريب' },
                { weeks: 12, labelEn: '12 Weeks', labelAr: '12 أسبوع', descEn: 'Full Block', descAr: 'برنامج كامل' },
              ].map(opt => {
                const isSelected = repeatWeeks === opt.weeks;
                return (
                  <button
                    key={opt.weeks}
                    type="button"
                    onClick={() => setRepeatWeeks(opt.weeks)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '0.6rem',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {isRTL ? opt.labelAr : opt.labelEn}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {opt.isDefault ? (isRTL ? 'الأكثر طلباً' : 'Popular') : (isRTL ? opt.descAr : opt.descEn)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Overwrite / Replace */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {isRTL ? 'استبدال التمارين السابقة في هذه الأيام' : 'Replace existing routine workouts on these days'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {isRTL ? 'يمنع تكرار الجلسات إذا أعدت الجدولة أو غيرت البرنامج.' : 'Prevents duplicate workouts if you re-schedule or change routines.'}
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={replaceExisting} 
              onChange={(e) => setReplaceExisting(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Schedule Summary Banner */}
          {preview && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '0.75rem',
                color: 'var(--success)',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                <div>
                  {isRTL ? (
                    <>
                      جاهز لجدولة <strong>{preview.totalWorkouts} جلسة تدريبية</strong> عبر {repeatWeeks} {repeatWeeks === 1 ? 'أسبوع' : 'أسابيع'}. الجلسة الأولى ستكون في <strong>{preview.firstDate}</strong>.
                    </>
                  ) : (
                    <>
                      Ready to schedule <strong>{preview.totalWorkouts} workout sessions</strong> across {repeatWeeks} {repeatWeeks === 1 ? 'week' : 'weeks'}. 
                      First session will be on <strong>{preview.firstDate}</strong>.
                    </>
                  )}
                </div>
              </div>

              {preview.startsNextWeekAutomatically && (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', paddingRight: isRTL ? '1.6rem' : 0, paddingLeft: isRTL ? 0 : '1.6rem' }}>
                  ℹ️ {t('routineStartsNextWeekNotice')}
                </div>
              )}

              {preview.hasExcludedPastDays && !preview.startsNextWeekAutomatically && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingRight: isRTL ? '1.6rem' : 0, paddingLeft: isRTL ? 0 : '1.6rem' }}>
                  ⚡ {t('pastDaysExcluded')}
                </div>
              )}
            </motion.div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              disabled={isScheduling}
              onClick={() => setIsModalOpen(false)}
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={selectedDays.length !== selectedRoutine?.daysRequired || isScheduling}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '160px', justifyContent: 'center' }}
            >
              {isScheduling ? (
                <span>{isRTL ? 'جاري الإضافة للتقويم...' : 'Adding to Calendar...'}</span>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>{isRTL ? 'تطبيق على التقويم' : 'Apply to Calendar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Workout Generator Modal */}
      <AIWorkoutGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </motion.div>
  );
}
