import { motion } from 'framer-motion';
import { Check, Clock, Dumbbell, Plus, Trash2 } from 'lucide-react';
import type { WorkoutSession } from '../../../lib/api';
import { sessionAccent, targetMusclesText } from './calendarData';

type PlanListViewProps = {
  isRTL: boolean;
  today: Date;
  groups: { day: Date; sessions: WorkoutSession[] }[];
  formatDate: (date: Date | string | number, pattern: string) => string;
  tTitle: (name: string) => string;
  tMuscle: (muscle: string) => string;
  t: (key: any) => string;
  onOpenSession: (id: string) => void;
  onComplete: (session: WorkoutSession) => void;
  onDelete: (id: string) => void;
  onAddSession: (day: Date) => void;
};

export function PlanListView({
  isRTL,
  today,
  groups,
  formatDate,
  tTitle,
  tMuscle,
  t,
  onOpenSession,
  onComplete,
  onDelete,
  onAddSession
}: PlanListViewProps) {
  if (groups.length === 0) {
    return (
      <div className="calendar-list-empty">
        <p>{isRTL ? 'لا توجد جلسات في هذه الفترة.' : 'No sessions in this period yet.'}</p>
      </div>
    );
  }

  return (
    <ol className="calendar-plan-list">
      {groups.map(group => {
        const isToday = group.day.toDateString() === today.toDateString();
        const isPast = group.day < today && !isToday;
        const isRest = group.day.getDay() === 5;

        return (
          <li key={group.day.toISOString()} className="calendar-plan-group" data-today={isToday}>
            <div className="calendar-plan-group-head">
              <span className="calendar-plan-group-date tabular-nums">{formatDate(group.day, 'EEE dd')}</span>
              <span className="calendar-plan-group-name">{formatDate(group.day, 'EEEE')}</span>
              {isToday && <span className="calendar-plan-group-chip is-today">{isRTL ? 'اليوم' : 'Today'}</span>}
              {isRest && <span className="calendar-plan-group-chip is-rest">{isRTL ? 'راحة' : 'Rest'}</span>}
              {isPast && !isRest && (
                <span className="calendar-plan-group-chip is-missed">{t('missedWorkout')}</span>
              )}
              <button
                type="button"
                className="calendar-plan-group-add"
                onClick={() => onAddSession(group.day)}
                aria-label={`${t('addSession')} — ${formatDate(group.day, 'EEEE, d MMMM')}`}
              >
                <Plus width={14} height={14} aria-hidden="true" />
              </button>
            </div>

            {group.sessions.length === 0 ? (
              <p className="calendar-plan-group-empty">
                {isRTL ? 'لا توجد تمارات مجدولة.' : 'Nothing planned for this day.'}
              </p>
            ) : (
              <ul className="calendar-plan-rows">
                {group.sessions.map(session => {
                  const accent = sessionAccent(session.type, session.title);
                  const muscles = targetMusclesText(session.exercises);
                  return (
                    <li key={session.id}>
                      <motion.div
                        className="calendar-plan-row"
                        style={{ borderInlineStartColor: accent }}
                        whileTap={{ scale: 0.995 }}
                      >
                        <button
                          type="button"
                          className="calendar-plan-row-main"
                          onClick={() => onOpenSession(session.id)}
                        >
                          <span className="calendar-plan-row-time tabular-nums">
                            <Clock width={12} height={12} aria-hidden="true" />
                            {formatDate(new Date(session.date), 'h:mm a')}
                          </span>
                          <span className="calendar-plan-row-title">{tTitle(session.title)}</span>
                          <span className="calendar-plan-row-meta">
                            <span className="calendar-plan-row-muscles">
                              <Dumbbell width={12} height={12} aria-hidden="true" />
                              {muscles ? tMuscle(muscles) : t('multipleMuscles')}
                            </span>
                            <span className="tabular-nums">
                              {session.duration} {t('min')} · {session.exercises?.length || 0} {t('exercises')}
                            </span>
                          </span>
                        </button>
                        <div className="calendar-plan-row-actions">
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
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
