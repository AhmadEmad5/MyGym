import { CalendarDays, Dumbbell, Layers } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { NAV_ROUTE_PATHS } from '../../app/routes';
import { MobileActionSheet } from './MobileActionSheet';

interface StartWorkoutSheetProps {
  open: boolean;
  isOffDay: boolean;
  onClose: () => void;
  onOpenQuickWorkout: () => void;
  onNavigate: (to: string) => void;
}

export function StartWorkoutSheet({
  open,
  isOffDay,
  onClose,
  onOpenQuickWorkout,
  onNavigate,
}: StartWorkoutSheetProps) {
  const { isRTL } = useTranslation();

  const title = isOffDay
    ? isRTL
      ? 'عطلة أسبوعية'
      : 'Weekly off-day'
    : isRTL
      ? 'بدء التسجيل'
      : 'Start logging';

  const description = isOffDay
    ? isRTL
      ? 'الجيم مغلق اليوم الجمعة. يمكنك استكشاف الروتينات أو مراجعة خطة الأسبوع.'
      : 'The gym is closed today (Friday). Explore routines or review your training week.'
    : isRTL
      ? 'ابدأ جلسة سريعة أو اختر روتيناً محفوظاً.'
      : 'Start a quick workout or choose a saved routine.';

  return (
    <MobileActionSheet open={open} title={title} onClose={onClose}>
      <div className="mobile-log-actions">
        <p>{description}</p>
        {!isOffDay && (
          <button
            type="button"
            className="forma-primary-button"
            onClick={onOpenQuickWorkout}
          >
            <Dumbbell width={17} height={17} aria-hidden="true" />
            <span>{isRTL ? 'تمرين سريع' : 'Quick workout'}</span>
          </button>
        )}
        <button
          type="button"
          className="forma-quiet-button"
          onClick={() => onNavigate(NAV_ROUTE_PATHS.routines)}
        >
          <Layers width={17} height={17} aria-hidden="true" />
          <span>{isRTL ? 'استكشاف الروتينات' : 'Browse routines'}</span>
        </button>
        <button
          type="button"
          className="forma-quiet-button"
          onClick={() => onNavigate(NAV_ROUTE_PATHS.plan)}
        >
          <CalendarDays width={17} height={17} aria-hidden="true" />
          <span>{isRTL ? 'عرض الخطة الأسبوعية' : 'View weekly plan'}</span>
        </button>
      </div>
    </MobileActionSheet>
  );
}
