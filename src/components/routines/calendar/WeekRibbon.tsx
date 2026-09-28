import { isSameDay } from 'date-fns';
import type { DayLoad } from './MonthGrid';

type WeekRibbonProps = {
  days: Date[];
  selectedDay: Date;
  today: Date;
  isRTL: boolean;
  loadFor: (day: Date) => DayLoad;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onSelectDay: (day: Date) => void;
};

export function WeekRibbon({
  days,
  selectedDay,
  today,
  isRTL,
  loadFor,
  formatDate,
  onSelectDay
}: WeekRibbonProps) {
  return (
    <div className="calendar-week-ribbon-wrap">
      <ul className="calendar-week-ribbon" role="list" aria-label={isRTL ? 'أيام الأسبوع' : 'Days of the week'}>
        {days.map(day => {
          const load = loadFor(day);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const rest = day.getDay() === 5;
          const label = [
            formatDate(day, 'EEEE, d MMMM'),
            isToday ? (isRTL ? 'اليوم' : 'Today') : '',
            load.planned ? `${load.planned} ${isRTL ? 'مجدول' : 'planned'}` : '',
            load.completed ? `${load.completed} ${isRTL ? 'مكتمل' : 'completed'}` : '',
            rest ? (isRTL ? 'يوم راحة' : 'Rest day') : ''
          ]
            .filter(Boolean)
            .join(' — ');

          return (
            <li key={day.toISOString()} className="calendar-week-ribbon-item">
              <button
                type="button"
                className="ribbon-day-pill"
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={label}
                onClick={() => onSelectDay(day)}
              >
                <span className="ribbon-day-name">{formatDate(day, 'EEE')}</span>
                <span className="ribbon-day-number tabular-nums">{formatDate(day, 'd')}</span>
                <span className="ribbon-day-status" aria-hidden="true">
                  {load.completed > 0 && <i className="ribbon-dot completed">{load.completed}</i>}
                  {load.planned > 0 && <i className="ribbon-dot planned">{load.planned}</i>}
                  {load.completed === 0 && load.planned === 0 && rest && <i className="ribbon-dot rest">✿</i>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
