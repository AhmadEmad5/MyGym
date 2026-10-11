import { isSameDay } from 'date-fns';
import { motion, PanInfo } from 'framer-motion';
import { isRestDay, type RestDaySource } from '../../../lib/restDay';
import type { DayLoad } from './MonthGrid';

type WeekRibbonProps = {
  days: Date[];
  selectedDay: Date;
  today: Date;
  isRTL: boolean;
  restDaySettings?: RestDaySource;
  loadFor: (day: Date) => DayLoad;
  formatDate: (date: Date | string | number, pattern: string) => string;
  onSelectDay: (day: Date) => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
};

export function WeekRibbon({
  days,
  selectedDay,
  today,
  isRTL,
  restDaySettings,
  loadFor,
  formatDate,
  onSelectDay,
  onPrevWeek,
  onNextWeek
}: WeekRibbonProps) {
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 45;
    if (info.offset.x > threshold) {
      // Swiped towards right
      if (isRTL) {
        onNextWeek?.();
      } else {
        onPrevWeek?.();
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
    } else if (info.offset.x < -threshold) {
      // Swiped towards left
      if (isRTL) {
        onPrevWeek?.();
      } else {
        onNextWeek?.();
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
    }
  };

  return (
    <div className="calendar-week-ribbon-wrap" style={{ position: 'relative', touchAction: 'pan-y' }}>
      <motion.div
        drag={onPrevWeek || onNextWeek ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ width: '100%', cursor: 'grab' }}
        whileTap={{ cursor: 'grabbing' }}
      >
        <ul className="calendar-week-ribbon" role="list" aria-label={isRTL ? 'أيام الأسبوع (اسحب لتبديل الأسبوع)' : 'Days of the week (swipe to change week)'}>
          {days.map(day => {
            const load = loadFor(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            const rest = isRestDay(day, restDaySettings);
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
                  className={`ribbon-day-pill${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
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
      </motion.div>
    </div>
  );
}
