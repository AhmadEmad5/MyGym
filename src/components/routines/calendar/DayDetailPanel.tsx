import { motion } from 'framer-motion';
import { Check, Dumbbell, Flame, Plus, Sparkles, Trash2, Trophy, Utensils, Apple } from 'lucide-react';
import type { HistoryRecord, MealRecord, WorkoutSession } from '../../../lib/api';
import { DayHistorySection } from './DayHistorySection';
import type { DayNutritionSummary } from './DayNutritionSection';
import { DayNutritionSection } from './DayNutritionSection';
import { DayPlannedSection } from './DayPlannedSection';

export type DayTab = 'all' | 'planned' | 'workouts' | 'nutrition';

type DayDetailPanelProps = {
  day: Date;
  today: Date;
  tab: DayTab;
  sessions: WorkoutSession[];
  history: HistoryRecord[];
  meals: MealRecord[];
  nutrition: DayNutritionSummary;
  targets: { calories: number; protein: number; carbs: number; fats: number; water: number };
  isRTL: boolean;
  isClearing: boolean;
  t: (key: any) => string;
  tTitle: (name: string) => string;
  tExercise: (name: string) => string;
  tMuscle: (muscle: string) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onTabChange: (tab: DayTab) => void;
  onOpenSession: (id: string) => void;
  onComplete: (session: WorkoutSession) => void;
  onDelete: (id: string) => void;
  onAddSession: (day: Date) => void;
  onOpenAI: () => void;
  onGeneratePPL: () => void;
  onMoveToSaturday: () => void;
  onClearDay: () => void;
  onRepeatWorkout: (snapshot: WorkoutSession) => void;
  onLogMeal: () => void;
};

