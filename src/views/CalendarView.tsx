import { useState, useEffect } from 'react';
import { 
  addDays, format, isSameDay, startOfWeek 
} from 'date-fns';
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Moon, Dumbbell, Clock, 
  Check, Sparkles, Utensils, Trophy, Apple, ChevronDown, 
  ChevronUp, Droplets, Flame, RotateCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WorkoutSession, SessionExercise, estimateWorkoutCalories, MealRecord, HistoryRecord } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';

import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { gymAudio } from '../lib/audio';

export function CalendarView() {
  const { data, saveSession, saveSessions, deleteSession, deleteSessions, finishWorkoutSession } = useData();
  const { t, formatDate, tTitle, tMuscle, tExercise, isRTL } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Modal state for NEW sessions only
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<WorkoutSession> | null>(null);
  const [selectedRibbonDay, setSelectedRibbonDay] = useState<Date>(new Date());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const tabParam = searchParams.get('tab');
  const [dayActiveTab, setDayActiveTab] = useState<'all' | 'planned' | 'workouts' | 'nutrition'>(() => {
    if (tabParam === 'workouts' || tabParam === 'planned' || tabParam === 'nutrition' || tabParam === 'all') {
      return tabParam;
    }
    return 'all';
  });

  useEffect(() => {
    if (tabParam === 'workouts' || tabParam === 'planned' || tabParam === 'nutrition' || tabParam === 'all') {
      setDayActiveTab(tabParam);
    }
  }, [tabParam]);
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Record<string, boolean>>({});

  const toggleWorkoutExpand = (id: string) => {
    setExpandedWorkoutIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRepeatWorkout = (snapshot: WorkoutSession) => {
    const targetDate = addDays(selectedRibbonDay, 1);
    if (targetDate.getDay() === 5) {
      targetDate.setDate(targetDate.getDate() + 1); // skip Friday (closed)
    }
    targetDate.setHours(18, 0, 0, 0);
    const dateStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    
    setEditingSession({
      title: snapshot.title,
      type: snapshot.type,
      duration: snapshot.duration || 60,
      date: dateStr,
      notes: `Repeated from ${formatDate(selectedRibbonDay, 'dd MMM yyyy')}`,
      exercises: (snapshot.exercises || []).map((ex, exIdx) => ({
        ...ex,
        id: `ex-${Date.now()}-${exIdx}`,
        sets: (ex.sets || []).map((s, idx) => ({
          ...s,
          id: `s-${Date.now()}-${exIdx}-${idx}`,
          repsActual: 0,
          isCompleted: false
        }))
      }))
    });
    setIsModalOpen(true);
  };



  if (!data) return null;

  // Find duplicate sessions (sessions that share the same date YYYY-MM-DD and normalized title)
  const duplicateSessionIds: string[] = [];
  if (data?.sessions && data.sessions.length > 1) {
    const seen = new Map<string, string>();
    const sorted = [...data.sessions].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
      return b.id.localeCompare(a.id);
    });
    for (const s of sorted) {
      const dayKey = format(new Date(s.date), 'yyyy-MM-dd');
      const normTitle = s.title.toLowerCase().trim();
      const key = `${dayKey}__${normTitle}`;
      if (seen.has(key)) {
        duplicateSessionIds.push(s.id);
      } else {
        seen.set(key, s.id);
      }
    }
  }

  // Find uncompleted sessions from past days (to give users a one-click cleanup)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const pastIncompleteSessionIds: string[] = [];
  if (data?.sessions && data.sessions.length > 0) {
    for (const s of data.sessions) {
      if (!s.isCompleted) {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate < todayStart) {
          pastIncompleteSessionIds.push(s.id);
        }
      }
    }
  }

  // Align start of week with user's settings (Saturday by default)
  const weekStartsOnSetting = data.settings?.weekStartsOn;
  const weekStartsOn = weekStartsOnSetting === 'monday' 
    ? 1 
    : weekStartsOnSetting === 'sunday' 
    ? 0 
    : 6; // Default to Saturday (6): strictly Saturday to Friday
  const startDate = startOfWeek(currentDate, { weekStartsOn });
  startDate.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const endDate = weekDays[6]; // Friday
  const isCurrentWeek = isSameDay(startDate, startOfWeek(new Date(), { weekStartsOn }));

  // Planned sessions calculations for clearing
  const allPlannedSessions = (data?.sessions || []).filter(s => !s.isCompleted);
  const thisWeekPlannedSessions = (data?.sessions || []).filter(s => {
    if (s.isCompleted) return false;
    const sDate = new Date(s.date);
    return sDate >= startDate && sDate <= addDays(endDate, 1);
  });
  const selectedDayPlannedSessions = (data?.sessions || []).filter(s => {
    return !s.isCompleted && isSameDay(new Date(s.date), selectedRibbonDay);
  });

  const handleClearPlanned = async (scope: 'week' | 'all' | 'day') => {
    let targetSessions: WorkoutSession[] = [];
    let label = '';

    if (scope === 'week') {
      targetSessions = thisWeekPlannedSessions;
      label = isRTL ? 'تمارين هذا الأسبوع' : "this week's workouts";
    } else if (scope === 'all') {
      targetSessions = allPlannedSessions;
      label = isRTL ? 'جميع التمارين المجدولة' : 'all planned workouts';
    } else if (scope === 'day') {
      targetSessions = selectedDayPlannedSessions;
      label = isRTL ? `تمارين يوم ${formatDate(selectedRibbonDay, 'EEEE')}` : `workouts for ${formatDate(selectedRibbonDay, 'EEEE')}`;
    }

    if (targetSessions.length === 0) {
      notify(isRTL ? 'لا توجد تمارين مجدولة للمسح' : 'No planned workouts to clear', 'info');
      setIsClearModalOpen(false);
      return;
    }

    try {
      setIsClearing(true);
      gymAudio.triggerVibration([30, 50, 30]);
      await deleteSessions(targetSessions.map(s => s.id));
      notify(
        isRTL 
          ? `تم مسح ${targetSessions.length} من ${label} بنجاح` 
          : `Successfully cleared ${targetSessions.length} from ${label}`,
        'success'
      );
      setIsClearModalOpen(false);
    } catch {
      notify(isRTL ? 'حدث خطأ أثناء المسح' : 'Failed to clear workouts', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    // Friday (5) is always an off-day because the gym is closed
    if (editingSession?.date && new Date(editingSession.date).getDay() === 5) {
      notify(t('restDayAlert'), 'warning');
      return;
    }

    const newSession = {
      ...editingSession,
      id: editingSession?.id || Date.now().toString(),
      isCompleted: editingSession?.isCompleted || false,
      exercises: editingSession?.exercises || [],
    } as WorkoutSession;

    await saveSession(newSession);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!data) return;
    if (!confirm(t('deleteSessionConfirm'))) return;
    
    await deleteSession(id);
  };


  const openNewModal = (dayDate?: Date) => {
    let defaultDate = new Date();
    if (dayDate) {
      defaultDate = new Date(dayDate);
    }
    
    // If selected day is in the past, default to today
    if (defaultDate < todayStart) {
      defaultDate = new Date();
    }

    // Friday (5) is a rest day, default to Saturday instead
    if (defaultDate.getDay() === 5) {
      defaultDate = addDays(defaultDate, 1);
    }
    
    defaultDate.setHours(18, 0, 0, 0);
    const dateStr = new Date(defaultDate.getTime() - (defaultDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    setEditingSession({
      title: '',
      type: 'Strength',
      date: dateStr,
      duration: 60,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCompleteSingleSession = async (session: WorkoutSession) => {
    if (!data) return;
    gymAudio.triggerSubtleHaptic([30, 50]);
    const updated = { 
      ...session, 
      isCompleted: true, 
      date: session.date || format(selectedRibbonDay, 'yyyy-MM-dd') 
    };
    await finishWorkoutSession(updated);
    setDayActiveTab('workouts');
    notify(isRTL ? 'تم إنهاء التمرين ونقله إلى سجل التمارين فورا!' : 'Workout finished and moved to history immediately!', 'success');
  };



  const generatePPL = async () => {
    if (!data) return;
    
    // We map days of week:
    // 0: Sunday (Pull), 1: Monday (Legs), 2: Tuesday (Push), 3: Wednesday (Pull), 4: Thursday (Legs), 5: Friday (Rest), 6: Saturday (Push)
    const newSessions: WorkoutSession[] = [];
    const baseDate = new Date();
    baseDate.setHours(18, 0, 0, 0); // 6:00 PM default time

    for (let i = 0; i < 28; i++) { // 4 weeks
      const d = addDays(baseDate, i);
      const dayOfWeek = d.getDay();
      
      if (dayOfWeek === 5) continue; // Friday is Rest
      
      let title = '';
      let exercises: SessionExercise[] = [];
      
      if (dayOfWeek === 6 || dayOfWeek === 2) {
        title = 'Push (Chest, Shoulders, Triceps)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Bench Press', targetMuscle: 'Chest', restTime: 90, notes: '', videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Overhead Press', targetMuscle: 'Shoulders', restTime: 90, notes: '', videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Tricep Pushdown', targetMuscle: 'Triceps', restTime: 60, notes: '', videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U', sets: [{id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      } else if (dayOfWeek === 0 || dayOfWeek === 3) {
        title = 'Pull (Back, Biceps)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Pull-Ups', targetMuscle: 'Back', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Barbell Row', targetMuscle: 'Back', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Bicep Curls', targetMuscle: 'Biceps', restTime: 60, notes: '', sets: [{id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      } else if (dayOfWeek === 1 || dayOfWeek === 4) {
        title = 'Legs (Quads, Hamstrings)';
        exercises = [
          { id: Date.now()+Math.random()+'', name: 'Squats', targetMuscle: 'Legs', restTime: 120, notes: '', sets: [{id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Leg Press', targetMuscle: 'Legs', restTime: 90, notes: '', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
          { id: Date.now()+Math.random()+'', name: 'Calf Raises', targetMuscle: 'Calves', restTime: 60, notes: '', sets: [{id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}] }
        ];
      }

      // Ensure session starts with cardio warmup
      const cardioWarmup: SessionExercise = {
        id: Date.now() + Math.random() + '-cardio',
        name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
        targetMuscle: 'Cardio',
        restTime: 60,
        notes: '5-10 minutes of aerobic warm-up to prepare joints and elevate core temperature.',
        duration: 10,
        sets: [{ id: 'cardio-s1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'lb', isCompleted: false }]
      };
      exercises = [cardioWarmup, ...exercises];

      const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      
      newSessions.push({
        id: Date.now().toString() + i,
        title,
        date: dateStr,
        duration: 60,
        type: 'Strength',
        notes: 'Auto-generated PPL routine.',
        isCompleted: false,
        exercises
      });
    }

    await saveSessions(newSessions);
  };

  const applyTemplate = (templateName: string) => {
    let exercises: SessionExercise[] = [];
    
    if (templateName === 'Push Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Barbell Bench Press', targetMuscle: 'Chest', restTime: 120, notes: 'Keep feet firmly planted and squeeze your shoulder blades together to create a solid base.', videoUrl: 'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Seated Dumbbell Press', targetMuscle: 'Shoulders', restTime: 90, notes: 'Keep your elbows tucked slightly forward (about 45 degrees) rather than flared straight out to protect your shoulders.', videoUrl: 'https://www.youtube.com/embed/NW_y9yEZq34', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Triceps Rope Pushdown', targetMuscle: 'Triceps', restTime: 60, notes: "Keep your elbows glued to your ribs. If they move forward and back, you're using your lats instead of triceps.", videoUrl: 'https://www.youtube.com/embed/u36jNfqh8_U', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Pull Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Lat Pulldown', targetMuscle: 'Back', restTime: 90, notes: 'Think about pulling your elbows down to your back pockets rather than just pulling with your hands.', videoUrl: 'https://www.youtube.com/embed/5s6KGLTMgoI', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Bent-Over Barbell Row', targetMuscle: 'Back', restTime: 120, notes: 'Keep your core braced tightly. If you feel this in your lower back, lighten the weight to maintain proper form.', videoUrl: 'https://www.youtube.com/embed/phVtqawIgbk', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Alternating Dumbbell Curl', targetMuscle: 'Biceps', restTime: 60, notes: 'Control the eccentric (lowering) phase for a full 2 to 3 seconds to maximize muscle growth.', videoUrl: 'https://www.youtube.com/embed/MKWBV29S6c0', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Legs Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Barbell Back Squat', targetMuscle: 'Legs', restTime: 150, notes: 'Focus on pushing your knees out over your toes to open up your hips and achieve better depth comfortably.', videoUrl: 'https://www.youtube.com/embed/iKCJCydYYrE', sets: [
          {id: '1', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 8, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Machine Leg Press', targetMuscle: 'Legs', restTime: 90, notes: 'Never lock out your knees fully at the top of the movement to maintain tension on the quads and protect the joints.', videoUrl: 'https://www.youtube.com/embed/EotSw18oR9w', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Romanian Deadlift', targetMuscle: 'Legs', restTime: 120, notes: 'Keep the bar dragging lightly against your legs the entire time to avoid unnecessary stress on your lower back.', videoUrl: 'https://www.youtube.com/embed/3VXmecChYYM', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Biceps Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Machine Preacher Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'هذا التمرين هو البديل المثالي للبار، حيث يعزل عضلة البايسيبس بالكامل ويمنعك من الأرجحة بفضل وسادة الارتكاز. يركز بشكل كبير على الرأس القصير (Short Head) لزيادة الكتلة الإجمالية للعضلة.\n\nنصيحة للأداء: ألصق إبطك جيداً بالوسادة ولا ترفع كوعك عن السطح أبداً أثناء سحب الوزن.', videoUrl: 'https://www.youtube.com/embed/S4dDLFp3e8w', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Behind-The-Back Cable Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'هذا هو البديل الأفضل للدمبلز على المقعد المائل. نظراً لأن الكيبل يسحب ذراعك للخلف، فإنه يضع "الرأس الطويل" (Long Head) تحت أقصى درجات التمدد، وهو أمر أساسي لبناء وتكوير قمة البايسيبس (Bicep Peak).\n\nنصيحة للأداء: خذ خطوة للأمام بعيداً عن جهاز الكيبل، وحافظ على ثبات كوعك خلف مستوى جسمك طوال الحركة.', videoUrl: 'https://www.youtube.com/embed/unQKwAs4Svc', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Rope Cable Hammer Curl', targetMuscle: 'Biceps', restTime: 90, notes: 'بديل ممتاز لتمرين المطرقة بالدمبل، حيث يوفر الكيبل مقاومة ثابتة لا تضعف في أي نقطة من الرفعة. يستهدف العضلة العضدية (Brachialis) الموجودة أسفل البايسيبس لزيادة سمك وعرض الذراع بشكل عام.\n\nنصيحة للأداء: ثبت كوعيك بجانبك تماماً، واحرص على المباعدة بين طرفي الحبل قليلاً عند الوصول لأعلى نقطة لزيادة الانقباض.', videoUrl: 'https://www.youtube.com/embed/wGukDGOJYAs', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Triceps Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Cable Rope Triceps Pushdown', targetMuscle: 'Triceps', restTime: 90, notes: 'يستهدف هذا التمرين الرأس الجانبي (Lateral Head) بشكل رئيسي، وهو الجزء الذي يعطي الذراع العرض والمظهر الجانبي البارز. استخدام الحبل يسمح بمدى حركي أطول مقارنة بالبار.\n\nنصيحة للأداء: ثبت كوعيك بإحكام بجانب خصرك. ادفع الحبل للأسفل وعند الوصول لأدنى نقطة، باعد بين طرفي الحبل للخارج لزيادة الانقباض.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Rope Triceps Pushdown Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Overhead Cable Triceps Extension', targetMuscle: 'Triceps', restTime: 90, notes: 'هذا التمرين ضروري لاستهداف "الرأس الطويل" (Long Head)، والذي يشكل الجزء الأكبر من حجم الترايسيبس. رفع الذراع فوق مستوى الرأس يضع العضلة تحت أقصى درجات التمدد.\n\nنصيحة للأداء: استخدم الحبل واسحب الكيبل من الأسفل أو من مستوى الكتف. حافظ على ثبات كوعيك واتجاههما للأمام، وافرد ذراعيك بالكامل مع ثبات الجذع.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Overhead Cable Triceps Extension Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Triceps Dip Machine', targetMuscle: 'Triceps', restTime: 90, notes: 'هذا الجهاز هو البديل الآمن لتمرين الغطس الحر (Dips). يستهدف الرؤوس الثلاثة معاً لبناء كتلة عضلية شاملة، ويسمح لك برفع أوزان ثقيلة دون المخاطرة بأربطة الكتف.\n\nنصيحة للأداء: حافظ على استقامة ظهرك والتصاقه بالمسند. ادفع المقابض للأسفل باستخدام الترايسيبس وتجنب الميل بجذعك للأمام حتى لا ينتقل الضغط إلى عضلات الصدر، وتحكم بالوزن أثناء العودة للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Triceps Dip Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Chest Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Seated Machine Chest Press', targetMuscle: 'Chest', restTime: 90, notes: 'يستهدف هذا التمرين منتصف الصدر لبناء الكتلة العضلية الإجمالية. يوفر الجهاز مساراً ثابتاً للحركة مما يجعله آمناً لرفع أوزان ثقيلة دون الحاجة لتوازن الأوزان الحرة.\n\nنصيحة للأداء: اسحب كتفيك للخلف وللأسفل (ضم لوحي الكتف) وألصق ظهرك بالمسند. ادفع الوزن باستخدام عضلات صدرك، ولا تفرد كوعيك (Lockout) بالكامل في نهاية الحركة للحفاظ على الضغط المستمر على العضلة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Chest Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Incline Machine Chest Press', targetMuscle: 'Chest', restTime: 90, notes: 'تمرين لا غنى عنه لتطوير الجزء العلوي من الصدر، وهو الجزء الذي يعطي الصدر مظهراً ممتلئاً وبارزاً من الأعلى (عند عظمة الترقوة).\n\nنصيحة للأداء: اضبط ارتفاع المقعد بحيث تكون المقابض في مستوى الجزء العلوي من صدرك. حافظ على صدرك مرفوعاً وظهرك مقوساً قليلاً بشكل طبيعي طوال الرفعة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Incline Machine Chest Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'High-to-Low Cable Crossover', targetMuscle: 'Chest', restTime: 90, notes: 'هذا التمرين ممتاز لاستهداف الجزء السفلي من الصدر وإعطاء العضلة التحديد السفلي، بالإضافة إلى التركيز على الخط الداخلي. الكيبل يوفر مقاومة مستمرة من بداية التمدد حتى أقصى نقطة انقباض.\n\nنصيحة للأداء: قف في منتصف الجهاز وخذ خطوة صغيرة للأمام. اثن كوعيك قليلاً (كأنك تعانق شجرة ضخمة)، واسحب الكيابل للأسفل حتى تتلاقى يداك أمام حوضك، واعصر عضلة الصدر بقوة في هذه النقطة لتفعيل الجزء الداخلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن High to Low Cable Crossover Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Core Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Kneeling Cable Crunch', targetMuscle: 'Core', restTime: 60, notes: 'يستهدف هذا التمرين عضلات البطن الأمامية (Rectus Abdominis - العضلات السداسية). الكيبل يوفر مقاومة ممتازة تجبر عضلات البطن على العمل بجهد لثني الجذع.\n\nنصيحة للأداء: امسك الحبل خلف رقبتك أو بجانب أذنيك. ثبت حوضك تماماً (لا تجلس على كعبيك أثناء النزول)، وتخيل أنك تحاول تقريب قفصك الصدري من حوضك باستخدام عضلات بطنك فقط، وليس بسحب الحبل بذراعيك.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Kneeling Cable Crunch Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Ab Crunch Machine', targetMuscle: 'Core', restTime: 60, notes: 'بديل ممتاز للكرنش الأرضي، يوفر عزلاً عالياً جداً لعضلات البطن بالكامل ويحمي أسفل الظهر بفضل مسند الجهاز.\n\nنصيحة للأداء: اضبط المقعد بحيث يكون محور دوران الجهاز موازياً لأسفل صدرك أو بطنك (حسب تصميم الجهاز). أخرج الزفير (تنفس للخارج) بالكامل عند عصر عضلات بطنك للأسفل للحصول على أقصى انقباض عضلي.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Ab Crunch Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Woodchopper', targetMuscle: 'Core', restTime: 60, notes: 'هذا التمرين هو الأفضل لاستهداف العضلات الجانبية للبطن (الخواصر - Obliques) وتقوية الجذع بشكل عام من خلال الحركة الدورانية.\n\nنصيحة للأداء: اضبط الكيبل في أعلى نقطة أو في مستوى الكتف. حافظ على استقامة ذراعيك تقريباً، وقم بالدوران باستخدام جذعك (خصرك) وليس فقط بتحريك ذراعيك أو كتفيك، وحافظ على ثبات قدميك وحوضك قدر الإمكان.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Woodchopper Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Back Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Wide-Grip Lat Pulldown', targetMuscle: 'Back', restTime: 90, notes: 'يستهدف هذا التمرين العضلة الظهرية العريضة (المجنص - Lats) بشكل أساسي، وهو المسؤول الأول عن إعطاء الظهر المظهر العريض (V-Shape).\n\nنصيحة للأداء: اسحب البار باتجاه أعلى صدرك مع إرجاع كتفيك للخلف وللأسفل، واحرص على عدم الميل بجذعك للخلف بشكل مبالغ فيه.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Wide Grip Lat Pulldown Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Seated Cable Row', targetMuscle: 'Back', restTime: 90, notes: 'يركز على عضلات منتصف الظهر (Rhomboids) وشبه المنحرف (Traps) بالإضافة للمجنص، مما يمنح الظهر سماكة وعمقاً عضلياً من الداخل.\n\nنصيحة للأداء: حافظ على استقامة أسفل ظهرك. عند سحب الوزن، تخيل أنك تحاول عصر قلم بين لوحي كتفك، واسمح لكتفيك بالتمدد للأمام عند العودة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Row Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Chest-Supported Machine Row', targetMuscle: 'Back', restTime: 90, notes: 'يوفر هذا الجهاز عزلاً تاماً لعضلات الظهر العلوية والوسطى. مسند الصدر يمنعك من استخدام قوة الدفع (الأرجحة) ويزيل الضغط تماماً عن فقرات أسفل الظهر، مما يجعله آمناً وفعالاً لرفع أوزان ثقيلة.\n\nنصيحة للأداء: ألصق صدرك بالمسند طوال الحركة. اسحب المقابض للخلف مع إبقاء كوعيك قريبين من جسمك لاستهداف المجنص، أو افتح كوعيك قليلاً لاستهداف أعلى الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Chest Supported Row Machine Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Back Extension', targetMuscle: 'Back', restTime: 90, notes: 'تمرين أساسي لعزل وتقوية عضلات أسفل الظهر (Erector Spinae)، مما يحسن من استقامتك ويحميك من الإصابات.\n\nنصيحة للأداء: اضبط الوسادة لتكون أسفل حوضك مباشرة. انزل ببطء، ثم ارتفع للأعلى حتى يستقيم جسمك فقط (تجنب التقوس المفرط للخلف في أعلى نقطة).\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Back Extension Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Forearms Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Cable Reverse Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يستهدف هذا التمرين العضلة العضدية الكعبرية (الجزء العلوي والجانبي من الساعد) بشكل أساسي، مما يعطي الساعد مظهراً عريضاً من الخارج.\n\nنصيحة للأداء: استخدم البار المستقيم أو المتعرج (EZ Bar) بالكيبل السفلي. امسك البار بقبضة علوية (راحة اليد تواجه الأرض)، وحافظ على ثبات كوعيك بجانبك أثناء سحب الوزن للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Wrist Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يركز هذا التمرين على عضلات الثني (الجزء الداخلي من الساعد)، وهو الجزء المسؤول عن إعطاء الساعد الكتلة العضلية الأكبر والحجم الدائري.\n\nنصيحة للأداء: اسحب مقعداً أمام جهاز الكيبل السفلي، وضع ساعديك على فخذيك أو على المقعد بحيث تتدلى معاصمك خارج الحافة. دع البار ينزل حتى أطراف أصابعك للحصول على أقصى تمدد، ثم اقبض معصمك للأعلى بقوة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Seated Cable Wrist Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Reverse Wrist Curl', targetMuscle: 'Forearms', restTime: 90, notes: 'يستهدف عضلات التمديد (الجزء الخارجي والعلوي من الساعد). تقوية هذا الجزء ضرورية جداً لتوازن القوة في الذراع ومنع الإصابات أو آلام مفصل المعصم (مثل التهاب الأوتار).\n\nنصيحة للأداء: بنفس وضعية التمرين السابق، لكن اجعل راحة يدك تواجه الأرض. ارفع معصمك للأعلى باتجاه جسمك ببطء، وتحكم بالوزن أثناء النزول. لا تستخدم أوزاناً ثقيلة جداً هنا لتجنب إرهاق المفصل.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Reverse Wrist Curl Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    } else if (templateName === 'Shoulders Workout') {
      exercises = [
        { id: Date.now()+Math.random()+'', name: 'Machine Shoulder Press', targetMuscle: 'Shoulders', restTime: 90, notes: 'يستهدف هذا الجهاز الرأس الأمامي والجانبي بشكل أساسي لبناء الحجم الإجمالي للكتف. الجهاز يوفر ثباتاً عالياً مما يسمح لك برفع أوزان ثقيلة بأمان تام مقارنة بالدمبلز.\n\nنصيحة للأداء: لا تجعل كوعيك مفتوحين للخارج بزاوية 90 درجة؛ بل اجعلهما يميلان للأمام قليلاً (حوالي 45 درجة) لحماية مفصل الكتف من الإصابة.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Machine Shoulder Press Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Cable Lateral Raise', targetMuscle: 'Shoulders', restTime: 90, notes: 'هذا التمرين هو السر للحصول على أكتاف عريضة ومكورة (3D). الكيبل يتفوق على الدمبل هنا لأنه يحافظ على الشد العضلي (Tension) من بداية الحركة في الأسفل وحتى نهايتها.\n\nنصيحة للأداء: اجعل الكيبل يمر من خلف ظهرك أو من أمامك، وارفع ذراعك للجانب مع ميلان بسيط للأمام. تخيل أنك تدفع الوزن بعيداً عنك وليس فقط للأعلى.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Cable Lateral Raise Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 12, repsActual: 0, unit: 'lb', isCompleted: false}
        ]},
        { id: Date.now()+Math.random()+'', name: 'Reverse Pec Deck Machine', targetMuscle: 'Shoulders', restTime: 90, notes: 'الكتف الخلفي غالباً ما يتم إهماله، وتقويته ضرورية جداً لاستقامة المظهر (Posture) واكتمال شكل الكتف. هذا الجهاز يعزل الكتف الخلفي بفعالية دون تدخل عضلات الظهر.\n\nنصيحة للأداء: اضبط المقعد بحيث تكون يداك في مستوى كتفيك. ادفع المقابض للخارج، وتجنب عصر لوحي كتفك للخلف بقوة لضمان بقاء الضغط على الكتف الخلفي وليس على عضلات الظهر.\n\nللعثور على الشرح (Short): ابحث في يوتيوب عن Reverse Pec Deck Rear Delt Form Short', sets: [
          {id: '1', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '2', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false},
          {id: '3', weight: 0, repsTarget: 15, repsActual: 0, unit: 'lb', isCompleted: false}
        ]}
      ];
    }

    // Ensure workout strictly starts with cardio warm-up
    if (!exercises.some(ex => ex.targetMuscle.toLowerCase() === 'cardio' || ex.name.toLowerCase().includes('cardio') || ex.name.toLowerCase().includes('treadmill'))) {
      const cardioWarmup: SessionExercise = {
        id: Date.now() + Math.random() + '-cardio',
        name: 'Treadmill Warm-up & Cardio (إحماء وكارديو جهاز المشي)',
        targetMuscle: 'Cardio',
        restTime: 60,
        notes: '5-10 minutes of aerobic warm-up to prepare joints and elevate core temperature.',
        duration: 10,
        sets: [{ id: 'cardio-s1', weight: 0, repsTarget: 10, repsActual: 10, unit: 'lb', isCompleted: false }]
      };
      exercises = [cardioWarmup, ...exercises];
    }

    setEditingSession(prev => ({
      ...prev,
      title: templateName,
      type: 'Strength',
      exercises
    }));
  };

  const getTypeColor = (type: string | undefined, title: string) => {
    const t = title.toLowerCase();
    if (t.includes('push')) return 'var(--accent-cyan)';
    if (t.includes('cardio') || type === 'Cardio') return 'var(--accent-green)';
    if (t.includes('pull')) return 'var(--accent-purple)';
    if (t.includes('leg')) return 'var(--accent-yellow)';
    return 'var(--accent-primary)';
  };

  const getTargetMusclesText = (exercises?: SessionExercise[]) => {
    if (!exercises || exercises.length === 0) return '';
    const muscles = exercises.map(e => e.targetMuscle).filter(Boolean);
    const unique = [...new Set(muscles)];
    if (unique.length === 0) return '';
    return unique.join(' • ');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="zen-page-container calendar-page flex-col" 
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Header Area */}
      {/* Header Area */}
      <div className="zen-header calendar-header-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="calendar-header-title-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              {t('weeklyCalendar')}
            </h1>
            {isCurrentWeek ? (
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {isRTL ? 'الأسبوع الحالي' : 'Current Week'}
              </span>
            ) : (
              <span style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {formatDate(startDate, 'yyyy')}
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {formatDate(startDate, 'EEEE d MMM')} – {formatDate(endDate, 'EEEE d MMM yyyy')}
          </p>
        </div>

        <div className="calendar-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="calendar-nav-stepper" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '2rem', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button 
              className="btn-icon btn-ghost" 
              style={{ padding: '0.5rem 0.85rem', borderRadius: '2rem', minWidth: '44px', minHeight: '44px' }} 
              onClick={() => {
                setCurrentDate(d => {
                  const next = addDays(d, -7);
                  setSelectedRibbonDay(s => addDays(s, -7));
                  return next;
                });
              }} 
              title={t('previousWeek')}
            >
              <ChevronLeft className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </button>
            <button 
              className="btn-icon btn-ghost" 
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '2rem', minHeight: '44px' }} 
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedRibbonDay(now);
              }}
            >
              {t('today')}
            </button>
            <button 
              className="btn-icon btn-ghost" 
              style={{ padding: '0.5rem 0.85rem', borderRadius: '2rem', minWidth: '44px', minHeight: '44px' }} 
              onClick={() => {
                setCurrentDate(d => {
                  const next = addDays(d, 7);
                  setSelectedRibbonDay(s => addDays(s, 7));
                  return next;
                });
              }} 
              title={t('nextWeek')}
            >
              <ChevronRight className="w-4 h-4" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
            </button>
          </div>
          <div className="calendar-header-buttons-row">
            <button
              type="button"
              onClick={() => {
                if (allPlannedSessions.length === 0) {
                  notify(isRTL ? 'لا توجد تمارين مجدولة للمسح في التقويم' : 'No planned workouts to clear in calendar', 'info');
                  return;
                }
                setIsClearModalOpen(true);
              }}
              className="btn btn-ghost calendar-clear-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.08)',
                padding: '0.5rem 0.9rem',
                borderRadius: '2rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                minHeight: '44px',
                cursor: 'pointer'
              }}
              title={isRTL ? 'مسح التمارين المجدولة من التقويم' : 'Clear Planned Workouts from Calendar'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isRTL ? 'مسح المجدول' : 'Clear Planned'}</span>
              {allPlannedSessions.length > 0 && (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {allPlannedSessions.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="btn-primary calendar-ai-generator-btn"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="calendar-ai-label">{t('aiGenerator')}</span>
            </button>
            <button className="btn btn-primary calendar-header-top-add-btn" onClick={() => openNewModal(selectedRibbonDay)}>
              <Plus className="w-5 h-5" /> <span>{t('addSession')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week View: Strictly Saturday to Friday */}
      <div className="calendar-week-ribbon hide-scrollbar" style={{ marginBottom: '1.25rem' }}>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedRibbonDay);
          const daySessions = data?.sessions.filter(s => isSameDay(new Date(s.date), day)) || [];
          const dayHistory = data?.history.filter(h => isSameDay(new Date(h.date), day)) || [];
          const isCompleted = daySessions.length === 0 && dayHistory.length > 0;
          const isRest = day.getDay() === 5; // Friday is rest day

          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              aria-pressed={isSelected}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                gymAudio.triggerVibration([12]);
                setSelectedRibbonDay(day);
              }}
              className={`ribbon-day-pill ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
            >
              <span className="ribbon-day-name" style={{ fontWeight: 800 }}>{formatDate(day, 'EEE')}</span>
              <span className="ribbon-day-number" style={{ fontWeight: 900 }}>{formatDate(day, 'd')}</span>
              <div className="ribbon-day-status">
                {isCompleted ? (
                  <span className="ribbon-dot completed" title={t('completed')}>✓</span>
                ) : daySessions.length > 0 ? (
                  <span className="ribbon-dot planned" title={`${daySessions.length} ${t('planned')}`}>
                    {daySessions.length}
                  </span>
                ) : isRest ? (
                  <span className="ribbon-dot rest" title={t('restDayNotice')}>🌿</span>
                ) : null}
              </div>
              {isRest && (
                <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 800, marginTop: '-2px' }}>
                  {isRTL ? 'راحة' : 'Rest'}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Friday Rest & Recovery Notice */}
      {selectedRibbonDay.getDay() === 5 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '0.85rem 1.1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0
          }}>
            🌿
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#34d399', marginBottom: '0.15rem' }}>
              {isRTL ? 'الجمعة: ختام الأسبوع التدريبي ويوم الاستشفاء' : 'Friday: Training Week Finale & Recovery'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isRTL 
                ? 'استمتع بالراحة اليوم لاستعادة نشاط عضلاتك. سيبدأ أسبوعك الجديد تلقائياً غداً السبت!' 
                : 'Take time to recover and replenish today. Your next week starts fresh tomorrow Saturday!'}
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Subtle Cleanup Notice (only when needed) */}
      {(duplicateSessionIds.length > 0 || pastIncompleteSessionIds.length > 0) && (
        <div className="zen-notice" style={{ borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex' }}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {isRTL ? 'تنظيم الجدول وتصفية التمارين' : 'Schedule Cleanup Available'}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {duplicateSessionIds.length > 0 && `${duplicateSessionIds.length} ${t('duplicateSessionsDetected')}`}
                {duplicateSessionIds.length > 0 && pastIncompleteSessionIds.length > 0 && ' · '}
                {pastIncompleteSessionIds.length > 0 && `${pastIncompleteSessionIds.length} ${t('pastIncompleteDetected')}`}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {duplicateSessionIds.length > 0 && (
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={async () => {
                  if (confirm(`${t('removeDuplicatesConfirm')} (${duplicateSessionIds.length})`)) {
                    await deleteSessions(duplicateSessionIds);
                  }
                }}
              >
                {t('cleanUpDuplicates')}
              </button>
            )}
            {pastIncompleteSessionIds.length > 0 && (
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={async () => {
                  if (confirm(`${t('cleanUpPastIncomplete')} (${pastIncompleteSessionIds.length})?`)) {
                    await deleteSessions(pastIncompleteSessionIds);
                  }
                }}
              >
                {t('cleanUpPastIncomplete')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Focused Selected Day View (Cards Deck) */}
      {(() => {
        const isToday = isSameDay(selectedRibbonDay, new Date());
        const isPastDay = !isToday && selectedRibbonDay < todayStart;
        const daySessions = data?.sessions?.filter(s => isSameDay(new Date(s.date), selectedRibbonDay)) || [];
        const dayHistory = data?.history?.filter(h => isSameDay(new Date(h.date), selectedRibbonDay)) || [];
        const dayMeals = data?.meals?.filter(m => isSameDay(new Date(m.date), selectedRibbonDay)) || [];
        const dayCardio = data?.insights?.cardioLogs?.filter(c => isSameDay(new Date(c.date), selectedRibbonDay)) || [];
        const dayKey = format(selectedRibbonDay, 'yyyy-MM-dd');
        const dayWater = data?.waterLogs?.[dayKey] || 0;

        const isDayCompleted = daySessions.length === 0 && dayHistory.length > 0;
        const isRestDay = selectedRibbonDay.getDay() === 5;

        // Scoped Nutrition Calculations for this day only
        const dayConsumedCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
        const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
        const dayCarbs = dayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
        const dayFats = dayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);

        // Scoped Workout Calculations for this day only
        const dayBurnedFromWorkouts = dayHistory.reduce((acc, h) => acc + (h.burnedCalories || (h.snapshot ? estimateWorkoutCalories(h.snapshot) : 0)), 0);
        const dayBurnedFromCardio = dayCardio.reduce((acc, c) => acc + (c.calories || 0), 0);
        const dayBurnedCalories = dayBurnedFromWorkouts + dayBurnedFromCardio;

        // Daily Targets
        const targetCalories = data?.nutritionGoals?.dailyCalories || 2400;
        const targetProtein = data?.nutritionGoals?.dailyProtein || 160;
        const targetCarbs = data?.nutritionGoals?.dailyCarbs || 250;
        const targetFats = data?.nutritionGoals?.dailyFats || 70;
        const targetWater = data?.nutritionGoals?.dailyWaterMl || 3000;
        const netEnergyBalance = dayConsumedCalories - dayBurnedCalories;

        const getMealTypeBadge = (type: MealRecord['mealType']) => {
          switch (type) {
            case 'breakfast':
              return { label: t('breakfast'), color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
            case 'lunch':
              return { label: t('lunch'), color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
            case 'dinner':
              return { label: t('dinner'), color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
            case 'snack':
            default:
              return { label: t('snack'), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
          }
        };

        return (
          <motion.div
            key={selectedRibbonDay.toISOString()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="calendar-selected-day-section"
          >
            {/* Selected Day Info Header Bar */}
            <div className="calendar-day-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: isToday ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isToday ? '1.5px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isToday ? '0 0 16px rgba(56, 189, 248, 0.2)' : 'none',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1 }}>
                    {formatDate(selectedRibbonDay, 'MMM')}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {formatDate(selectedRibbonDay, 'dd')}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {formatDate(selectedRibbonDay, 'EEEE')}
                    </h2>
                    {isToday && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--accent-primary)',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        {t('today')}
                      </span>
                    )}
                    {isRestDay && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        🌿 {isRTL ? 'يوم راحة' : 'Rest Day'}
                      </span>
                    )}
                    {isDayCompleted && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        ✓ {t('completed')}
                      </span>
                    )}
                    {isPastDay && daySessions.length === 0 && !isDayCompleted && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {t('missedWorkout')}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(selectedRibbonDay, 'dd MMMM yyyy')}
                    {daySessions.length > 0 && ` • ${daySessions.length} ${t('planned')}`}
                    {dayHistory.length > 0 && ` • ${dayHistory.length} ${t('completed')}`}
                    {dayMeals.length > 0 && ` • ${dayMeals.length} ${t('navNutrition')}`}
                  </p>
                </div>
              </div>

              {/* Action: Add or clear session for selected day */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {daySessions.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleClearPlanned('day')}
                    disabled={isClearing}
                    style={{
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '2rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title={isRTL ? 'مسح تمارين هذا اليوم المحددة' : 'Clear workouts for this day'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'مسح تمارين اليوم' : 'Clear Day'}</span>
                  </button>
                )}
                {!isRestDay ? (
                  <button
                    type="button"
                    className="btn btn-primary calendar-day-add-session-btn"
                    onClick={() => openNewModal(selectedRibbonDay)}
                  >
                    <Plus className="w-4 h-4" /> <span>{t('addSession')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary calendar-day-add-session-btn"
                    onClick={() => openNewModal(addDays(selectedRibbonDay, 1))}
                    title={isRTL ? 'الجيم مغلق يوم الجمعة — جدول ليوم السبت' : 'Gym closed on Friday — schedule for Saturday'}
                  >
                    <Plus className="w-4 h-4" /> <span>{isRTL ? 'جدولة للسبت' : 'Schedule for Saturday'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Day Scope Filter Tabs */}
            <div className="calendar-day-tab-bar">
              <button
                type="button"
                className={`day-tab-pill ${dayActiveTab === 'all' ? 'active' : ''}`}
                onClick={() => setDayActiveTab('all')}
              >
                <span>{t('dayOverviewTab')}</span>
              </button>

              <button
                type="button"
                className={`day-tab-pill ${dayActiveTab === 'planned' ? 'active' : ''}`}
                onClick={() => setDayActiveTab('planned')}
              >
                <span>{t('dayPlannedTab')}</span>
                {daySessions.length > 0 && (
                  <span className="tab-count-badge">{daySessions.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`day-tab-pill ${dayActiveTab === 'workouts' ? 'active' : ''}`}
                onClick={() => setDayActiveTab('workouts')}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>{t('dayWorkoutHistoryTab')}</span>
                {dayHistory.length > 0 && (
                  <span className="tab-count-badge success">{dayHistory.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`day-tab-pill ${dayActiveTab === 'nutrition' ? 'active' : ''}`}
                onClick={() => setDayActiveTab('nutrition')}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{t('dayNutritionHistoryTab')}</span>
                {dayMeals.length > 0 && (
                  <span className="tab-count-badge cyan">{dayMeals.length}</span>
                )}
              </button>
            </div>

            {/* Strict Day Scope Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.95rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>📅</span>
                <span>{t('dayHistoryOnlyNotice')}:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selectedRibbonDay, 'EEEE, dd MMMM yyyy')}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {dayBurnedCalories > 0 && (
                  <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <Flame className="w-3.5 h-3.5" /> {Math.round(dayBurnedCalories)} kcal
                  </span>
                )}
                {dayConsumedCalories > 0 && (
                  <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <Apple className="w-3.5 h-3.5" /> {Math.round(dayConsumedCalories)} kcal
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 1: Planned Workouts for this Day */}
            {(dayActiveTab === 'all' || dayActiveTab === 'planned') && (
              <div className="calendar-day-section-block">
                {dayActiveTab !== 'all' && (
                  <div className="calendar-section-title-row">
                    <h3 className="calendar-section-title">
                      <Dumbbell className="w-5 h-5 text-sky-400" />
                      <span>{t('dayPlannedTab')}</span>
                      {daySessions.length > 0 && (
                        <span className="tab-count-badge">{daySessions.length}</span>
                      )}
                    </h3>
                  </div>
                )}

                {isRestDay && daySessions.length === 0 ? (
                  /* Rest Day Card if Friday and no workouts */
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '1.25rem',
                      padding: '2.5rem 1.5rem',
                      gap: '1rem',
                      background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.95) 0%, rgba(8, 14, 26, 0.98) 100%)'
                    }}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <Moon className="w-7 h-7" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {isRTL ? '🔒 الجيم مغلق' : '🔒 Gym Closed'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {t('gymClosedTitle')}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {t('gymClosedDesc')}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: '0.35rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                      onClick={() => openNewModal(addDays(selectedRibbonDay, 1))}
                    >
                      <Plus className="w-4 h-4" /> {isRTL ? 'جدولة تمرين للغد (السبت)' : 'Schedule for Tomorrow (Saturday)'}
                    </button>
                  </div>
                ) : daySessions.length === 0 ? (
                  /* Empty State for Planned */
                  dayActiveTab === 'planned' || (dayHistory.length === 0 && dayMeals.length === 0) ? (
                    <div 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '1.25rem',
                        padding: '2.5rem 1.5rem',
                        gap: '1rem'
                      }}
                    >
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                      }}>
                        <Dumbbell className="w-6 h-6" />
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {isRTL 
                          ? `لا توجد تمارين مجدولة ليوم ${formatDate(selectedRibbonDay, 'EEEE')}` 
                          : `No workouts scheduled for ${formatDate(selectedRibbonDay, 'EEEE')}`}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {isRTL 
                          ? 'اختر إضافة تمرين لهذا اليوم أو استخدم التوليد الذكي لإنشاء جدول تدريبي متكامل.' 
                          : 'Schedule a workout for this day or use our AI Generator to create an optimized routine.'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openNewModal(selectedRibbonDay)}
                        >
                          <Plus className="w-4 h-4" /> {t('addSession')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsAIModalOpen(true)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
                            borderColor: 'rgba(168, 85, 247, 0.3)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-purple-400" /> {t('aiGenerator')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => generatePPL()}
                        >
                          {t('generatePPLRoutine')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Dumbbell className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          {isRTL ? `لا توجد جلسات مجدولة مسبقاً لهذا اليوم` : `No scheduled sessions planned for this day`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={() => openNewModal(selectedRibbonDay)}
                      >
                        <Plus className="w-3.5 h-3.5" /> {t('addSession')}
                      </button>
                    </div>
                  )
                ) : (
                  /* Grid of Workout Cards for the Selected Day */
                  <div className="calendar-day-cards-grid">
                    {isRestDay && daySessions.length > 0 && (
                      <div 
                        style={{
                          gridColumn: '1 / -1',
                          marginBottom: '0.75rem',
                          padding: '0.85rem 1.15rem',
                          borderRadius: '14px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>🔒</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#ef4444' }}>
                              {isRTL ? 'الجمعة عطلة أسبوعية — الجيم مغلق' : 'Friday Off-Day — Gym is Closed'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {isRTL ? 'توجد جلسات مجدولة في يوم عطلة الجيم. يُنصح بنقلها إلى السبت.' : 'You have sessions scheduled on a gym closed day. We recommend moving them to Saturday.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                          onClick={async () => {
                            for (const s of daySessions) {
                              const satDate = addDays(new Date(s.date), 1);
                              satDate.setHours(18, 0, 0, 0);
                              const dateStr = new Date(satDate.getTime() - (satDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                              await saveSession({ ...s, date: dateStr });
                            }
                            notify(isRTL ? 'تم نقل جميع الجلسات إلى السبت بنجاح!' : 'All sessions moved to Saturday successfully!', 'success');
                          }}
                        >
                          {isRTL ? 'نقل جميع الجلسات للسبت' : 'Move All to Saturday'}
                        </button>
                      </div>
                    )}
                    <AnimatePresence>
                      {daySessions.map((session: WorkoutSession) => {
                        const typeColor = getTypeColor(session.type, session.title);
                        const muscles = getTargetMusclesText(session.exercises);

                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            key={session.id}
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="calendar-workout-card"
                            style={{
                              borderInlineStart: `4px solid ${typeColor}`
                            }}
                          >
                            {/* Top Row: Type Dot + Title + Time + Actions */}
                            <div className="card-top-row">
                              <div className="card-title-meta">
                                <div className="card-dot" style={{ backgroundColor: typeColor, boxShadow: `0 0 10px ${typeColor}80` }} />
                                <div>
                                  <h3 className="card-title">{tTitle(session.title)}</h3>
                                  <div className="card-time-pill">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(new Date(session.date), 'h:mm a')}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="card-actions" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn-card-action complete-action"
                                  onClick={() => handleCompleteSingleSession(session)}
                                  title={t('workoutCompleted')}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="btn-card-action delete-action"
                                  onClick={() => handleDelete(session.id)}
                                  title={t('deleteSession')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Muscle Targets */}
                            <div className="card-muscles-row">
                              <Dumbbell className="w-3.5 h-3.5" style={{ color: typeColor, flexShrink: 0 }} />
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {muscles ? tMuscle(muscles) : (session.exercises?.length ? t('multipleMuscles') : t('noExercises'))}
                              </span>
                            </div>

                            {/* Exercise Items Preview */}
                            {session.exercises && session.exercises.length > 0 && (
                              <div className="card-exercises-preview-list">
                                {session.exercises.slice(0, 4).map((ex, idx) => (
                                  <div key={ex.id || idx} className="card-exercise-pill-item">
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: typeColor, flexShrink: 0 }} />
                                    <span className="pill-name">{ex.name}</span>
                                    <span className="pill-sets">{ex.sets?.length || 3} {t('sets')}</span>
                                  </div>
                                ))}
                                {session.exercises.length > 4 && (
                                  <div className="card-exercises-overflow">
                                    +{session.exercises.length - 4} {isRTL ? 'تمارين أخرى' : 'more exercises'}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Bottom Stats & CTA */}
                            <div className="card-footer-cta">
                              <div className="card-stats">
                                <span className="card-stat-item">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{session.duration} {t('min')}</span>
                                </span>
                                <span className="card-stat-divider">•</span>
                                <span className="card-stat-item">
                                  <Dumbbell className="w-3.5 h-3.5" />
                                  <span>{session.exercises?.length || 0} {t('exercises')}</span>
                                </span>
                              </div>

                              <div className="card-go-btn" style={{ color: typeColor }}>
                                <span>{isRTL ? 'عرض التمرين' : 'Start'}</span>
                                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Quick Add Session Card in the Grid */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openNewModal(selectedRibbonDay)}
                      className="calendar-add-workout-card"
                    >
                      <div className="add-workout-circle">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="add-workout-label">{t('addSession')}</span>
                      <span className="add-workout-day">{formatDate(selectedRibbonDay, 'EEEE')}</span>
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: Full Completed Workout History for THIS DAY ONLY */}
            {(dayActiveTab === 'all' || dayActiveTab === 'workouts') && (
              <div className="calendar-day-section-block">
                <div className="calendar-section-title-row">
                  <h3 className="calendar-section-title">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <span>{t('dayWorkoutsCompletedHeading')}</span>
                    {dayHistory.length > 0 && (
                      <span className="tab-count-badge success">{dayHistory.length}</span>
                    )}
                  </h3>
                  {dayBurnedFromWorkouts > 0 && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      🔥 {Math.round(dayBurnedFromWorkouts)} kcal
                    </span>
                  )}
                </div>

                {dayHistory.length === 0 ? (
                  dayActiveTab === 'workouts' ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '1.25rem',
                      gap: '0.75rem'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <Trophy className="w-6 h-6" />
                      </div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {t('noWorkoutsCompletedThisDay')}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '360px' }}>
                        {isRTL 
                          ? 'عند إنهائك لأي تمرين في هذا اليوم، ستظهر تفاصيل الجولات والأوزان والسعرات المحروقة هنا بالتفصيل.'
                          : 'When you complete a workout on this day, complete set records, weights, and burned calories appear here.'}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="calendar-history-cards-grid">
                    {dayHistory.map((h: HistoryRecord) => {
                      const isExpanded = !!expandedWorkoutIds[h.id];
                      const workout = h.snapshot;
                      const exercises = workout?.exercises || [];
                      const totalSetsCount = exercises.reduce((acc: number, ex: SessionExercise) => acc + (ex.sets?.length || 0), 0);
                      const muscles = getTargetMusclesText(exercises);
                      const burnedKcal = h.burnedCalories || (workout ? estimateWorkoutCalories(workout) : 0);
                      const duration = workout?.duration || 45;

                      // Calculate total volume tonnage
                      const totalVolume = exercises.reduce((acc: number, ex: SessionExercise) => {
                        return acc + (ex.sets?.reduce((sAcc: number, s) => {
                          const w = s.weight || 0;
                          const r = s.repsActual ?? s.repsTarget ?? 0;
                          return sAcc + (w * r);
                        }, 0) || 0);
                      }, 0);
                      const volumeFormatted = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)} t` : `${Math.round(totalVolume)} kg`;

                      return (
                        <div key={h.id} className="history-workout-card">
                          {/* Card Header */}
                          <div className="history-card-header">
                            <div className="history-card-title-meta">
                              <div className="history-card-icon-box">
                                <Trophy className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="history-card-title">{tTitle(h.title)}</h4>
                                <div className="history-card-subtitle">
                                  <span>{formatDate(new Date(h.date), 'h:mm a')}</span>
                                  <span>•</span>
                                  <span className="history-card-subtitle-badge">
                                    <Check className="w-3 h-3" />
                                    <span>{t('completed')}</span>
                                  </span>
                                  {muscles && (
                                    <>
                                      <span>•</span>
                                      <span style={{ color: 'var(--text-secondary)' }}>{tMuscle(muscles)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {workout && (
                              <button
                                type="button"
                                className="history-repeat-btn"
                                onClick={() => handleRepeatWorkout(workout)}
                                title={t('repeatWorkoutOnCalendar')}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="hidden sm:inline">{t('repeatWorkoutOnCalendar')}</span>
                              </button>
                            )}
                          </div>

                          {/* 4 Telemetry Stats Grid */}
                          <div className="history-card-telemetry-grid">
                            <div className="history-telemetry-stat">
                              <div className="stat-label">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isRTL ? 'الحرق' : 'Burned'}</span>
                              </div>
                              <span className="stat-value text-amber-400">{burnedKcal} <small>kcal</small></span>
                            </div>

                            <div className="history-telemetry-stat">
                              <div className="stat-label">
                                <Clock className="w-3.5 h-3.5 text-sky-400" />
                                <span>{isRTL ? 'المدة' : 'Duration'}</span>
                              </div>
                              <span className="stat-value text-sky-400">{duration} <small>{t('min')}</small></span>
                            </div>

                            <div className="history-telemetry-stat">
                              <div className="stat-label">
                                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{isRTL ? 'الحجم' : 'Volume'}</span>
                              </div>
                              <span className="stat-value text-emerald-400">{totalVolume > 0 ? volumeFormatted : `${totalSetsCount} ${t('sets')}`}</span>
                            </div>

                            <div className="history-telemetry-stat">
                              <div className="stat-label">
                                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                                <span>{isRTL ? 'التمارين' : 'Exercises'}</span>
                              </div>
                              <span className="stat-value text-purple-400">{exercises.length}</span>
                            </div>
                          </div>

                          {/* Exercise Pills Preview Chips */}
                          {exercises.length > 0 && (
                            <div className="history-card-pills-row">
                              {exercises.slice(0, 4).map((ex: SessionExercise, idx: number) => (
                                <span key={ex.id || idx} className="history-exercise-chip">
                                  <span className="chip-dot" />
                                  <span className="chip-name">{tExercise(ex.name)}</span>
                                  <span className="chip-sets">{ex.sets?.length || 3}s</span>
                                </span>
                              ))}
                              {exercises.length > 4 && (
                                <span className="history-exercise-overflow">
                                  +{exercises.length - 4} {isRTL ? 'تمارين أخرى' : 'more'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Card Footer with Expand Toggle */}
                          <div className="history-card-footer">
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {exercises.length} {t('exercises')} • {totalSetsCount} {t('sets')}
                            </span>

                            <button
                              type="button"
                              className="history-toggle-breakdown-btn"
                              onClick={() => toggleWorkoutExpand(h.id)}
                            >
                              <span>{isExpanded ? t('hideExerciseBreakdown') : t('showExerciseBreakdown')}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Expandable Exercise & Sets Details */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="history-card-expanded-deck"
                            >
                              {exercises.length > 0 ? (
                                exercises.map((ex: SessionExercise, exIdx: number) => {
                                  const exVolume = ex.sets?.reduce((acc: number, s) => acc + ((s.weight || 0) * (s.repsActual ?? s.repsTarget ?? 0)), 0) || 0;
                                  const exCompletedSets = ex.sets?.filter(s => s.isCompleted !== false).length || 0;

                                  return (
                                    <div key={ex.id || exIdx} className="history-expanded-exercise-box">
                                      {/* Exercise Header */}
                                      <div className="exercise-box-header">
                                        <div className="exercise-box-title-col">
                                          <span className="exercise-box-name">{tExercise(ex.name)}</span>
                                          {ex.targetMuscle && (
                                            <span className="exercise-box-muscle">
                                              <Dumbbell className="w-3 h-3" />
                                              {tMuscle(ex.targetMuscle)}
                                            </span>
                                          )}
                                        </div>

                                        <div className="exercise-box-metrics">
                                          <span className="exercise-box-setcount">
                                            {exCompletedSets}/{ex.sets?.length || 0} {t('sets')}
                                          </span>
                                          {exVolume > 0 && (
                                            <span className="exercise-box-volume">
                                              {exVolume >= 1000 ? `${(exVolume / 1000).toFixed(1)} t` : `${Math.round(exVolume)} kg`}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Sets Data Table */}
                                      <div className="exercise-sets-log-table">
                                        {ex.sets?.map((s, sIdx: number) => {
                                          const actualW = s.weight ?? 0;
                                          const actualR = s.repsActual ?? s.repsTarget ?? 0;
                                          const unit = s.unit || 'kg';
                                          const isCompleted = s.isCompleted !== false;
                                          const setVolume = actualW * actualR;

                                          return (
                                            <div key={s.id || sIdx} className={`set-log-row ${isCompleted ? 'completed' : 'pending'}`}>
                                              <div className="set-num-pill">
                                                {s.type === 'warmup' ? 'W' : s.type === 'dropset' ? 'D' : s.type === 'failure' ? 'F' : sIdx + 1}
                                              </div>

                                              <div className="set-log-col-weight">
                                                <span className="set-val">{actualW}</span>
                                                <span className="set-unit">{unit}</span>
                                              </div>

                                              <div className="set-log-col-times">×</div>

                                              <div className="set-log-col-reps">
                                                <span className="set-val">{actualR}</span>
                                                <span className="set-unit">{t('reps')}</span>
                                              </div>

                                              {setVolume > 0 && (
                                                <div className="set-log-col-vol hidden sm:flex">
                                                  <span>{setVolume} kg</span>
                                                </div>
                                              )}

                                              <div className="status-pill done">
                                                {isCompleted ? (
                                                  <>
                                                    <Check className="w-3 h-3" />
                                                    <span>{t('completed')}</span>
                                                  </>
                                                ) : (
                                                  <span>—</span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  {t('noExercises')}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: Full Nutrition History for THIS DAY ONLY */}
            {(dayActiveTab === 'all' || dayActiveTab === 'nutrition') && (
              <div className="calendar-day-section-block">
                <div className="calendar-section-title-row">
                  <h3 className="calendar-section-title">
                    <Utensils className="w-5 h-5 text-cyan-400" />
                    <span>{t('dayNutritionHeading')}</span>
                    {dayMeals.length > 0 && (
                      <span className="tab-count-badge cyan">{dayMeals.length}</span>
                    )}
                  </h3>
                  {dayConsumedCalories > 0 && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                      🍏 {Math.round(dayConsumedCalories)} kcal
                    </span>
                  )}
                </div>

                {/* Day Macro & Caloric Overview Card */}
                <div className="day-nutrition-overview-card">
                  {/* Energy Balance Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('caloriesIn')}: <strong style={{ color: '#06b6d4' }}>{Math.round(dayConsumedCalories)}</strong> / {targetCalories} kcal
                      </span>
                      <span style={{ fontSize: '0.78rem', color: netEnergyBalance >= 0 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                        {t('netBalance')}: {netEnergyBalance > 0 ? '+' : ''}{Math.round(netEnergyBalance)} kcal
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                      <div 
                        style={{
                          width: `${Math.min(100, Math.round((dayConsumedCalories / targetCalories) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* 4 Macro Targets Grid */}
                  <div className="day-macro-grid">
                    {/* Protein */}
                    <div className="day-macro-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('protein')}</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>{Math.round(dayProtein)}g / {targetProtein}g</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ width: `${Math.min(100, Math.round((dayProtein / targetProtein) * 100))}%`, height: '100%', background: '#38bdf8', borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="day-macro-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('carbs')}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{Math.round(dayCarbs)}g / {targetCarbs}g</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ width: `${Math.min(100, Math.round((dayCarbs / targetCarbs) * 100))}%`, height: '100%', background: '#10b981', borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* Fats */}
                    <div className="day-macro-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('fats')}</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{Math.round(dayFats)}g / {targetFats}g</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ width: `${Math.min(100, Math.round((dayFats / targetFats) * 100))}%`, height: '100%', background: '#f59e0b', borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* Hydration */}
                    <div className="day-macro-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Droplets className="w-3 h-3 text-blue-400" /> {t('waterIntakeTitle')}
                        </span>
                        <span style={{ fontWeight: 700, color: '#60a5fa' }}>{(dayWater / 1000).toFixed(1)}L / {(targetWater / 1000).toFixed(1)}L</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ width: `${Math.min(100, Math.round((dayWater / targetWater) * 100))}%`, height: '100%', background: '#60a5fa', borderRadius: '999px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logged Meals on this Day */}
                {dayMeals.length === 0 ? (
                  dayActiveTab === 'nutrition' ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '1.25rem',
                      gap: '0.75rem'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                        <Apple className="w-6 h-6" />
                      </div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {t('noMealsLoggedThisDay')}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '360px' }}>
                        {isRTL 
                          ? 'سجّل وجباتك عبر تصوير الأطباق بالذكاء الاصطناعي لتحليل السعرات والماكروز بدقة.' 
                          : 'Log your meals with AI photo recognition to get instant macronutrient breakdown.'}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ marginTop: '0.35rem', padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                        onClick={() => navigate('/nutrition')}
                      >
                        <Utensils className="w-4 h-4" /> {t('logMealWithAI')}
                      </button>
                    </div>
                  ) : null
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {dayMeals.map((m: MealRecord) => {
                      const badge = getMealTypeBadge(m.mealType);

                      return (
                        <div key={m.id} className="day-meal-card">
                          {/* Dish Image or Icon */}
                          <div style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {m.imageUrl ? (
                              <img src={m.imageUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Utensils className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* Meal Info */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {m.title}
                              </h4>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: badge.color,
                                background: badge.bg,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                flexShrink: 0
                              }}>
                                {badge.label}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <span>{formatDate(new Date(m.date), 'h:mm a')}</span>
                              <span>•</span>
                              <span style={{ color: '#06b6d4', fontWeight: 700 }}>{m.calories} kcal</span>
                              {m.healthScore && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#10b981', fontWeight: 600 }}>⭐ {m.healthScore}/10</span>
                                </>
                              )}
                            </div>

                            {/* Macro Badges */}
                            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                                P: {m.protein}g
                              </span>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                C: {m.carbs}g
                              </span>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                F: {m.fats}g
                              </span>
                            </div>

                            {m.description && (
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {m.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* New / Edit Session Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSession?.id ? t('editSessionTitle') : t('newSessionTitle')}>
        <form onSubmit={handleSaveSession} className="flex flex-col gap-4">
          
          {!editingSession?.id && (
            <div>
              <label className="block mb-2 font-bold text-xs text-[var(--text-secondary)] uppercase tracking-wider">{t('quickTemplates')}</label>
              <div className="quick-templates-ribbon hide-scrollbar flex gap-2 overflow-x-auto pb-1.5 flex-nowrap overscroll-contain">
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Push Workout')}>{tTitle('Push Workout')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Pull Workout')}>{tTitle('Pull Workout')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Legs Workout')}>{tTitle('Legs Workout')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Chest Workout')}>{tMuscle('Chest')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Back Workout')}>{tMuscle('Back')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Shoulders Workout')}>{tMuscle('Shoulders')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Biceps Workout')}>{tMuscle('Biceps')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Triceps Workout')}>{tMuscle('Triceps')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Forearms Workout')}>{tMuscle('Forearms')}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('Core Workout')}>{tMuscle('Core')}</Button>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1.5 font-bold text-xs text-[var(--text-secondary)] uppercase">{t('sessionTitleInput')}</label>
            <input required type="text" className="input" value={editingSession?.title || ''} onChange={e => setEditingSession(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 font-bold text-xs text-[var(--text-secondary)] uppercase">{t('dateTimeInput')}</label>
              <input required type="datetime-local" className="input" value={editingSession?.date || ''} onChange={e => setEditingSession(prev => ({ ...prev, date: e.target.value }))} />
              {editingSession?.date && new Date(editingSession.date).getDay() === 5 && (
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🔒</span>
                  <span>{isRTL ? 'يوم الجمعة عطلة أسبوعية والجيم مغلق. يرجى اختيار يوم آخر.' : 'Friday is a weekly off-day (Gym closed). Please select another day.'}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 font-bold text-xs text-[var(--text-secondary)] uppercase">{t('durationInput')}</label>
              <input required type="number" min="1" className="input" value={editingSession?.duration || 60} onChange={e => setEditingSession(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="block mb-1.5 font-bold text-xs text-[var(--text-secondary)] uppercase">{t('typeInput')}</label>
            <select className="input" value={editingSession?.type || 'Strength'} onChange={e => setEditingSession(prev => ({ ...prev, type: e.target.value }))}>
              <option value="Strength">{t('strengthType')}</option>
              <option value="Cardio">{t('cardioType')}</option>
              <option value="Yoga">{t('yogaType')}</option>
              <option value="HIIT">{t('hiitType')}</option>
              <option value="Other">{t('otherType')}</option>
            </select>
          </div>
          <div>
            <label className="block mb-1.5 font-bold text-xs text-[var(--text-secondary)] uppercase">{t('notesInput')}</label>
            <textarea className="input" rows={3} value={editingSession?.notes || ''} onChange={e => setEditingSession(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)] mt-2">
            {editingSession?.id ? (
              <Button type="button" variant="danger" size="icon" onClick={() => handleDelete(editingSession.id!)} aria-label={t('delete')}>
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={Boolean(editingSession?.date && new Date(editingSession.date).getDay() === 5)}
                title={editingSession?.date && new Date(editingSession.date).getDay() === 5 ? (isRTL ? 'الجيم مغلق يوم الجمعة' : 'Gym is closed on Friday') : undefined}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Workout Generator Modal */}
      <AIWorkoutGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Clear Planned Workouts Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        size="md"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f87171' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {isRTL ? 'مسح التمارين المجدولة' : 'Clear Planned Workouts'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {isRTL ? 'إفراغ التقويم من الجلسات غير المكتملة' : 'Clear incomplete sessions from calendar'}
              </div>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isRTL 
              ? 'اختر النطاق الذي ترغب في حذفه من التقويم. لن يتم مسح أي تمرين تم إنجازه مسبقاً في السجل (History).' 
              : 'Choose the scope you want to clear. Completed workouts in your History will remain intact.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Option 1: Current Week */}
            <button
              type="button"
              disabled={isClearing || thisWeekPlannedSessions.length === 0}
              onClick={() => handleClearPlanned('week')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                cursor: thisWeekPlannedSessions.length > 0 ? 'pointer' : 'not-allowed',
                opacity: thisWeekPlannedSessions.length > 0 ? 1 : 0.45,
                textAlign: isRTL ? 'right' : 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {isRTL ? 'مسح تمارين هذا الأسبوع فقط' : 'Clear This Week Only'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatDate(startDate, 'd MMM')} – {formatDate(endDate, 'd MMM yyyy')}
                </div>
              </div>
              <span style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                {thisWeekPlannedSessions.length} {isRTL ? 'تمارين' : 'workouts'}
              </span>
            </button>

            {/* Option 2: Selected Day */}
            <button
              type="button"
              disabled={isClearing || selectedDayPlannedSessions.length === 0}
              onClick={() => handleClearPlanned('day')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                cursor: selectedDayPlannedSessions.length > 0 ? 'pointer' : 'not-allowed',
                opacity: selectedDayPlannedSessions.length > 0 ? 1 : 0.45,
                textAlign: isRTL ? 'right' : 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {isRTL ? `مسح تمارين يوم ${formatDate(selectedRibbonDay, 'EEEE')}` : `Clear ${formatDate(selectedRibbonDay, 'EEEE')} Only`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatDate(selectedRibbonDay, 'dd MMMM yyyy')}
                </div>
              </div>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                {selectedDayPlannedSessions.length} {isRTL ? 'تمارين' : 'workouts'}
              </span>
            </button>

            {/* Option 3: All Planned in Calendar */}
            <button
              type="button"
              disabled={isClearing || allPlannedSessions.length === 0}
              onClick={() => handleClearPlanned('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                cursor: allPlannedSessions.length > 0 ? 'pointer' : 'not-allowed',
                opacity: allPlannedSessions.length > 0 ? 1 : 0.45,
                textAlign: isRTL ? 'right' : 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f87171' }}>
                  {isRTL ? 'مسح جميع التمارين المجدولة (إفراغ كامل)' : 'Clear All Planned in Calendar'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {isRTL ? 'حذف كافة التمارين المستقبلية والمجدولة' : 'Delete all upcoming & planned workouts'}
                </div>
              </div>
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 900
              }}>
                {allPlannedSessions.length} {isRTL ? 'تمارين' : 'workouts'}
              </span>
            </button>
          </div>

          {/* Safety Notice & Cancel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '0.5rem'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              🛡️ {isRTL ? 'سجل التمارين المكتملة آمن' : 'Completed history is protected'}
            </span>
            <Button
              variant="ghost"
              onClick={() => setIsClearModalOpen(false)}
              disabled={isClearing}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
