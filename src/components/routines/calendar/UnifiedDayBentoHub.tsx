import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Dumbbell, Plus, Sparkles, Trophy, Utensils, 
  Droplets, Zap, Play, Trash2, Edit3, 
  RotateCcw, Moon
} from 'lucide-react';
import type { HistoryRecord, MealRecord, WorkoutSession, SessionExercise } from '../../../lib/api';
import { estimateWorkoutCalories } from '../../../lib/api';
import { isRestDay, type RestDaySource } from '../../../lib/restDay';
import { useData } from '../../../hooks/useData';
import { gymAudio } from '../../../lib/audio';
import { notify } from '../../../lib/feedback';
import { ROUTINE_PPL } from '../data/ppl';
import { computeMuscleRecovery } from '../../../lib/recovery';
import { formatTonnage, totalTonnage, toLocalDateTimeValue } from './calendarData';
import type { DayNutritionSummary } from './DayNutritionSection';

interface UnifiedDayBentoHubProps {
  day: Date;
  today: Date;
  sessions: WorkoutSession[];
  history: HistoryRecord[];
  meals: MealRecord[];
  nutrition: DayNutritionSummary;
  targets: { calories: number; protein: number; carbs: number; fats: number; water: number };
  isRTL: boolean;
  isClearing: boolean;
  restDaySettings?: RestDaySource;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onOpenSession: (id: string) => void;
  onEditSession: (session: WorkoutSession) => void;
  onComplete: (session: WorkoutSession) => void;
  onDelete: (id: string) => void;
  onAddSession: (day: Date) => void;
  onOpenAI: () => void;
  onGeneratePPL: () => void;
  onMoveToSaturday: () => void;
  onClearDay: () => void;
  onRepeatWorkout: (snapshot: WorkoutSession) => void;
  onLogMeal: () => void;
}