export function DayDetailPanel(props: DayDetailPanelProps) {
  const {
    day,
    today,
    tab,
    sessions,
    history,
    meals,
    nutrition,
    targets,
    isRTL,
    isClearing,
    t,
    tTitle,
    tExercise,
    tMuscle,
    formatDate,
    onTabChange,
    onOpenSession,
    onComplete,
    onDelete,
    onAddSession,
    onOpenAI,
    onGeneratePPL,
    onMoveToSaturday,
    onClearDay,
    onRepeatWorkout,
    onLogMeal
  } = props;

  const isToday = day.toDateString() === today.toDateString();
  const isRestDay = day.getDay() === 5;
  const isPast = !isToday && day < today;
  const dayCompleted = sessions.length === 0 && history.length > 0;
  const showPlanned = tab === 'all' || tab === 'planned';
  const showHistory = tab === 'all' || tab === 'workouts';
  const showNutrition = tab === 'all' || tab === 'nutrition';

  const tabs: { id: DayTab; label: string; count: number; icon: typeof Dumbbell }[] = [
    { id: 'all', label: t('dayOverviewTab'), count: 0, icon: Dumbbell },
    { id: 'planned', label: t('dayPlannedTab'), count: sessions.length, icon: Dumbbell },
    { id: 'workouts', label: t('dayWorkoutHistoryTab'), count: history.length, icon: Trophy },
    { id: 'nutrition', label: t('dayNutritionHistoryTab'), count: meals.length, icon: Utensils }
  ];

  return (
    <motion.section
      key={day.toISOString()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="calendar-selected-day-section"
      aria-label={formatDate(day, 'EEEE, dd MMMM yyyy')}
    >
      <div className="calendar-day-header-bar">
        <div className="calendar-day-identity">
          <span className="calendar-day-badge" data-today={isToday}>
            <span className="calendar-day-badge-month">{formatDate(day, 'MMM')}</span>
            <span className="calendar-day-badge-number tabular-nums">{formatDate(day, 'dd')}</span>
          </span>
          <div>
            <div className="calendar-day-title-row">
              <h2>{formatDate(day, 'EEEE')}</h2>
              {isToday && <span className="calendar-day-chip is-today">{t('today')}</span>}
              {isRestDay && <span className="calendar-day-chip is-rest">✿ {isRTL ? 'يوم راحة' : 'Rest Day'}</span>}
              {dayCompleted && (
                <span className="calendar-day-chip is-done">
                  <Check width={11} height={11} aria-hidden="true" />
                  {t('completed')}
                </span>
              )}
              {isPast && sessions.length === 0 && !dayCompleted && (
                <span className="calendar-day-chip is-missed">{t('missedWorkout')}</span>
              )}
            </div>
            <p className="calendar-day-subtitle">
              {formatDate(day, 'dd MMMM yyyy')}
              {sessions.length > 0 && ` • ${sessions.length} ${t('planned')}`}
              {history.length > 0 && ` • ${history.length} ${t('completed')}`}
              {meals.length > 0 && ` • ${meals.length} ${t('navNutrition')}`}
            </p>
          </div>
        </div>

        <div className="calendar-day-header-actions">
          {sessions.length > 0 && (
            <button
              type="button"
              className="calendar-action-btn is-danger"
              onClick={onClearDay}
              disabled={isClearing}
            >
              <Trash2 width={15} height={15} aria-hidden="true" />
              <span>{isRTL ? 'مسح تمارين اليوم' : 'Clear day'}</span>
            </button>
          )}
          <button
            type="button"
            className="calendar-action-btn is-primary"
            onClick={() => onAddSession(isRestDay ? addOneDay(day) : day)}
          >
            <Plus width={15} height={15} aria-hidden="true" />
            <span>{isRestDay ? (isRTL ? 'جدولة للسبت' : 'Schedule Saturday') : t('addSession')}</span>
          </button>
        </div>
      </div>

      <div className="calendar-day-tab-bar" role="tablist" aria-label={isRTL ? 'أقسام اليوم' : 'Day sections'}>
        {tabs.map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={`day-tab-pill ${active ? 'active' : ''}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(item.id)}
              onKeyDown={event => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const index = tabs.findIndex(entry => entry.id === item.id);
                const delta = event.key === 'ArrowRight' ? 1 : -1;
                const next = (index + delta + tabs.length) % tabs.length;
                onTabChange(tabs[next].id);
              }}
            >
              <Icon width={13} height={13} aria-hidden="true" />
              <span>{item.label}</span>
              {item.count > 0 && <span className="tab-count-badge tabular-nums">{item.count}</span>}
            </button>
          );
        })}
      </div>

      <div className="calendar-scope-bar">
        <span>
          <Apple width={13} height={13} aria-hidden="true" />
          {t('dayHistoryOnlyNotice')}: <strong>{formatDate(day, 'EEEE, dd MMMM yyyy')}</strong>
        </span>
        <span className="calendar-scope-energy">
          {nutrition.burned > 0 && (
            <span className="is-burned tabular-nums">
              <Flame width={12} height={12} aria-hidden="true" />
              {Math.round(nutrition.burned)} kcal
            </span>
          )}
          {nutrition.consumed > 0 && (
            <span className="is-consumed tabular-nums">
              <Sparkles width={12} height={12} aria-hidden="true" />
              {Math.round(nutrition.consumed)} kcal
            </span>
          )}
        </span>
      </div>

      {showPlanned && (
        <div className="calendar-day-section-block">
          {tab !== 'all' && (
            <div className="calendar-section-title-row">
              <h3 className="calendar-section-title">
                <Dumbbell width={17} height={17} aria-hidden="true" />
                {t('dayPlannedTab')}
                {sessions.length > 0 && <span className="tab-count-badge tabular-nums">{sessions.length}</span>}
              </h3>
            </div>
          )}
          <DayPlannedSection
            day={day}
            sessions={sessions}
            isRestDay={isRestDay}
            isRTL={isRTL}
            t={t}
            tTitle={tTitle}
            tMuscle={tMuscle}
            formatDate={formatDate}
            onOpenSession={onOpenSession}
            onComplete={onComplete}
            onDelete={onDelete}
            onAddSession={onAddSession}
            onGeneratePPL={onGeneratePPL}
            onOpenAI={onOpenAI}
            onMoveToSaturday={onMoveToSaturday}
            showEmptyDetail={tab === 'planned' || (history.length === 0 && meals.length === 0)}
          />
        </div>
      )}

      {showHistory && (
        <div className="calendar-day-section-block">
          <div className="calendar-section-title-row">
            <h3 className="calendar-section-title">
              <Trophy width={17} height={17} aria-hidden="true" />
              {t('dayWorkoutsCompletedHeading')}
              {history.length > 0 && <span className="tab-count-badge success tabular-nums">{history.length}</span>}
            </h3>
          </div>
          <DayHistorySection
            records={history}
            isRTL={isRTL}
            t={t}
            tTitle={tTitle}
            tExercise={tExercise}
            tMuscle={tMuscle}
            formatDate={formatDate}
            onRepeat={onRepeatWorkout}
            showEmptyDetail={tab === 'workouts'}
          />
        </div>
      )}

      {showNutrition && (
        <div className="calendar-day-section-block">
          <div className="calendar-section-title-row">
            <h3 className="calendar-section-title">
              <Utensils width={17} height={17} aria-hidden="true" />
              {t('dayNutritionHeading')}
              {meals.length > 0 && <span className="tab-count-badge cyan tabular-nums">{meals.length}</span>}
            </h3>
          </div>
          <DayNutritionSection
            meals={meals}
            summary={nutrition}
            targets={targets}
            isRTL={isRTL}
            t={t}
            formatDate={formatDate}
            onLogMeal={onLogMeal}
            showEmptyDetail={tab === 'nutrition'}
          />
        </div>
      )}
    </motion.section>
  );
}

function addOneDay(day: Date) {
  const value = new Date(day);
  value.setDate(value.getDate() + 1);
  return value;
}
