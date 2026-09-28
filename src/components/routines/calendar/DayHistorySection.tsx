import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Clock, Dumbbell, Flame, RotateCcw, Trophy } from 'lucide-react';
import type { HistoryRecord, SessionExercise, WorkoutSession } from '../../../lib/api';
import { estimateWorkoutCalories } from '../../../lib/api';
import { formatTonnage, targetMusclesText, totalTonnage } from './calendarData';

type DayHistorySectionProps = {
  records: HistoryRecord[];
  isRTL: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onRepeat: (snapshot: WorkoutSession) => void;
  showEmptyDetail: boolean;
};

const SET_BADGE: Record<string, string> = { warmup: 'W', dropset: 'D', failure: 'F' };

export function DayHistorySection({
  records,
  isRTL,
  t,
  tTitle,
  tExercise,
  tMuscle,
  formatDate,
  onRepeat,
  showEmptyDetail
}: DayHistorySectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (records.length === 0) {
    if (!showEmptyDetail) return null;
    return (
      <div className="calendar-empty-card">
        <span className="calendar-empty-icon is-success" aria-hidden="true">
          <Trophy width={24} height={24} />
        </span>
        <p className="calendar-empty-title">{t('noWorkoutsCompletedThisDay')}</p>
        <p className="calendar-empty-body">
          {isRTL
            ? 'عند إنهائك لأي تمرين في هذا اليوم، ستظهر تفاصيل الجولات والأوزان والسعرات المحروقة هنا.'
            : 'Complete a workout on this day and its sets, weights, and burned calories appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="calendar-history-cards-grid">
      {records.map(record => {
        const workout = record.snapshot;
        const exercises = workout?.exercises || [];
        const isExpanded = Boolean(expanded[record.id]);
        const totalSets = exercises.reduce((sum: number, exercise: SessionExercise) => sum + (exercise.sets?.length || 0), 0);
        const muscles = targetMusclesText(exercises);
        const burned = record.burnedCalories || (workout ? estimateWorkoutCalories(workout) : 0);
        const duration = workout?.duration || 45;
        const tonnage = exercises.reduce((sum, exercise) => sum + totalTonnage(exercise.sets), 0);

        return (
          <article key={record.id} className="history-workout-card">
            <div className="history-card-header">
              <div className="history-card-title-meta">
                <span className="history-card-icon-box" aria-hidden="true">
                  <Trophy width={18} height={18} />
                </span>
                <div>
                  <h4 className="history-card-title">{tTitle(record.title)}</h4>
                  <div className="history-card-subtitle">
                    <span>{formatDate(new Date(record.date), 'h:mm a')}</span>
                    <span aria-hidden="true">•</span>
                    <span className="history-card-subtitle-badge">
                      <Check width={12} height={12} aria-hidden="true" />
                      {t('completed')}
                    </span>
                    {muscles && <span>{tMuscle(muscles)}</span>}
                  </div>
                </div>
              </div>
              {workout && (
                <button
                  type="button"
                  className="history-repeat-btn"
                  onClick={() => onRepeat(workout)}
                  aria-label={`${t('repeatWorkoutOnCalendar')} — ${record.title}`}
                >
                  <RotateCcw width={14} height={14} aria-hidden="true" />
                  <span className="history-repeat-label">{t('repeatWorkoutOnCalendar')}</span>
                </button>
              )}
            </div>

            <dl className="history-card-telemetry-grid">
              <div className="history-telemetry-stat">
                <dt>
                  <Flame width={13} height={13} aria-hidden="true" />
                  {isRTL ? 'الحرق' : 'Burned'}
                </dt>
                <dd className="tabular-nums">
                  {burned} <small>kcal</small>
                </dd>
              </div>
              <div className="history-telemetry-stat">
                <dt>
                  <Clock width={13} height={13} aria-hidden="true" />
                  {isRTL ? 'المدة' : 'Duration'}
                </dt>
                <dd className="tabular-nums">
                  {duration} <small>{t('min')}</small>
                </dd>
              </div>
              <div className="history-telemetry-stat">
                <dt>
                  <Dumbbell width={13} height={13} aria-hidden="true" />
                  {isRTL ? 'الحجم' : 'Volume'}
                </dt>
                <dd className="tabular-nums">{tonnage > 0 ? formatTonnage(tonnage) : `${totalSets} ${t('sets')}`}</dd>
              </div>
              <div className="history-telemetry-stat">
                <dt>
                  <Trophy width={13} height={13} aria-hidden="true" />
                  {isRTL ? 'التمارين' : 'Exercises'}
                </dt>
                <dd className="tabular-nums">{exercises.length}</dd>
              </div>
            </dl>

            {exercises.length > 0 && (
              <ul className="history-card-pills-row">
                {exercises.slice(0, 4).map((exercise: SessionExercise, index: number) => (
                  <li key={exercise.id || index} className="history-exercise-chip">
                    <span className="chip-name">{tExercise(exercise.name)}</span>
                    <span className="chip-sets tabular-nums">{exercise.sets?.length || 3}s</span>
                  </li>
                ))}
                {exercises.length > 4 && (
                  <li className="history-exercise-overflow">
                    +{exercises.length - 4} {isRTL ? 'أخرى' : 'more'}
                  </li>
                )}
              </ul>
            )}

            <div className="history-card-footer">
              <span className="tabular-nums">
                {exercises.length} {t('exercises')} • {totalSets} {t('sets')}
              </span>
              <button
                type="button"
                className="history-toggle-breakdown-btn"
                onClick={() => setExpanded(prev => ({ ...prev, [record.id]: !prev[record.id] }))}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? t('hideExerciseBreakdown') : t('showExerciseBreakdown')}</span>
                <ChevronDown
                  width={15}
                  height={15}
                  aria-hidden="true"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }}
                />
              </button>
            </div>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="history-card-expanded-deck"
              >
                {exercises.length === 0 ? (
                  <p className="history-expanded-empty">{t('noExercises')}</p>
                ) : (
                  exercises.map((exercise: SessionExercise, exIndex: number) => (
                    <section key={exercise.id || exIndex} className="history-expanded-exercise-box">
                      <header className="exercise-box-header">
                        <div className="exercise-box-title-col">
                          <span className="exercise-box-name">{tExercise(exercise.name)}</span>
                          {exercise.targetMuscle && (
                            <span className="exercise-box-muscle">
                              <Dumbbell width={11} height={11} aria-hidden="true" />
                              {tMuscle(exercise.targetMuscle)}
                            </span>
                          )}
                        </div>
                        <div className="exercise-box-metrics tabular-nums">
                          <span>
                            {(exercise.sets || []).filter(set => set.isCompleted !== false).length}/
                            {exercise.sets?.length || 0} {t('sets')}
                          </span>
                          {totalTonnage(exercise.sets) > 0 && <span>{formatTonnage(totalTonnage(exercise.sets))}</span>}
                        </div>
                      </header>
                      <ul className="exercise-sets-log-table">
                        {(exercise.sets || []).map((set, setIndex: number) => {
                          const weight = set.weight ?? 0;
                          const reps = set.repsActual ?? set.repsTarget ?? 0;
                          const completed = set.isCompleted !== false;
                          return (
                            <li
                              key={set.id || setIndex}
                              className={`set-log-row ${completed ? 'completed' : 'pending'}`}
                            >
                              <span className="set-num-pill tabular-nums">
                                {SET_BADGE[set.type || 'normal'] || setIndex + 1}
                              </span>
                              <span className="set-log-col-weight tabular-nums">
                                {weight} {set.unit || 'kg'}
                              </span>
                              <span className="set-log-col-times" aria-hidden="true">
                                ×
                              </span>
                              <span className="set-log-col-reps tabular-nums">{reps}</span>
                              <span className="status-pill done">
                                {completed ? <Check width={11} height={11} aria-hidden="true" /> : '—'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                )}
              </motion.div>
            )}
          </article>
        );
      })}
    </div>
  );
}
