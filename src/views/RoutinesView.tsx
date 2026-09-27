import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Sparkles, Activity, Zap } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { WorkoutSession, SessionExercise } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal, Button } from '../components/ui';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';
import { InteractiveMuscleMapModal } from '../components/InteractiveMuscleMapModal';
import { ProgramDeck3DCard, PredefinedRoutine } from '../components/ProgramDeck3DCard';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { getExerciseTutorial } from '../lib/exerciseDatabase';

const DAYS_OF_WEEK = [
  { labelEn: 'Saturday', labelAr: 'السبت', shortEn: 'Sat', shortAr: 'السبت', value: 0 },
  { labelEn: 'Sunday', labelAr: 'الأحد', shortEn: 'Sun', shortAr: 'الأحد', value: 1 },
  { labelEn: 'Monday', labelAr: 'الاثنين', shortEn: 'Mon', shortAr: 'الاثنين', value: 2 },
  { labelEn: 'Tuesday', labelAr: 'الثلاثاء', shortEn: 'Tue', shortAr: 'الثلاثاء', value: 3 },
  { labelEn: 'Wednesday', labelAr: 'الأربعاء', shortEn: 'Wed', shortAr: 'الأربعاء', value: 4 },
  { labelEn: 'Thursday', labelAr: 'الخميس', shortEn: 'Thu', shortAr: 'الخميس', value: 5 },
  { labelEn: 'Friday (Gym Closed)', labelAr: 'الجمعة (الجيم مغلق)', shortEn: 'Fri', shortAr: 'الجمعة', value: 6, isClosed: true }
];