export function UnifiedDayBentoHub({
  day,
  today,
  sessions,
  history,
  meals,
  nutrition,
  targets,
  isRTL,
  isClearing,
  restDaySettings,
  t,
  tTitle,
  formatDate,
  onOpenSession,
  onEditSession,
  onDelete,
  onAddSession,
  onOpenAI,
  onClearDay,
  onRepeatWorkout,
  onLogMeal
}: UnifiedDayBentoHubProps) {
  const { data, saveSession, deleteSession, deleteSessions, logWater } = useData();
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const isToday = day.toDateString() === today.toDateString();
  const isRestDayForDay = isRestDay(day, restDaySettings);
  const dayCompleted = sessions.length === 0 && history.length > 0;

  // Recovery recommendation based on physiological state
  const recoveryOverview = useMemo(() => {
    return computeMuscleRecovery(data?.history || [], data?.sessions || []);
  }, [data?.history, data?.sessions]);

  const recommendedMuscles = recoveryOverview.recommendedMuscles;
  const topRecommended = recommendedMuscles.length > 0 
    ? (isRTL ? recommendedMuscles[0].nameAr : recommendedMuscles[0].nameEn)
    : (isRTL ? 'الصدر والذراعين' : 'Chest & Arms');

  // Quick Preset Routine Handlers
  const handleLaunchPreset = async (type: 'push' | 'pull' | 'legs' | 'cardio') => {
    try {
      setIsAddingPreset(true);
      gymAudio.triggerSubtleHaptic([20, 35]);

      const target = new Date(day);
      const now = new Date();
      target.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const sessionDate = toLocalDateTimeValue(target);

      if (type === 'push') {
        const template = ROUTINE_PPL.sessions[0];
        await saveSession({
          id: Math.random().toString(36).substring(2, 9),
          title: 'Push (Chest, Shoulders, Triceps)',
          type: 'Strength',
          date: sessionDate,
          duration: 60,
          notes: 'Launched via Quick Bento Planner',
          isCompleted: false,
          exercises: template.exercises.map(ex => ({ ...ex, id: Math.random().toString(36).substring(2, 9), notes: ex.notes || '' }))
        });
      } else if (type === 'pull') {
        const template = ROUTINE_PPL.sessions[1];
        await saveSession({
          id: Math.random().toString(36).substring(2, 9),
          title: 'Pull (Back, Biceps)',
          type: 'Strength',
          date: sessionDate,
          duration: 60,
          notes: 'Launched via Quick Bento Planner',
          isCompleted: false,
          exercises: template.exercises.map(ex => ({ ...ex, id: Math.random().toString(36).substring(2, 9), notes: ex.notes || '' }))
        });
      } else if (type === 'legs') {
        const template = ROUTINE_PPL.sessions[2];
        await saveSession({
          id: Math.random().toString(36).substring(2, 9),
          title: 'Legs & Core',
          type: 'Strength',
          date: sessionDate,
          duration: 65,
          notes: 'Launched via Quick Bento Planner',
          isCompleted: false,
          exercises: template.exercises.map(ex => ({ ...ex, id: Math.random().toString(36).substring(2, 9), notes: ex.notes || '' }))
        });
      } else if (type === 'cardio') {
        await saveSession({
          id: Math.random().toString(36).substring(2, 9),
          title: isRTL ? 'كارديو واستشفاء نشط' : 'Cardio & Active Recovery',
          type: 'Cardio',
          date: sessionDate,
          duration: 40,
          notes: 'Low-intensity recovery session',
          isCompleted: false,
          exercises: [
            {
              id: Math.random().toString(36).substring(2, 9),
              name: 'Incline Treadmill Walk',
              targetMuscle: 'Cardio',
              duration: 30,
              restTime: 0,
              notes: '',
              sets: [{ id: '1', weight: 0, repsTarget: 1, repsActual: 1, unit: 'kg', isCompleted: false }]
            }
          ]
        });
      }

      notify(isRTL ? '✓ تم إنشاء وإضافة الجلسة للجدول بنجاح!' : '✓ Workout added to schedule!', 'success');
    } catch {
      notify(isRTL ? 'تعذر إضافة الجلسة' : 'Failed to add workout', 'error');
    } finally {
      setIsAddingPreset(false);
    }
  };

  // Water Quick Add (+250ml)
  const handleQuickWater = async () => {
    try {
      gymAudio.triggerSubtleHaptic([15]);
      const dateKey = format(day, 'yyyy-MM-dd');
      await logWater(250, dateKey);
      notify(isRTL ? '💧 +250 مل ماء' : '💧 +250ml water logged', 'success');
    } catch {
      notify('Could not log water', 'error');
    }
  };

  // Calorie & Macro calculations
  const consumed = Math.round(nutrition.consumed);
  const targetCalories = targets.calories || 2400;
  const caloriePercent = Math.min(100, Math.round((consumed / targetCalories) * 100));
  const calorieRadius = 42;
  const calorieCircumference = 2 * Math.PI * calorieRadius;
  const calorieDashoffset = calorieCircumference * (1 - (caloriePercent / 100));

  const macros = [
    { label: t('protein'), value: Math.round(nutrition.protein), target: targets.protein, unit: 'g', color: '#38bdf8' },
    { label: t('carbs'), value: Math.round(nutrition.carbs), target: targets.carbs, unit: 'g', color: '#34d399' },
    { label: t('fats'), value: Math.round(nutrition.fats), target: targets.fats, unit: 'g', color: '#fbbf24' }
  ];

  return (
    <motion.section
      key={day.toISOString()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="calendar-selected-day-section unified-bento-hub"
      aria-label={formatDate(day, 'EEEE, dd MMMM yyyy')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginTop: '0.5rem'
      }}
    >
      {/* 1. Header Bar: Date Identity & Primary Actions */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.9rem 1.25rem',
          borderRadius: '18px',
          background: 'var(--premium-surface)',
          border: '1px solid var(--premium-line)',
          boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: isToday ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-tertiary)',
              border: isToday ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid var(--premium-line)',
              color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {formatDate(day, 'MMM')}
            </span>
            <span className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
              {formatDate(day, 'd')}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {formatDate(day, 'EEEE')}
              </h2>
              {isToday && (
                <span style={{ padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(0, 242, 254, 0.16)', color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 800 }}>
                  {t('today')}
                </span>
              )}
              {isRestDayForDay && (
                <span style={{ padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', fontSize: '0.72rem', fontWeight: 800 }}>
                  ✿ {isRTL ? 'يوم راحة' : 'Rest Day'}
                </span>
              )}
              {dayCompleted && (
                <span style={{ padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', fontSize: '0.72rem', fontWeight: 800 }}>
                  ✓ {t('completed')}
                </span>
              )}
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {formatDate(day, 'dd MMMM yyyy')}
              {sessions.length > 0 && ` • ${sessions.length} ${t('planned')}`}
              {history.length > 0 && ` • ${history.length} ${t('completed')}`}
              {meals.length > 0 && ` • ${meals.length} ${t('navNutrition')}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {sessions.length > 0 && (
            <button
              type="button"
              className="touch-target btn-icon btn-ghost"
              onClick={async (e) => {
                e.stopPropagation();
                gymAudio.triggerSubtleHaptic([30, 20]);
                try {
                  const sessionIds = sessions.map(s => s.id);
                  if (sessionIds.length > 0) {
                    await deleteSessions(sessionIds);
                    notify(isRTL ? `✓ تم مسح ${sessionIds.length} تمارين بنجاح` : `✓ Cleared ${sessionIds.length} workouts`, 'success');
                  }
                  if (onClearDay) onClearDay();
                } catch {
                  notify(isRTL ? 'تعذر مسح التمارين' : 'Could not clear workouts', 'error');
                }
              }}
              disabled={isClearing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} />
              <span>{isRTL ? 'مسح التمارين' : 'Clear'}</span>
            </button>
          )}

          <button
            type="button"
            className="touch-target"
            onClick={() => onAddSession(day)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
              border: 'none',
              color: '#04121b',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>{t('addSession')}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Bento Grid: Workouts (Left) + Fuel/Nutrition (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: '1rem',
          alignItems: 'stretch'
        }}
      >
        {/* CARD A: WORKOUT PLANNER & ACTIVE SESSIONS */}
        <div
          style={{
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)',
            borderRadius: '20px',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: 'var(--accent-primary)',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Dumbbell size={16} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isRTL ? 'مخطط التمارين والجلسات' : 'Workout Planner'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {sessions.length > 0
                      ? (isRTL ? `${sessions.length} جلسة مجدولة` : `${sessions.length} planned session(s)`)
                      : (isRTL ? 'لا توجد جلسات مجدولة بعد' : 'No planned sessions yet')}
                  </span>
                </div>
              </div>

              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => onAddSession(day)}
                  className="touch-target btn-icon btn-ghost"
                  style={{ color: 'var(--accent-primary)', width: 32, height: 32 }}
                  title={t('addSession')}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {/* If sessions exist for this day: List them */}
            {sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {sessions.map((session, sIdx) => {
                  const exercisesCount = session.exercises?.length || 0;
                  const totalSets = (session.exercises || []).reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);

                  return (
                    <div
                      key={session.id || sIdx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--premium-line)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {tTitle(session.title)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(0, 242, 254, 0.12)',
                              color: 'var(--accent-primary)'
                            }}
                          >
                            {session.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {exercisesCount} {isRTL ? 'تمارين' : 'exercises'} • {totalSets} {isRTL ? 'جولة' : 'sets'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onOpenSession(session.id)}
                          className="touch-target"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: '#04121b',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Play size={14} fill="#04121b" />
                          <span>{isRTL ? 'ابدأ' : 'Start'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditSession(session)}
                          className="touch-target btn-icon btn-ghost"
                          style={{ width: 34, height: 34, color: 'var(--text-muted)' }}
                          title={isRTL ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            gymAudio.triggerSubtleHaptic([30, 20]);
                            try {
                              await deleteSession(session.id);
                              notify(isRTL ? '✓ تم حذف الجلسة بنجاح' : '✓ Workout session deleted', 'success');
                              if (onDelete) onDelete(session.id);
                            } catch {
                              notify(isRTL ? 'تعذر حذف الجلسة' : 'Could not delete session', 'error');
                            }
                          }}
                          className="touch-target btn-icon btn-ghost"
                          style={{ width: 34, height: 34, color: '#f43f5e' }}
                          title={isRTL ? 'حذف' : 'Delete'}
                          aria-label={isRTL ? `حذف ${session.title}` : `Delete ${session.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* If no sessions: Display AI Smart Recommendation & 4 One-Tap Launchers */
              <div>
                {/* AI Recommendation Banner */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(0, 242, 254, 0.08) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Zap size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 800, color: '#34d399' }}>
                      {isRTL ? 'مقترح اليوم:' : 'Smart Pick:'}{' '}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {isRTL
                        ? `استناداً لجاهزية عضلاتك، يُنصح بتمرين (${topRecommended})`
                        : `Ready to hit (${topRecommended}) based on muscle recovery`}
                    </span>
                  </div>
                </div>

                {/* 4 Quick One-Tap Routine Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.6rem',
                    marginBottom: '0.85rem'
                  }}
                >
                  <button
                    type="button"
                    disabled={isAddingPreset}
                    onClick={() => handleLaunchPreset('push')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--premium-line)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>💪</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Push Day
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {isRTL ? 'صدر • أكتاف • تراي' : 'Chest • Shoulders'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAddingPreset}
                    onClick={() => handleLaunchPreset('pull')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--premium-line)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🦾</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Pull Day
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {isRTL ? 'ظهر • باي • ترابيس' : 'Back • Biceps'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAddingPreset}
                    onClick={() => handleLaunchPreset('legs')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--premium-line)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🦵</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Legs & Core
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {isRTL ? 'فخذ • بطن • سمانة' : 'Quads • Glutes'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAddingPreset}
                    onClick={() => handleLaunchPreset('cardio')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--premium-line)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🏃</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Cardio & Rec
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {isRTL ? 'سير • لياقة • استشفاء' : 'Recovery Cardio'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Direct Actions: AI Generator & Custom Session */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={onOpenAI}
                    className="touch-target"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--premium-line)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={15} color="#00f2fe" />
                    <span>{isRTL ? 'توليد بالذكاء الاصطناعي' : 'AI Generator'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddSession(day)}
                    className="touch-target"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem',
                      borderRadius: '12px',
                      background: 'rgba(0, 242, 254, 0.14)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} />
                    <span>{isRTL ? 'جلسة مخصصة' : 'Custom Session'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD B: DAILY NUTRITION & FUEL BENTO */}
        <div
          style={{
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)',
            borderRadius: '20px',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Utensils size={16} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isRTL ? 'الوقود والتغذية اليومية' : 'Daily Fuel & Nutrition'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {meals.length > 0
                      ? (isRTL ? `${meals.length} وجبات مسجلة اليوم` : `${meals.length} logged meals`)
                      : (isRTL ? 'لم تُسجل وجبات بعد' : 'No meals logged yet')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogMeal}
                className="touch-target btn-icon btn-ghost"
                style={{ color: '#34d399', width: 32, height: 32 }}
                title={t('logMeal')}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Glowing Circular Calorie Meter + Macro Stack */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {/* Circular Gauge */}
              <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r={calorieRadius} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r={calorieRadius}
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={calorieCircumference}
                    strokeDashoffset={calorieDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div className="tabular-nums font-mono" style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                    {consumed}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    /{targetCalories}
                  </div>
                </div>
              </div>

              {/* 3 Macro Bars */}
              <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {macros.map(m => {
                  const pct = Math.min(100, Math.round((m.value / (m.target || 1)) * 100));
                  return (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.15rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{m.label}</span>
                        <span className="tabular-nums font-mono" style={{ color: m.color, fontWeight: 800 }}>
                          {m.value}/{m.target}{m.unit}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hydration Bar with Quick +250ml Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={16} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {isRTL ? 'الماء والسوائل' : 'Hydration'}
                  </div>
                  <div className="tabular-nums font-mono" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8' }}>
                    {(nutrition.water / 1000).toFixed(1)}L / {(targets.water / 1000).toFixed(1)}L
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickWater}
                className="touch-target"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.18)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>+250ml</span>
              </button>
            </div>
          </div>

          {/* Quick Action: Log Meal button */}
          <button
            type="button"
            onClick={onLogMeal}
            className="touch-target"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.65rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 242, 254, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} />
            <span>{isRTL ? 'تسجيل وجبة جديدة' : 'Log New Meal'}</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Card: Completed Activity & Highlights (Only if records exist, or clean rest state) */}
      {history.length > 0 ? (
        <div
          style={{
            background: 'var(--premium-surface)',
            border: '1px solid var(--premium-line)',
            borderRadius: '20px',
            padding: '1.15rem',
            boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  color: '#facc15',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <Trophy size={16} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isRTL ? 'إنجازات وجلسات اليوم المكتملة' : 'Completed Workouts & Milestones'}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {history.length} {isRTL ? 'جلسات منجزة بنجاح' : 'completed session(s)'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.65rem' }}>
            {history.map(record => {
              const workout = record.snapshot;
              const exercises = workout?.exercises || [];
              const totalSets = exercises.reduce((sum: number, ex: SessionExercise) => sum + (ex.sets?.length || 0), 0);
              const tonnageNum = exercises.reduce((sum, exercise) => sum + totalTonnage(exercise.sets), 0);
              const tonnage = formatTonnage(tonnageNum);
              const burned = record.burnedCalories || (workout ? estimateWorkoutCalories(workout) : 0);

              return (
                <div
                  key={record.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--premium-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {tTitle(record.title)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <span className="tabular-nums font-mono">{totalSets} {isRTL ? 'جولة' : 'sets'}</span>
                      {tonnage && <span>• {tonnage}</span>}
                      {burned > 0 && <span className="tabular-nums" style={{ color: '#f59e0b' }}>• 🔥 {Math.round(burned)} kcal</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => workout && onRepeatWorkout(workout)}
                    className="touch-target btn-icon btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--premium-line)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>{isRTL ? 'تكرار' : 'Repeat'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : isRestDayForDay ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '18px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <Moon size={22} color="#34d399" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ fontWeight: 800, color: '#34d399' }}>
              {isRTL ? 'يوم راحة مخصص للاستشفاء الكامل:' : 'Rest & Recovery Day:'}{' '}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRTL
                ? 'استمتع بنوم كافٍ واحرص على شرب كمية وافرة من الماء وتناول كميات البروتين المستهدفة لتجهيز عضلاتك.'
                : 'Prioritize deep sleep, proper hydration, and hit your protein target to recover for upcoming sessions.'}
            </span>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
