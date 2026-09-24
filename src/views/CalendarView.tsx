import { useState } from 'react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Moon, Dumbbell, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { WorkoutSession, SessionExercise, estimateWorkoutCalories } from '../lib/api';
import { useData } from '../hooks/useData';
import { Modal } from '../components/Modal';
import { AIWorkoutGeneratorModal } from '../components/AIWorkoutGeneratorModal';
import { useTranslation } from '../lib/i18n';

export function CalendarView() {
  const { data, saveSession, saveSessions, deleteSession, deleteSessions, saveHistory } = useData();
  const { t, formatDate, tTitle, tMuscle, isRTL } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  
  // Modal state for NEW sessions only
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<WorkoutSession> | null>(null);

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

  // Align start of week with user's settings (Sunday by default)
  const weekStartsOn = (data.settings?.weekStartsOn === 'monday' ? 1 : 0);
  const startDate = startOfWeek(currentDate, { weekStartsOn });
  startDate.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    // Friday (5) is a rest day, prevent saving
    if (editingSession?.date && new Date(editingSession.date).getDay() === 5) {
      alert(t('restDayAlert'));
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

  const completeDayWorkout = async (day: Date, daySessions: WorkoutSession[]) => {
    if (!data || daySessions.length === 0) return;
  
    const isDayCompleted = data.history.some(h => isSameDay(new Date(h.date), day));
    if (isDayCompleted) return;
  
    const allExercises = daySessions.flatMap(s => s.exercises || []);
    const combinedTitle = daySessions.map(s => s.title).join(' + ') || 'Daily Workout';
    
    // Set time to something reasonable for the day, maybe 18:00
    const completionDate = new Date(day);
    completionDate.setHours(18, 0, 0, 0);

    const snapshotSession = {
      id: `day-${Date.now()}`,
      title: combinedTitle,
      date: completionDate.toISOString(),
      duration: daySessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      type: 'Mixed',
      notes: 'Consolidated daily workout',
      isCompleted: true,
      exercises: allExercises
    };
  
    await saveHistory({
      id: Date.now().toString(),
      sessionId: `day-${format(day, 'yyyy-MM-dd')}`,
      date: completionDate.toISOString(),
      title: combinedTitle,
      snapshot: snapshotSession,
      burnedCalories: estimateWorkoutCalories(snapshotSession)
    });
  
    const uncompleted = daySessions.filter(s => !s.isCompleted);
    if (uncompleted.length > 0) {
      await saveSessions(uncompleted.map(session => ({ ...session, isCompleted: true })));
    }
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
          { id: Date.now()+Math.random()+'', name: 'Bench Press', targetMuscle: 'Chest', restTime: 90, notes: '', videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4', sets: [{id: '1', weight: 0, repsTarget: 10, repsActual: 0, unit: 'lb', isCompleted: false}] },
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
        { id: Date.now()+Math.random()+'', name: 'Barbell Bench Press', targetMuscle: 'Chest', restTime: 120, notes: 'Keep feet firmly planted and squeeze your shoulder blades together to create a solid base.', videoUrl: 'https://www.youtube.com/embed/5SSdbmIjNj4', sets: [
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
      className="page-surface calendar-page flex-col" 
      style={{ display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}
    >
      {/* Header Area */}
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '2.5rem' }}>{t('weeklyCalendar')}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{formatDate(startDate, 'MMMM yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '2rem', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button className="btn-icon btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(d => addDays(d, -7))} title={t('previousWeek')}><ChevronLeft className="w-4 h-4" /></button>
            <button className="btn-icon btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(new Date())}>{t('today')}</button>
            <button className="btn-icon btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: '2rem' }} onClick={() => setCurrentDate(d => addDays(d, 7))} title={t('nextWeek')}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '0.85rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 4px 16px -2px rgba(168, 85, 247, 0.4)',
              cursor: 'pointer'
            }}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{t('aiGenerator')}</span>
          </button>
          <button className="btn btn-primary" onClick={() => openNewModal()}>
            <Plus className="w-5 h-5" /> {t('addSession')}
          </button>
        </div>
      </div>

      {data?.sessions.length === 0 && (
        <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)', margin: '0 0 1rem 0' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>{t('readyToGetStarted')}</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            {t('noWorkoutsScheduled')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsAIModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
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
              <span>{t('generateCustomAIPlan')}</span>
            </button>
            <button className="btn btn-secondary" onClick={generatePPL}>{t('generatePPLRoutine')}</button>
          </div>
        </div>
      )}

      {duplicateSessionIds.length > 0 && (
        <div style={{ 
          padding: '1rem 1.25rem', 
          marginBottom: '1rem', 
          backgroundColor: 'rgba(245, 158, 11, 0.12)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--warning)' }}>
                {t('duplicateSessionsDetected')} ({duplicateSessionIds.length})
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {t('duplicateDesc')}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
            onClick={async () => {
              if (confirm(`${t('removeDuplicatesConfirm')} (${duplicateSessionIds.length})`)) {
                await deleteSessions(duplicateSessionIds);
              }
            }}
          >
            {t('cleanUpDuplicates')}
          </button>
        </div>
      )}

      {pastIncompleteSessionIds.length > 0 && (
        <div style={{ 
          padding: '1rem 1.25rem', 
          marginBottom: '1rem', 
          backgroundColor: 'rgba(239, 68, 68, 0.08)', 
          border: '1px solid rgba(239, 68, 68, 0.25)', 
          borderRadius: '1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ef4444' }}>
                {t('pastIncompleteDetected')} ({pastIncompleteSessionIds.length})
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {t('pastIncompleteDesc')}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            onClick={async () => {
              if (confirm(`${t('cleanUpPastIncomplete')} (${pastIncompleteSessionIds.length})?`)) {
                await deleteSessions(pastIncompleteSessionIds);
              }
            }}
          >
            {t('cleanUpPastIncomplete')}
          </button>
        </div>
      )}

      {/* Calendar List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, new Date());
          const isPastDay = !isToday && day < todayStart;
          const daySessions = data?.sessions.filter(s => isSameDay(new Date(s.date), day)) || [];
          const isDayCompleted = data?.history.some(h => isSameDay(new Date(h.date), day)) || false;

          return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} key={day.toISOString()} className="calendar-day-row" style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', padding: '1.5rem', minHeight: '140px', flexShrink: 0 }}>
              
              {/* Left Date Column */}
              <div className="calendar-date-col" style={{ minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', [isRTL ? 'paddingLeft' : 'paddingRight']: '1.5rem', [isRTL ? 'borderLeft' : 'borderRight']: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {formatDate(day, 'EEEE')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {formatDate(day, 'dd')}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {formatDate(day, 'MMM').toUpperCase()}
                  </span>
                </div>
                {isToday && (
                  <div style={{ marginTop: '0.5rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '1rem', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    {t('today').toUpperCase()}
                  </div>
                )}
                
                {daySessions.length > 0 && (
                   isDayCompleted ? (
                     <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
                       <CheckCircle className="w-3 h-3" /> {t('completed')}
                     </div>
                   ) : isPastDay ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                       <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.15rem 0.45rem', borderRadius: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                         {t('missedWorkout')}
                       </span>
                       <button 
                         className="btn btn-secondary" 
                         style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                         onClick={(e) => { e.stopPropagation(); completeDayWorkout(day, daySessions); }}
                       >
                         <CheckCircle className="w-3 h-3" style={{ display: 'inline', [isRTL ? 'marginLeft' : 'marginRight']: '0.2rem' }} /> {t('complete')}
                       </button>
                     </div>
                   ) : (
                     <button 
                       className="btn btn-secondary" 
                       style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                       onClick={(e) => { e.stopPropagation(); completeDayWorkout(day, daySessions); }}
                     >
                       <CheckCircle className="w-3 h-3" style={{ display: 'inline', [isRTL ? 'marginLeft' : 'marginRight']: '0.2rem' }} /> {t('complete')}
                     </button>
                   )
                )}
              </div>

              {/* Sessions Area */}
              <div 
                className="hide-scrollbar calendar-sessions-area"
                style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', flex: 1, paddingLeft: '1.5rem', alignItems: 'stretch', alignContent: 'flex-start' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  
                  // Friday is a rest day, no sessions allowed
                  if (day.getDay() === 5) {
                    alert(t('restDayAlert'));
                    return;
                  }

                  const sessionId = e.dataTransfer.getData('text/plain');
                  if (sessionId && data) {
                    const sessionToMove = data.sessions.find(s => s.id === sessionId);
                    if (sessionToMove) {
                      const oldDate = new Date(sessionToMove.date);
                      const newDate = new Date(day);
                      newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
                      const dateStr = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                      
                      const updatedSession = { ...sessionToMove, date: dateStr };
                      
                      await saveSession(updatedSession);
                    }
                  }
                }}
              >
                {day.getDay() === 5 && daySessions.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', marginRight: '1rem' }}>
                      <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      {t('restDayNotice')}
                    </span>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {daySessions.map((session: WorkoutSession) => {
                        const typeColor = getTypeColor(session.type, session.title);
                        const muscles = getTargetMusclesText(session.exercises);

                        return (
                          <motion.div 
                            layout
                            draggable={true}
                            onDragStart={(e: any) => {
                              e.dataTransfer.setData('text/plain', session.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e: any) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={async (e: any) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (day.getDay() === 5) {
                                alert(t('restDayAlert'));
                                return;
                              }

                              const draggedSessionId = e.dataTransfer.getData('text/plain');
                              const targetSessionId = session.id;
                              
                              if (draggedSessionId === targetSessionId || !data) return;

                              const draggedSession = data.sessions.find(s => s.id === draggedSessionId);
                              if (!draggedSession) return;
                              
                              const oldDate = new Date(draggedSession.date);
                              const newDate = new Date(day);
                              newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
                              const dateStr = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                              
                              const updatedSession = { ...draggedSession, date: dateStr };
                              
                              await saveSession(updatedSession);
                            }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={session.id} 
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="calendar-session-card"
                            style={{ 
                              minWidth: '320px',
                              maxWidth: '400px',
                              flex: 1,
                              padding: '1.25rem', 
                              cursor: 'pointer',
                              borderRadius: '1rem', 
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderInlineStart: `3px solid ${typeColor}`,
                              opacity: session.isCompleted ? 0.7 : 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem',
                              flexShrink: 0
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: typeColor, flexShrink: 0 }} />
                                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tTitle(session.title)}</h3>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                <div style={{ backgroundColor: `${typeColor}15`, color: typeColor, padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${typeColor}30` }}>
                                  {formatDate(new Date(session.date), 'h:mm a')}
                                </div>
                                <button
                                  type="button"
                                  className="btn-icon btn-ghost"
                                  style={{
                                    padding: '0.25rem',
                                    borderRadius: '0.4rem',
                                    color: 'var(--text-muted)',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(session.id);
                                  }}
                                  title={t('deleteSession')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', minHeight: '1.25rem' }}>
                              {muscles ? tMuscle(muscles) : (session.exercises?.length ? t('multipleMuscles') : t('noExercises'))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{session.duration} {t('min')}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <Dumbbell className="w-3.5 h-3.5" />
                                <span>{session.exercises?.length || 0} {t('exercises')}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button 
                        onClick={() => openNewModal(day)}
                        className="btn-ghost calendar-add-btn" 
                        style={{ minWidth: '200px', height: '110px', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <Plus className="w-5 h-5" />
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{t('addSession')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal remains the same */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSession?.id ? t('editSessionTitle') : t('newSessionTitle')}>
        <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!editingSession?.id && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('quickTemplates')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Push Workout')}>{tTitle('Push Workout')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Pull Workout')}>{tTitle('Pull Workout')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Legs Workout')}>{tTitle('Legs Workout')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Chest Workout')}>{tMuscle('Chest')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Back Workout')}>{tMuscle('Back')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Shoulders Workout')}>{tMuscle('Shoulders')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Biceps Workout')}>{tMuscle('Biceps')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Triceps Workout')}>{tMuscle('Triceps')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Forearms Workout')}>{tMuscle('Forearms')}</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => applyTemplate('Core Workout')}>{tMuscle('Core')}</button>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('sessionTitleInput')}</label>
            <input required type="text" className="input" value={editingSession?.title || ''} onChange={e => setEditingSession(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('dateTimeInput')}</label>
              <input required type="datetime-local" className="input" value={editingSession?.date || ''} onChange={e => setEditingSession(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('durationInput')}</label>
              <input required type="number" min="1" className="input" value={editingSession?.duration || 60} onChange={e => setEditingSession(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('typeInput')}</label>
            <select className="input" value={editingSession?.type || 'Strength'} onChange={e => setEditingSession(prev => ({ ...prev, type: e.target.value }))}>
              <option value="Strength">{t('strengthType')}</option>
              <option value="Cardio">{t('cardioType')}</option>
              <option value="Yoga">{t('yogaType')}</option>
              <option value="HIIT">{t('hiitType')}</option>
              <option value="Other">{t('otherType')}</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('notesInput')}</label>
            <textarea className="input" rows={3} value={editingSession?.notes || ''} onChange={e => setEditingSession(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            {editingSession?.id ? (
              <button type="button" className="btn-icon btn-ghost" onClick={() => handleDelete(editingSession.id!)} style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-5 h-5" />
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('save')}</button>
            </div>
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