const PREDEFINED_ROUTINES: PredefinedRoutine[] = [
  {
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
  },
  {
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
  },
  {
    id: 'upper-lower-routine',
    name: 'Upper / Lower Split',
    category: 'Balanced Progression',
    description: '4-day split hitting every major muscle group twice per week for maximum hypertrophy and balanced recovery.',
    daysRequired: 4,
    difficulty: 'Intermediate',
    difficultyScore: 3,
    estTime: '55 - 70 min',
    primaryMuscles: ['Upper Body', 'Lower Body', 'Core'],
    accentColor: '#8b5cf6',
    badge: 'HYPERTROPHY 2X 🚀',
    sessions: [
      {
        title: 'Upper Body A (Push Focus)',
        type: 'Strength',
        exercises: [
          {
            id: 'ul-cardio-1',
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
            id: 'ul-ex1',
            name: 'Barbell Bench Press',
            targetMuscle: 'Chest',
            restTime: 120,
            notes: 'Heavy compound chest press.',
            videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE',
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
            id: 'ul-cardio-2',
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
            id: 'ul-cardio-3',
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
            videoUrl: 'https://www.youtube-nocookie.com/embed/8fXfwG4ftaQ',
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
            id: 'ul-cardio-4',
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  }
];

export function RoutinesView() {
  const { data, saveSessions, deleteSessions } = useData();
  const { t, isRTL, formatDate, tTitle } = useTranslation();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isMuscleMapOpen, setIsMuscleMapOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<PredefinedRoutine | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleStart, setScheduleStart] = useState<'thisWeek' | 'nextWeek'>('thisWeek');
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const isSubmittingRef = React.useRef(false);

  if (!data) return null;

  const openSchedulingModal = (routine: PredefinedRoutine, preselectedDays: number[] = []) => {
    setSelectedRoutine(routine);
    setSelectedDays(preselectedDays);
    setScheduleStart('thisWeek');
    setRepeatWeeks(4);
    setReplaceExisting(true);
    setIsModalOpen(true);
  };

  const handleQuickApplySplit = (routineId: string, defaultDays: number[]) => {
    const routine = PREDEFINED_ROUTINES.find(r => r.id === routineId);
    if (!routine) return;
    openSchedulingModal(routine, defaultDays);
    notify(
      isRTL
        ? `تم تجهيز ${tTitle(routine.name)} بجدول الأيام المقترح! اضغط تأكيد للبدء.`
        : `Ready to schedule ${routine.name} with optimal rest days pre-selected!`,
      'success'
    );
  };

  const toggleDay = (dayValue: number) => {
    if (dayValue === 5) {
      notify(isRTL ? "الجمعة عطلة أسبوعية والجيم مغلق دائماً!" : "Friday is an off-day — the gym is closed every Friday!", 'warning');
      return;
    }

    if (selectedDays.includes(dayValue)) {
      setSelectedDays(prev => prev.filter(d => d !== dayValue));
    } else {
      if (selectedRoutine && selectedDays.length < selectedRoutine.daysRequired) {
        setSelectedDays(prev => [...prev, dayValue]);
      } else {
        notify(isRTL ? `يمكنك اختيار ${selectedRoutine?.daysRequired} أيام فقط لهذا الجدول.` : `You can only select ${selectedRoutine?.daysRequired} days for this routine.`, 'warning');
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

      // Current week's Saturday (day 0)
      const currentWeekSaturday = startOfWeek(today, { weekStartsOn: 6 });
      let baseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSaturday, 7) : currentWeekSaturday;

      // If user selected "thisWeek" but all selected days for this week have already passed, roll over to next week
      if (scheduleStart === 'thisWeek') {
        const remainingThisWeek = sortedDays.filter(dayOffset => addDays(currentWeekSaturday, dayOffset) >= today);
        if (remainingThisWeek.length === 0) {
          baseStart = addDays(currentWeekSaturday, 7);
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
          let exercises: SessionExercise[] = sessionTemplate.exercises.map((ex, exIdx) => {
            const tutorial = getExerciseTutorial(ex.name, ex.targetMuscle);
            return {
              ...ex,
              videoUrl: ex.videoUrl || tutorial.videoUrl,
              id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}`,
              sets: ex.sets.map((set, setIdx) => ({
                ...set,
                id: `${timestamp}-w${w}-d${dayOffset}-ex${exIdx}-s${setIdx}`,
                repsActual: 0,
                isCompleted: false
              }))
            };
          });

          // Ensure workout session strictly starts with cardio warm-up
          const startsWithCardio = exercises.length > 0 && (
            exercises[0].targetMuscle.toLowerCase() === 'cardio' ||
            exercises[0].name.toLowerCase().includes('cardio') ||
            exercises[0].name.toLowerCase().includes('treadmill') ||
            exercises[0].name.toLowerCase().includes('bike') ||
            exercises[0].name.toLowerCase().includes('rowing')
          );

          if (!startsWithCardio) {
            exercises = [
              {
                id: `${timestamp}-w${w}-d${dayOffset}-cardio`,
                name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
                targetMuscle: 'Cardio',
                restTime: 60,
                notes: '5-10 minutes of light aerobic warm-up to prepare joints and elevate core temperature.',
                duration: 10,
                videoUrl: 'https://www.youtube-nocookie.com/embed/9L2b2khySLE',
                sets: [
                  {
                    id: `${timestamp}-w${w}-d${dayOffset}-cardio-s1`,
                    weight: 0,
                    repsTarget: 10,
                    repsActual: 10,
                    unit: 'kg',
                    isCompleted: false
                  }
                ]
              },
              ...exercises
            ];
          }

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
      notify(t('scheduleRoutineError'), 'error');
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
    const currentWeekSaturday = startOfWeek(today, { weekStartsOn: 6 });
    const sortedDays = [...selectedDays].sort((a, b) => a - b);

    let effectiveBaseStart = scheduleStart === 'nextWeek' ? addDays(currentWeekSaturday, 7) : currentWeekSaturday;
    let startsNextWeekAutomatically = false;

    if (scheduleStart === 'thisWeek') {
      const remainingThisWeek = sortedDays.filter(dayOffset => addDays(currentWeekSaturday, dayOffset) >= today);
      if (remainingThisWeek.length === 0) {
        effectiveBaseStart = addDays(currentWeekSaturday, 7);
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
      hasExcludedPastDays: scheduleStart === 'thisWeek' && !startsNextWeekAutomatically && sortedDays.some(d => addDays(currentWeekSaturday, d) < today)
    };
  };

  const preview = getSchedulePreview();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="zen-page-container routines-page" 
    >
      {/* Header Area */}
      <div className="zen-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            <h1 style={{ margin: 0 }}>{t('routinesLibrary')}</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('routinesHeroDesc')}
          </p>
        </div>
        <div className="routines-header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsMuscleMapOpen(true)}
            className="zen-pill-btn routines-muscle-map-btn"
            style={{
              background: 'rgba(70, 217, 255, 0.08)',
              border: '1px solid rgba(70, 217, 255, 0.25)',
              color: '#46d9ff',
              padding: '0.65rem 1.15rem'
            }}
          >
            <Activity size={17} />
            <span>{t('muscleMapTitle')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="btn-primary routines-ai-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '999px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{t('generateWithAI')}</span>
          </button>
        </div>
      </div>

      {/* 1-Tap Split Builder Bar */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem 1.15rem',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.75) 100%)',
          border: '1px solid rgba(198, 244, 50, 0.25)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(198, 244, 50, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          textAlign: isRTL ? 'right' : 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(198, 244, 50, 0.15)',
                border: '1px solid rgba(198, 244, 50, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c6f432'
              }}
            >
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  {isRTL ? 'منشئ التقسيمات بنقرة واحدة' : '1-Tap Split Builder'}
                </h4>
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.55rem', borderRadius: '999px', background: '#c6f432', color: '#090d16', fontWeight: 900 }}>
                  VIP INSTANT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {isRTL
                  ? 'اختر أي تقسيم عالمي بنقرة واحدة ليتم ضبط أيام التمرين وأوقات الاستشفاء آلياً'
                  : 'Deploy any world-class split with 1 tap — auto-populates schedule with optimal recovery days'}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Quick Split Pills */}
        <div
          className="split-quick-builder-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '0.75rem'
          }}
        >
          {/* PPL Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickApplySplit('ppl-routine', [0, 2, 4])}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.85rem',
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#38bdf8' }}>Push / Pull / Legs</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
                3 {isRTL ? 'أيام' : 'days'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isRTL ? 'أحد • ثلاثاء • خميس' : 'Sun • Tue • Thu'}
            </span>
          </motion.button>

          {/* Upper / Lower Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickApplySplit('upper-lower-routine', [6, 0, 2, 3])}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.85rem',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#a78bfa' }}>Upper / Lower</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
                4 {isRTL ? 'أيام' : 'days'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isRTL ? 'سبت • أحد • ثلاثاء • أربعاء' : 'Sat • Sun • Tue • Wed'}
            </span>
          </motion.button>

          {/* Arnold Split Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickApplySplit('arnold-split', [6, 1, 3])}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.85rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#fbbf24' }}>Arnold Split 🏆</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
                3 {isRTL ? 'أيام' : 'days'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isRTL ? 'سبت • اثنين • أربعاء' : 'Sat • Mon • Wed'}
            </span>
          </motion.button>

          {/* Full Body Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickApplySplit('full-body-routine', [0, 2, 4])}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.85rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              textAlign: isRTL ? 'right' : 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#34d399' }}>Full Body 3x</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
                3 {isRTL ? 'أيام' : 'days'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isRTL ? 'أحد • ثلاثاء • خميس' : 'Sun • Tue • Thu'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Routines Grid */}
      <div className="routines-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
        {PREDEFINED_ROUTINES.map(routine => (
          <ProgramDeck3DCard
            key={routine.id}
            routine={routine}
            onApply={openSchedulingModal}
            isRTL={isRTL}
            t={t}
            tTitle={tTitle}
          />
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
                ? <>اختر <strong>{selectedRoutine?.daysRequired} أيام</strong> في الأسبوع لجدولة الجلسات عليها.</>
                : <>Select <strong>{selectedRoutine?.daysRequired} days</strong> per week to schedule this routine.</>
              }
            </p>

            <div className="day-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 95px), 1fr))', gap: '0.5rem' }}>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.value);
                const isClosed = day.value === 5;
                const isDisabled = isClosed || (!isSelected && selectedDays.length >= (selectedRoutine?.daysRequired || 0));

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    disabled={isDisabled}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '0.75rem',
                      border: `1px solid ${isSelected ? 'var(--brand-primary, #38bdf8)' : isClosed ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: isSelected 
                        ? 'rgba(14, 165, 233, 0.15)' 
                        : isClosed ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
                      color: isSelected 
                        ? 'var(--brand-primary, #38bdf8)' 
                        : isClosed ? '#ef4444' : (isDisabled ? 'var(--text-muted)' : 'var(--text-primary)'),
                      cursor: isDisabled && !isSelected ? 'not-allowed' : 'pointer',
                      fontWeight: isSelected ? 600 : 500,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      fontSize: '0.85rem',
                      opacity: isClosed ? 0.6 : (isDisabled && !isSelected ? 0.45 : 1),
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{isRTL ? day.shortAr : day.shortEn}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', opacity: isClosed ? 0.9 : 0.75 }}>
                      {isClosed ? (isRTL ? '🔒 مغلق' : '🔒 Closed') : (isRTL ? day.labelAr : day.labelEn)}
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
            <Button 
              type="button" 
              variant="secondary"
              disabled={isScheduling}
              onClick={() => setIsModalOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              isLoading={isScheduling}
              disabled={selectedDays.length !== selectedRoutine?.daysRequired || isScheduling}
              style={{ minWidth: '170px' }}
            >
              <Calendar className="w-4 h-4 mr-1.5 ml-1.5" />
              <span>{isRTL ? 'تطبيق على التقويم' : 'Apply to Calendar'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Workout Generator Modal */}
      <AIWorkoutGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Interactive Muscle Map Modal */}
      <InteractiveMuscleMapModal
        isOpen={isMuscleMapOpen}
        onClose={() => setIsMuscleMapOpen(false)}
      />
    </motion.div>
  );
}
