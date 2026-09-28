import { Trash2 } from 'lucide-react';
import { Button, Modal } from '../../ui';

export type ClearScope = 'week' | 'day' | 'all';

type ClearPlannedModalProps = {
  isOpen: boolean;
  isClearing: boolean;
  counts: { week: number; day: number; all: number };
  isRTL: boolean;
  t: (key: any) => string;
  formatDate: (date: Date | string | number, pattern: string) => string;
  rangeLabel: string;
  day: Date;
  dayLabel: string;
  onClear: (scope: ClearScope) => void;
  onClose: () => void;
};

export function ClearPlannedModal({
  isOpen,
  isClearing,
  counts,
  isRTL,
  t,
  formatDate,
  rangeLabel,
  day,
  dayLabel,
  onClear,
  onClose
}: ClearPlannedModalProps) {
  const options: { scope: ClearScope; title: string; meta: string; count: number; tone: string }[] = [
    {
      scope: 'week',
      title: isRTL ? 'مسح تمارين هذا الأسبوع فقط' : 'Clear this week only',
      meta: rangeLabel,
      count: counts.week,
      tone: 'neutral'
    },
    {
      scope: 'day',
      title: isRTL ? `مسح تمارين يوم ${dayLabel}` : `Clear ${dayLabel} only`,
      meta: formatDate(day, 'dd MMMM yyyy'),
      count: counts.day,
      tone: 'warn'
    },
    {
      scope: 'all',
      title: isRTL ? 'مسح جميع التمارين المجدولة' : 'Clear all planned workouts',
      meta: isRTL ? 'حذف كافة التمارين المستقبلية والمجدولة' : 'Delete every upcoming & planned workout',
      count: counts.all,
      tone: 'danger'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="calendar-clear-title">
          <span className="calendar-clear-icon" aria-hidden="true">
            <Trash2 width={18} height={18} />
          </span>
          <span>
            {isRTL ? 'مسح التمارين المجدولة' : 'Clear planned workouts'}
            <small>{isRTL ? 'إفراغ التقويم من الجلسات غير المكتملة' : 'Empty the calendar of incomplete sessions'}</small>
          </span>
        </span>
      }
    >
      <div className="calendar-clear-body">
        <p>
          {isRTL
            ? 'اختر النطاق الذي ترغب في حذفه. لن يتم مسح أي تمرين تم إنجازه مسبقاً في السجل.'
            : 'Choose a scope. Completed workouts in your history are never touched.'}
        </p>
        <ul className="calendar-clear-options">
          {options.map(option => (
            <li key={option.scope}>
              <button
                type="button"
                className="calendar-clear-option"
                data-tone={option.tone}
                disabled={isClearing || option.count === 0}
                onClick={() => onClear(option.scope)}
              >
                <span>
                  <span className="calendar-clear-option-title">{option.title}</span>
                  <span className="calendar-clear-option-meta">{option.meta}</span>
                </span>
                <span className="calendar-clear-option-count tabular-nums">
                  {option.count} {isRTL ? 'تمارين' : 'workouts'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="calendar-clear-footer">
          <span>{isRTL ? 'سجل التمارين المكتملة آمن' : 'Completed history is protected'}</span>
          <Button variant="ghost" onClick={onClose} disabled={isClearing}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
