import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Clock, Dumbbell, Moon, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../../lib/api';
import { sessionAccent, targetMusclesText } from './calendarData';

type DayPlannedSectionProps = {
  day: Date;
  sessions: WorkoutSession[];
  isRestDay: boolean;
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onOpenSession: (id: string) => void;
  onComplete: (session: WorkoutSession) => void;
  onDelete: (id: string) => void;
  onAddSession: (day: Date) => void;
  onGeneratePPL: () => void;
  onOpenAI: () => void;
  onMoveToSaturday: () => void;
  showEmptyDetail: boolean;
};

export function DayPlannedSection({
  day,
  sessions,
  isRestDay,
  isRTL,
  t,
  tTitle,
  tMuscle,
  formatDate,
  onOpenSession,
  onComplete,
  onDelete,
  onAddSession,
  onGeneratePPL,
  onOpenAI,
  onMoveToSaturday,
  showEmptyDetail
}: DayPlannedSectionProps) {
  if (isRestDay && sessions.length === 0) {
    return (
      <div className="calendar-gym-closed-card">
        <span className="calendar-gym-closed-icon" aria-hidden="true">
          <Moon width={26} height={26} />
        </span>
        <span className="calendar-gym-closed-tag">{isRTL ? '🔒 الجيم مغلق' : '🔒 Gym Closed'}</span>
        <h3>{t('gymClosedTitle')}</h3>
        <p>{t('gymClosedDesc')}</p>
        <button type="button" className="btn btn-primary" onClick={() => onAddSession(nextDay(day))}>
          <Plus width={16} height={16} aria-hidden="true" />
          <span>{isRTL ? 'جدولة تمرين للغد (السبت)' : 'Schedule for Tomorrow (Saturday)'}</span>
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    if (!showEmptyDetail) {
      return (
        <div className="calendar-inline-empty">
          <Dumbbell width={16} height={16} aria-hidden="true" />
          <span>{isRTL ? 'لا توجد جلسات مجدولة مسبقاً لهذا اليوم' : 'No scheduled sessions planned for this day'}</span>
          <button type="button" className="btn btn-secondary" onClick={() => onAddSession(day)}>
            <Plus width={14} height={14} aria-hidden="true" />
            {t('addSession')}
          </button>
        </div>
      );
    }
    return (
      <div className="calendar-empty-card">
        <span className="calendar-empty-icon" aria-hidden="true">
          <Dumbbell width={24} height={24} />
        </span>
        <h3>
          {isRTL
            ? `لا توجد تمارين مجدولة ليوم ${formatDate(day, 'EEEE')}`
            : `No workouts scheduled for ${formatDate(day, 'EEEE')}`}
        </h3>
        <p>
          {isRTL
            ? 'اختر إضافة تمرين لهذا اليوم أو استخدم التوليد الذكي لإنشاء جدول تدريبي متكامل.'
            : 'Schedule a workout for this day or use the AI generator to draft a full plan.'}
        </p>
        <div className="calendar-empty-actions">
          <button type="button" className="btn btn-primary" onClick={() => onAddSession(day)}>
            <Plus width={15} height={15} aria-hidden="true" />
            {t('addSession')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenAI}>
            <Sparkles width={15} height={15} aria-hidden="true" />
            {t('aiGenerator')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onGeneratePPL}>
            {t('generatePPLRoutine')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-day-cards-grid">
      {isRestDay && (
        <div className="calendar-friday-warning">
          <div>
            <p className="calendar-friday-warning-title">
              {isRTL ? 'الجمعة عطلة أسبوعية — الجيم مغلق' : 'Friday off-day — the gym is closed'}
            </p>
            <p className="calendar-friday-warning-body">
              {isRTL
                ? 'توجد جلسات مجدولة في يوم عطلة الجيم. يُنصح بنقلها إلى السبت.'
                : 'You have sessions scheduled on a closed day. Moving them to Saturday keeps the week clean.'}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={onMoveToSaturday}>
            {isRTL ? 'نقل جميع الجلسات للسبت' : 'Move all to Saturday'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {sessions.map(session => {
          const accent = sessionAccent(session.type, session.title);
          const muscles = targetMusclesText(session.exercises);
          return (
            <motion.article
              layout
              key={session.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="calendar-workout-card"
              style={{ borderInlineStart: `4px solid ${accent}` }}
            >
              <div className="card-top-row">
                <div className="card-title-meta">
                  <span className="card-dot" style={{ backgroundColor: accent }} aria-hidden="true" />
                  <div>
                    <h3 className="card-title">{tTitle(session.title)}</h3>
                    <span className="card-time-pill">
                      <Clock width={12} height={12} aria-hidden="true" />
                      {formatDate(new Date(session.date), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn-card-action complete-action"
                    onClick={() => onComplete(session)}
                    aria-label={`${t('workoutCompleted')} — ${session.title}`}
                  >
                    <Check width={15} height={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn-card-action delete-action"
                    onClick={() => onDelete(session.id)}
                    aria-label={`${t('deleteSession')} — ${session.title}`}
                  >
                    <Trash2 width={15} height={15} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="card-muscles-row">
                <Dumbbell width={14} height={14} style={{ color: accent }} aria-hidden="true" />
                <span>
                  {muscles ? tMuscle(muscles) : session.exercises?.length ? t('multipleMuscles') : t('noExercises')}
                </span>
              </div>

              {Boolean(session.exercises?.length) && (
                <ul className="card-exercises-preview-list">
                  {session.exercises!.slice(0, 4).map((exercise, index) => (
                    <li key={exercise.id || index} className="card-exercise-pill-item">
                      <span className="pill-dot" style={{ backgroundColor: accent }} aria-hidden="true" />
                      <span className="pill-name">{exercise.name}</span>
                      <span className="pill-sets tabular-nums">
                        {exercise.sets?.length || 3} {t('sets')}
                      </span>
                    </li>
                  ))}
                  {session.exercises!.length > 4 && (
                    <li className="card-exercises-overflow">
                      +{session.exercises!.length - 4} {isRTL ? 'تمارين أخرى' : 'more exercises'}
                    </li>
                  )}
                </ul>
              )}

              <div className="card-footer-cta">
                <div className="card-stats">
                  <span className="card-stat-item tabular-nums">
                    <Clock width={13} height={13} aria-hidden="true" />
                    {session.duration} {t('min')}
                  </span>
                  <span className="card-stat-item tabular-nums">
                    <Dumbbell width={13} height={13} aria-hidden="true" />
                    {session.exercises?.length || 0} {t('exercises')}
                  </span>
                </div>
                <button
                  type="button"
                  className="card-go-btn"
                  style={{ color: accent }}
                  onClick={() => onOpenSession(session.id)}
                >
                  <span>{isRTL ? 'عرض التمرين' : 'Start'}</span>
                  <ChevronRight
                    width={15}
                    height={15}
                    aria-hidden="true"
                    style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
                  />
                </button>
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>

      <button type="button" className="calendar-add-workout-card" onClick={() => onAddSession(day)}>
        <span className="add-workout-circle" aria-hidden="true">
          <Plus width={22} height={22} />
        </span>
        <span className="add-workout-label">{t('addSession')}</span>
        <span className="add-workout-day">{formatDate(day, 'EEEE')}</span>
      </button>
    </div>
  );
}

function nextDay(day: Date) {
  const value = new Date(day);
  value.setDate(value.getDate() + 1);
  return value;
}
