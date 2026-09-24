import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { 
  Activity, Flame, Trophy, Search, ChevronDown, ChevronUp, 
  Utensils, Scale, Dumbbell, Calendar, Sparkles, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../hooks/useData';
import { estimateWorkoutCalories, MealRecord, HistoryRecord } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { WeeklyCoachDigestModal } from '../components/WeeklyCoachDigestModal';

type ActivityFilter = 'all' | 'workouts' | 'nutrition';

export function HistoryView() {
  const { data, deleteHistory, deleteMeal } = useData();
  const { t, isRTL, formatDate, tTitle, tExercise } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityFilter>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);

  const getMealTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return t('breakfast');
      case 'lunch': return t('lunch');
      case 'dinner': return t('dinner');
      case 'snack': return t('snack');
      default: return type;
    }
  };

  if (!data) return null;

  const historyItems = useMemo(() => (data.history || []).slice().reverse(), [data.history]);
  const mealsItems = useMemo(() => (data.meals || []).slice().reverse(), [data.meals]);

  const totalCompletedWorkouts = historyItems.length;
  const totalLoggedMeals = mealsItems.length;

  // Calculate total calories burned across all workouts
  const totalAllTimeBurned = useMemo(() => {
    return historyItems.reduce((acc, h) => {
      return acc + (h.burnedCalories || estimateWorkoutCalories(h.snapshot));
    }, 0);
  }, [historyItems]);

  // Calculate weekly consistency properly:
  // Consider only sessions scheduled in the CURRENT week.
  // Past days before the routine was added have 0 scheduled sessions, so they do NOT penalize the athlete.
  const { totalSessionsThisWeek, completedThisWeek, completionPercentage } = useMemo(() => {
    if (!data?.sessions || data.sessions.length === 0) {
      return { totalSessionsThisWeek: 0, completedThisWeek: 0, completionPercentage: 100 };
    }

    const today = new Date();
    const weekStartsOn = (data.settings?.weekStartsOn === 'monday' ? 1 : 0);
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn });
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
    endOfCurrentWeek.setHours(23, 59, 59, 999);

    const thisWeekSessions = data.sessions.filter(s => {
      const d = new Date(s.date);
      return !isNaN(d.getTime()) && d >= startOfCurrentWeek && d <= endOfCurrentWeek;
    });

    const totalScheduled = thisWeekSessions.length;
    const completed = thisWeekSessions.filter(s => s.isCompleted).length;

    if (totalScheduled === 0) {
      return { totalSessionsThisWeek: 0, completedThisWeek: 0, completionPercentage: 100 };
    }

    const percentage = Math.round((completed / totalScheduled) * 100);
    return {
      totalSessionsThisWeek: totalScheduled,
      completedThisWeek: completed,
      completionPercentage: percentage
    };
  }, [data?.sessions, data?.settings?.weekStartsOn]);

  // Group all dates from both workouts and meals
  const groupedDays = useMemo(() => {
    const map = new Map<string, {
      date: Date;
      workouts: HistoryRecord[];
      meals: MealRecord[];
      caloriesBurned: number;
      caloriesConsumed: number;
      protein: number;
      carbs: number;
      fats: number;
    }>();

    // Add workouts
    historyItems.forEach(entry => {
      const d = new Date(entry.date);
      const dateKey = isNaN(d.getTime()) ? 'Unknown' : format(d, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: isNaN(d.getTime()) ? new Date() : d,
          workouts: [],
          meals: [],
          caloriesBurned: 0,
          caloriesConsumed: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        });
      }
      const dayData = map.get(dateKey)!;
      dayData.workouts.push(entry);
      dayData.caloriesBurned += entry.burnedCalories || estimateWorkoutCalories(entry.snapshot);
    });

    // Add meals
    mealsItems.forEach(meal => {
      const d = new Date(meal.date);
      const dateKey = isNaN(d.getTime()) ? 'Unknown' : format(d, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: isNaN(d.getTime()) ? new Date() : d,
          workouts: [],
          meals: [],
          caloriesBurned: 0,
          caloriesConsumed: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        });
      }
      const dayData = map.get(dateKey)!;
      dayData.meals.push(meal);
      dayData.caloriesConsumed += meal.calories || 0;
      dayData.protein += meal.protein || 0;
      dayData.carbs += meal.carbs || 0;
      dayData.fats += meal.fats || 0;
    });

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [historyItems, mealsItems]);

  // Apply search and filter
  const filteredDays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return groupedDays.filter(([, dayData]) => {
      // Filter tab
      if (filterType === 'workouts' && dayData.workouts.length === 0) return false;
      if (filterType === 'nutrition' && dayData.meals.length === 0) return false;

      if (!q) return true;

      // Check date matching
      const formattedDate = format(dayData.date, 'MMMM d yyyy EEEE').toLowerCase();
      if (formattedDate.includes(q)) return true;

      // Check workouts matching
      const matchesWorkout = dayData.workouts.some(w => 
        w.title?.toLowerCase().includes(q) ||
        w.snapshot?.type?.toLowerCase().includes(q) ||
        w.snapshot?.exercises?.some(e => e.name?.toLowerCase().includes(q))
      );
      if (matchesWorkout) return true;

      // Check meals matching
      const matchesMeal = dayData.meals.some(m => 
        m.title?.toLowerCase().includes(q) ||
        m.mealType?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.ingredients?.some(i => i.name?.toLowerCase().includes(q))
      );
      return matchesMeal;
    });
  }, [groupedDays, searchQuery, filterType]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="page-surface history-page flex-col h-full"
      style={{ paddingBottom: '4rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.85rem', fontWeight: 800 }}>{t('historyTitle')}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('historySubtitle')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsDigestOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            border: 'none',
            padding: '0.65rem 1.15rem',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('weeklyCoachDigest')}</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'rgba(70, 217, 255, 0.12)', borderRadius: '12px', color: '#46d9ff' }}>
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{totalCompletedWorkouts}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('workoutsFinished')}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: '#10b981' }}>
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{totalLoggedMeals}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('mealsTracked')}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px', color: '#f59e0b' }}>
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{totalAllTimeBurned}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('totalCaloriesBurned')}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: '12px', color: '#8b5cf6' }}>
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{completionPercentage}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t('weeklyConsistency')}{totalSessionsThisWeek > 0 ? ` (${completedThisWeek}/${totalSessionsThisWeek})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '1rem', 
        marginBottom: '1.25rem',
        flexWrap: 'wrap'
      }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: filterType === 'all' ? 'var(--accent-primary)' : 'transparent',
              color: filterType === 'all' ? '#000' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t('allActivity')}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('workouts')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: filterType === 'workouts' ? 'var(--accent-primary)' : 'transparent',
              color: filterType === 'workouts' ? '#000' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
          >
            <Dumbbell size={14} /> {t('workoutsOnly')}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nutrition')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: filterType === 'nutrition' ? 'var(--accent-primary)' : 'transparent',
              color: filterType === 'nutrition' ? '#000' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
          >
            <Utensils size={14} /> {t('mealsOnly')}
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: '240px' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '0.85rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={t('searchWorkoutsOrDishes')} 
            className="input" 
            style={{ 
              paddingLeft: isRTL ? '1rem' : '2.4rem', 
              paddingRight: isRTL ? '2.4rem' : '1rem', 
              width: '100%', 
              borderRadius: '10px' 
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* History Timeline Cards */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredDays.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity className="w-10 h-10" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{t('noHistoryYet')}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {t('noHistoryDesc')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredDays.map(([dateKey, dayData], idx) => {
              const isExpanded = expandedDate === dateKey;
              const netBalance = dayData.caloriesConsumed - dayData.caloriesBurned;

              return (
                <div 
                  key={dateKey} 
                  style={{ 
                    borderBottom: idx === filteredDays.length - 1 ? 'none' : '1px solid var(--border-color)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {/* Day Header Row */}
                  <div 
                    onClick={() => setExpandedDate(isExpanded ? null : dateKey)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                          {formatDate(dayData.date, 'EEEE, d MMMM yyyy')}
                        </h4>
                      </div>
                      
                      {/* Counts */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <span>{dayData.workouts.length} {dayData.workouts.length === 1 ? t('workoutWord') : t('workoutsWord')}</span>
                        <span>•</span>
                        <span>{dayData.meals.length} {dayData.meals.length === 1 ? t('mealWord') : t('mealsWord')}</span>
                      </div>
                    </div>

                    {/* Daily Energy Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      {/* Calories Consumed */}
                      {dayData.caloriesConsumed > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.35rem 0.65rem', borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                          fontSize: '0.8rem', fontWeight: 700
                        }}>
                          <Utensils size={13} />
                          <span>+{dayData.caloriesConsumed} kcal</span>
                        </div>
                      )}

                      {/* Calories Burned */}
                      {dayData.caloriesBurned > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.35rem 0.65rem', borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                          fontSize: '0.8rem', fontWeight: 700
                        }}>
                          <Flame size={13} />
                          <span>-{dayData.caloriesBurned} kcal</span>
                        </div>
                      )}

                      {/* Net Balance */}
                      {(dayData.caloriesConsumed > 0 || dayData.caloriesBurned > 0) && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.35rem 0.65rem', borderRadius: '8px',
                          background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4',
                          fontSize: '0.8rem', fontWeight: 700
                        }}>
                          <Scale size={13} />
                          <span>{t('netWord')}: {netBalance > 0 ? `+${netBalance}` : netBalance}</span>
                        </div>
                      )}

                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ 
                          padding: '1.5rem', 
                          backgroundColor: 'var(--bg-tertiary)', 
                          borderTop: '1px dashed var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.75rem'
                        }}>
                          {/* Daily Nutrition Breakdown If Available */}
                          {dayData.meals.length > 0 && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Utensils size={16} style={{ color: '#10b981' }} /> {t('loggedMealsAndDishes')}
                                </h5>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  P: <strong style={{ color: '#06b6d4' }}>{dayData.protein}g</strong> | 
                                  C: <strong style={{ color: '#f59e0b' }}> {dayData.carbs}g</strong> | 
                                  F: <strong style={{ color: '#ec4899' }}> {dayData.fats}g</strong>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                {dayData.meals.map((meal) => (
                                  <div 
                                    key={meal.id} 
                                    style={{ 
                                      background: 'var(--bg-input)', 
                                      borderRadius: '12px', 
                                      padding: '1rem',
                                      border: '1px solid var(--border-color)',
                                      display: 'flex',
                                      gap: '0.85rem'
                                    }}
                                  >
                                    {meal.imageUrl && (
                                      <img 
                                        src={meal.imageUrl} 
                                        alt={meal.title}
                                        style={{ width: '68px', height: '68px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                      />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                        <span style={{ 
                                          fontSize: '0.72rem', textTransform: 'capitalize', fontWeight: 700,
                                          background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: '4px' 
                                        }}>
                                          {getMealTypeLabel(meal.mealType)}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>
                                            {meal.calories} kcal
                                          </span>
                                          <button
                                            type="button"
                                            className="btn-icon btn-ghost"
                                            style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                                            title={t('delete')}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (confirm(t('deleteMealConfirm'))) {
                                                await deleteMeal(meal.id);
                                              }
                                            }}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      <h6 style={{ margin: '0.35rem 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 700 }}>
                                        {meal.title}
                                      </h6>

                                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem' }}>
                                        <span>P: {meal.protein}g</span>
                                        <span>C: {meal.carbs}g</span>
                                        <span>F: {meal.fats}g</span>
                                      </div>

                                      {meal.aiNotes && (
                                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          💡 {meal.aiNotes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Workouts Breakdown If Available */}
                          {dayData.workouts.length > 0 && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Dumbbell size={16} style={{ color: 'var(--accent-primary)' }} /> {t('completedWorkoutsAndExercises')}
                                </h5>
                                <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                                  🔥 -{dayData.caloriesBurned} kcal
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {dayData.workouts.map((workout) => {
                                  const burned = workout.burnedCalories || estimateWorkoutCalories(workout.snapshot);
                                  const exercises = workout.snapshot?.exercises || [];

                                  return (
                                    <div 
                                      key={workout.id} 
                                      style={{ 
                                        background: 'var(--bg-input)', 
                                        borderRadius: '12px', 
                                        padding: '1.15rem',
                                        border: '1px solid var(--border-color)'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                                        <div>
                                          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{tTitle(workout.title)}</span>
                                          <span style={{ 
                                            margin: isRTL ? '0 0.6rem 0 0' : '0 0 0 0.6rem', fontSize: '0.72rem', background: 'rgba(70, 217, 255, 0.1)', 
                                            color: 'var(--accent-primary)', padding: '0.15rem 0.5rem', borderRadius: '6px' 
                                          }}>
                                            {workout.snapshot?.type || 'Mixed'}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                          <div style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
                                            ~{burned} kcal ({workout.snapshot?.duration || 45} {t('min')})
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-icon btn-ghost"
                                            style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                                            title={t('delete')}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (confirm(t('deleteHistoryConfirm'))) {
                                                await deleteHistory(workout.id);
                                              }
                                            }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>

                                      {exercises.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                                          {exercises.map((ex: any, exIdx: number) => (
                                            <div key={ex.id || exIdx} style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '0.5rem', [isRTL ? 'borderRight' : 'borderLeft']: '2px solid var(--border-highlight)' }}>
                                              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{tExercise(ex.name)}</div>
                                              <table style={{ width: '100%', fontSize: '0.8rem', textAlign: isRTL ? 'right' : 'left', borderCollapse: 'collapse' }}>
                                                <thead>
                                                  <tr style={{ color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '0.2rem 0' }}>{t('setWord')}</th>
                                                    <th style={{ padding: '0.2rem 0' }}>{t('weight')}</th>
                                                    <th style={{ padding: '0.2rem 0' }}>{t('repsActualTarget')}</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {ex.sets?.map((set: any, sIdx: number) => (
                                                    <tr key={set.id || sIdx}>
                                                      <td style={{ padding: '0.2rem 0' }}>{sIdx + 1}</td>
                                                      <td style={{ padding: '0.2rem 0' }}>{set.weight} {set.unit}</td>
                                                      <td style={{ padding: '0.2rem 0' }}>{set.repsActual} / {set.repsTarget}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                          {t('generalSessionNoSets')}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WeeklyCoachDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
      />
    </motion.div>
  );
}

export default HistoryView;
