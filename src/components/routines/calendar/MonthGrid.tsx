import { eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import type { Day } from 'date-fns';

export type DayLoad = {
  planned: number;
  completed: number;
  meals: number;
};

export type MonthGridProps = {
  monthAnchor: Date;
  weekStartsOn: Day;
  selectedDay: Date;
  today: Date;
  isRTL: boolean;
  loadFor: (day: Date) => DayLoad;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onSelectDay: (day: Date) => void;
};

const DAY_HEADINGS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ARABIC_DAY_HEADINGS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export function densityLevel(load: DayLoad) {
  const total = load.planned + load.completed;
  if (total === 0) return 0;
  if (total === 1) return 1;
  if (total === 2) return 2;
  return 3;
}

export function MonthGrid({
  monthAnchor,
  weekStartsOn,
  selectedDay,
  today,
  isRTL,
  loadFor,
  formatDate,
  onSelectDay
}: MonthGridProps) {
  const monthStart = startOfMonth(monthAnchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
  const headings = isRTL ? ARABIC_DAY_HEADINGS : DAY_HEADINGS;

  return (
    <div className="calendar-month-shell">
      <div className="calendar-month-headings" aria-hidden="true">
        {headings.map((heading, index) => (
          <span key={`${heading}-${index}`} className="calendar-month-heading">
            {heading}
          </span>
        ))}
      </div>
      <div className="calendar-month-grid" role="grid" aria-label={formatDate(monthAnchor, 'MMMM yyyy')}>
        {weeks.map((week, weekIndex) => (
          <div className="calendar-month-row" role="row" key={`week-${weekIndex}`}>
            {week.map(day => (
              <MonthCell
                key={day.toISOString()}
                day={day}
                inMonth={isSameMonth(day, monthStart)}
                isToday={isSameDay(day, today)}
                isSelected={isSameDay(day, selectedDay)}
                load={loadFor(day)}
                isRTL={isRTL}
                formatDate={formatDate}
                onSelectDay={onSelectDay}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type MonthCellProps = {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  load: DayLoad;
  isRTL: boolean;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onSelectDay: (day: Date) => void;
};

function MonthCell({
  day,
  inMonth,
  isToday,
  isSelected,
  load,
  isRTL,
  formatDate,
  onSelectDay
}: MonthCellProps) {
  const level = densityLevel(load);
  const label = [
    formatDate(day, 'EEEE, d MMMM yyyy'),
    isToday ? (isRTL ? 'اليوم' : 'today') : '',
    load.planned ? `${load.planned} ${isRTL ? 'مجدول' : 'planned'}` : '',
    load.completed ? `${load.completed} ${isRTL ? 'مكتمل' : 'completed'}` : '',
    load.meals ? `${load.meals} ${isRTL ? 'وجبات' : 'meals'}` : ''
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <button
      type="button"
      role="gridcell"
      className="calendar-month-cell"
      data-level={level}
      data-today={isToday ? 'true' : 'false'}
      data-outside={inMonth ? 'false' : 'true'}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected}
      aria-label={label}
      onClick={() => onSelectDay(day)}
    >
      <span className="calendar-month-cell-number tabular-nums">{formatDate(day, 'd')}</span>
      {isToday && <span className="calendar-month-cell-today">{isRTL ? 'اليوم' : 'Today'}</span>}
      <span className="calendar-month-cell-density" aria-hidden="true">
        <i data-level={level} />
      </span>
      <span className="calendar-month-cell-counts tabular-nums" aria-hidden="true">
        {load.planned > 0 && <em data-kind="planned">{load.planned}</em>}
        {load.completed > 0 && <em data-kind="completed">{load.completed}</em>}
      </span>
    </button>
  );
}
