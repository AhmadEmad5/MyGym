import { useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar as CalendarIcon, CheckCircle2, Clock3, Dumbbell, Play, Sparkles } from 'lucide-react';
import { useData } from '../hooks/useData';
import { estimateWorkoutCalories } from '../lib/api';
import { useTranslation } from '../lib/i18n';

const spring = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.8 };

export function TodayView() {
  const { data, saveHistory, saveSessions } = useData();
  const { t, formatDate, tTitle, tExercise } = useTranslation();
  const navigate = useNavigate();
  if (!data) return null;

  const today = new Date();
  const todaySessions = data.sessions.filter(s => isSameDay(new Date(s.date), today));
  const isDayCompleted = data.history.some(h => isSameDay(new Date(h.date), today));
  const completedSessions = todaySessions.filter(s => s.isCompleted).length;
  const totalMinutes = todaySessions.reduce((total, session) => total + (session.duration || 0), 0);

  const completeDayWorkout = async () => {
    if (todaySessions.length === 0 || isDayCompleted) return;
    const allExercises = todaySessions.flatMap(s => s.exercises || []);
    const combinedTitle = todaySessions.map(s => s.title).join(' + ') || 'Daily Workout';
    const snapshotSession = { id: `day-${Date.now()}`, title: combinedTitle, date: new Date().toISOString(), duration: totalMinutes, type: 'Mixed', notes: 'Consolidated daily workout', isCompleted: true, exercises: allExercises };
    const burnedCalories = estimateWorkoutCalories(snapshotSession);
    await saveHistory({ id: Date.now().toString(), sessionId: `day-${format(today, 'yyyy-MM-dd')}`, date: new Date().toISOString(), title: combinedTitle, snapshot: snapshotSession, burnedCalories });
    
    const uncompleted = todaySessions.filter(s => !s.isCompleted);
    if (uncompleted.length > 0) {
      await saveSessions(uncompleted.map(session => ({ ...session, isCompleted: true })));
    }
  };

  const percentage = todaySessions.length ? Math.round((completedSessions / todaySessions.length) * 100) : 0;
  return (
    <motion.div className="today-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
      <header className="today-hero">
        <div>
          <motion.div className="eyebrow" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}><span className="eyebrow-dot" /> {formatDate(today, 'EEEE · MMMM d')}</motion.div>
          <h1>{t('todayHeroHeadline')}</h1>
          <p>{t('todayHeroSubtitle')}</p>
        </div>
        <motion.button className="hero-action" whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.96 }} transition={spring} onClick={() => navigate('/calendar')}><CalendarIcon size={18} /> {t('planSession')} <ArrowUpRight size={16} /></motion.button>
      </header>

      <motion.section className="progress-panel" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, ...spring }}>
        <div className="progress-ring" style={{ '--progress': `${isDayCompleted ? 100 : percentage}%` } as React.CSSProperties}><div><strong>{isDayCompleted ? 100 : todaySessions.length ? percentage : '—'}%</strong><span>{t('completed')}</span></div></div>
        <div className="progress-copy"><span className="section-label">{t('dailyProgress')}</span><h2>{isDayCompleted ? t('youShowedUp') : todaySessions.length ? t('nextRepWaiting') : t('dayForRecovery')}</h2><p>{todaySessions.length ? `${completedSessions} of ${todaySessions.length} ${t('sessionsFinished')} · ${totalMinutes} ${t('min')} ${t('planned')}` : t('useCalendarDesign')}</p></div>
        <div className="progress-stats"><div><Clock3 size={16} /><strong>{totalMinutes}</strong><span>{t('minutes')}</span></div><div><Dumbbell size={16} /><strong>{todaySessions.length}</strong><span>{t('sessions')}</span></div></div>
      </motion.section>

      <section className="workout-section">
        <div className="section-heading"><div><span className="section-label">{t('trainingQueue')}</span><h2>{t('todaySessions')}</h2></div>{todaySessions.length > 0 && <span className="session-count">{todaySessions.length.toString().padStart(2, '0')} {t('planned')}</span>}</div>
        {todaySessions.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}><div className="empty-icon"><Sparkles size={27} /></div><h3>{t('spaceToRecharge')}</h3><p>{t('noTrainingScheduled')}</p><motion.button className="btn btn-primary" whileTap={{ scale: 0.95 }} onClick={() => navigate('/calendar')}>{t('openCalendar')} <ArrowUpRight size={16} /></motion.button></motion.div>
          : isDayCompleted ? <motion.div className="empty-state completion-state" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={spring}><div className="empty-icon"><CheckCircle2 size={28} /></div><h3>{t('trainingCompleteTitle')}</h3><p>{t('trainingCompleteDesc')}</p><motion.button className="btn btn-secondary" whileTap={{ scale: 0.95 }} onClick={() => navigate('/history')}>{t('viewHistory')} <ArrowUpRight size={16} /></motion.button></motion.div>
          : <div className="session-grid">{todaySessions.map((session, index) => {
            const sessionDate = new Date(session.date);
            const timeLabel = isNaN(sessionDate.getTime()) ? '' : formatDate(sessionDate, 'h:mm a');
            return (
              <motion.article key={session.id} layoutId={`session-${session.id}`} className={`workout-card ${session.isCompleted ? 'is-completed' : ''}`} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + index * 0.075, ...spring }} whileHover={{ y: -6 }}>
                <div className="card-glow" /><div className="card-topline"><span className="session-number">{String(index + 1).padStart(2, '0')}</span><span className="type-pill">{session.type}</span></div><h3>{tTitle(session.title)}</h3>
                <div className="session-meta">{timeLabel && <span><Clock3 size={14} /> {timeLabel}</span>}<span>{session.duration} {t('min')}</span></div>
                <div className="exercise-list">{(session.exercises || []).slice(0, 3).map((exercise, exerciseIndex) => <div key={exercise.id}><span>{String(exerciseIndex + 1).padStart(2, '0')}</span><strong>{tExercise(exercise.name)}</strong><small>{exercise.sets?.length || 0} {t('sets')}</small></div>)}{session.exercises?.length > 3 && <p>+{session.exercises.length - 3} {t('moreMovements')}</p>}{!session.exercises?.length && <p>{t('workoutReadyCustomize')}</p>}</div>
                <motion.button className={`session-cta ${session.isCompleted ? 'done' : ''}`} whileTap={{ scale: 0.96 }} transition={spring} onClick={() => navigate(`/session/${session.id}`)}>{session.isCompleted ? <><CheckCircle2 size={17} /> {t('completed')}</> : <><Play size={16} fill="currentColor" /> {t('startWorkout')}</>} <ArrowUpRight size={15} /></motion.button>
              </motion.article>
            );
          })}</div>}
      </section>
      {todaySessions.length > 0 && !isDayCompleted && <motion.button className="complete-day" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, ...spring }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.975 }} onClick={completeDayWorkout}><CheckCircle2 size={19} /> {t('markTodayComplete')} <span>{t('saveProgress')}</span></motion.button>}
    </motion.div>
  );
}
