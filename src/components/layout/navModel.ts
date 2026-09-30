import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { isSameDay, startOfDay, subDays } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { useData } from '../../hooks/useData';
import type { WorkoutSession } from '../../lib/api';
import {
  NAV_DOCK_LAYOUT,
  NAV_DOCK_TRAIN_ID,
  NAV_OVERFLOW_ROUTE_IDS,
  ROUTE_META,
  ROUTE_META_BY_ID,
  type ShellRouteId,
} from '../../app/routeMeta';
// `routeMeta.routeIsActive` is a raw `pathname.startsWith(route.to)` with no
// segment-boundary check, so it reports `/plan` as active for `/planning`.
// `isRouteActive` is the tested, boundary-aware form (18 tests in
// `app/__tests__/navActive.test.ts`) and drives `aria-current="page"`.
import { isRouteActive } from '../../app/navActive';
import { SESSION_ROUTE_PREFIX } from '../../app/routes';

export const OFF_DAY = 5;
export const STREAK_LOOKBACK_DAYS = 30;

export interface BilingualCopy {
  en: string;
  ar: string;
}

interface RouteCopy {
  dockLabel: BilingualCopy;
  overflowDescription: BilingualCopy;
}

export const ROUTE_COPY: Record<ShellRouteId, RouteCopy> = {
  today: {
    dockLabel: { en: 'Today', ar: 'اليوم' },
    overflowDescription: { en: 'Log what today needs', ar: 'سجّل ما يحتاجه اليوم' },
  },
  plan: {
    dockLabel: { en: 'Plan', ar: 'الخطة' },
    overflowDescription: { en: 'Weekly split and training days', ar: 'خطة الأسبوع وأيام التدريب' },
  },
  routines: {
    dockLabel: { en: 'Train', ar: 'ابدأ' },
    overflowDescription: { en: 'Choose a training structure and schedule it', ar: 'اختر بنية تدريب وجدولها للأسبوع' },
  },
  nutrition: {
    dockLabel: { en: 'Meals', ar: 'التغذية' },
    overflowDescription: { en: 'Macros, hydration and meal vision', ar: 'السعرات والماء ومسح الوجبات' },
  },
  performance: {
    dockLabel: { en: 'Stats', ar: 'الأداء' },
    overflowDescription: { en: 'Strength records, volume & progression', ar: 'أرقام القوة والحجم والتقدّم' },
  },
  settings: {
    dockLabel: { en: 'Settings', ar: 'الضبط' },
    overflowDescription: { en: 'Audio, haptics, theme & backup', ar: 'الصوت والاهتزاز والمظهر والنسخ الاحتياطي' },
  },
};

export interface ShellNavItem {
  kind: 'link';
  id: ShellRouteId;
  to: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  description: string;
  isActive: boolean;
  badge?: number;
}

export interface ShellNavTrainAction {
  kind: 'action';
  id: typeof NAV_DOCK_TRAIN_ID;
  to: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  isActive: boolean;
}

export type ShellDockEntry = ShellNavItem | ShellNavTrainAction;

export interface ShellMetrics {
  activeTodaySession: WorkoutSession | null;
  pendingTodayCount: number;
  streakDays: number;
  isOffDay: boolean;
}

export interface ShellNavModel extends ShellMetrics {
  desktopItems: ShellNavItem[];
  dockEntries: ShellDockEntry[];
  dockTrainEntry: ShellNavTrainAction;
  overflowItems: ShellNavItem[];
  activeOverflowItem: ShellNavItem | null;
}

function isOffDayDate(date: Date) {
  return date.getDay() === OFF_DAY;
}

function useShellMetrics(): ShellMetrics {
  const { data } = useData();

  const activeTodaySession = useMemo(() => {
    const today = new Date();
    if (isOffDayDate(today)) return null;
    return (
      (data?.sessions ?? []).find(
        session => isSameDay(new Date(session.date), today) && !session.isCompleted,
      ) ?? null
    );
  }, [data?.sessions]);

  const pendingTodayCount = useMemo(() => {
    const today = new Date();
    if (isOffDayDate(today)) return 0;
    return (data?.sessions ?? []).filter(
      session => isSameDay(new Date(session.date), today) && !session.isCompleted,
    ).length;
  }, [data?.sessions]);

  const streakDays = useMemo(() => {
    const today = startOfDay(new Date());
    let count = 0;

    for (let offset = 0; offset < STREAK_LOOKBACK_DAYS; offset += 1) {
      const checkDate = subDays(today, offset);
      const trained =
        (data?.history ?? []).some(entry => isSameDay(new Date(entry.date), checkDate)) ||
        (data?.sessions ?? []).some(
          session => session.isCompleted && isSameDay(new Date(session.date), checkDate),
        );

      if (trained) {
        count += 1;
      } else if (offset !== 0) {
        break;
      }
    }

    return count;
  }, [data?.history, data?.sessions]);

  return {
    activeTodaySession,
    pendingTodayCount,
    streakDays,
    isOffDay: isOffDayDate(new Date()),
  };
}

export function useShellNavModel(): ShellNavModel {
  const { t, isRTL } = useTranslation();
  const { pathname } = useLocation();
  const metrics = useShellMetrics();
  const { pendingTodayCount } = metrics;

  const localize = useCallback(
    (copy: BilingualCopy) => (isRTL ? copy.ar : copy.en),
    [isRTL],
  );

  const buildItem = useCallback(
    (id: ShellRouteId): ShellNavItem => {
      const meta = ROUTE_META_BY_ID[id];
      return {
        kind: 'link',
        id,
        to: meta.to,
        icon: meta.icon,
        label: t(meta.translationKey),
        shortLabel: localize(ROUTE_COPY[id].dockLabel),
        description: localize(ROUTE_COPY[id].overflowDescription),
        isActive: isRouteActive(pathname, meta),
        badge: id === 'today' && pendingTodayCount > 0 ? pendingTodayCount : undefined,
      };
    },
    [localize, pathname, pendingTodayCount, t],
  );

  const desktopItems = useMemo(
    () => ROUTE_META.map(route => buildItem(route.id)),
    [buildItem],
  );

  const dockTrainEntry = useMemo<ShellNavTrainAction>(() => {
    const meta = ROUTE_META_BY_ID[NAV_DOCK_TRAIN_ID];
    return {
      kind: 'action',
      id: NAV_DOCK_TRAIN_ID,
      to: meta.to,
      icon: meta.icon,
      label: t(meta.translationKey),
      shortLabel: localize(ROUTE_COPY[NAV_DOCK_TRAIN_ID].dockLabel),
      isActive: pathname.startsWith(SESSION_ROUTE_PREFIX),
    };
  }, [localize, pathname, t]);

  const dockEntries = useMemo<ShellDockEntry[]>(
    () =>
      NAV_DOCK_LAYOUT.map(id =>
        id === NAV_DOCK_TRAIN_ID ? dockTrainEntry : buildItem(id),
      ),
    [buildItem, dockTrainEntry],
  );

  const overflowItems = useMemo(
    () => NAV_OVERFLOW_ROUTE_IDS.map(buildItem),
    [buildItem],
  );

  const activeOverflowItem = useMemo(
    () => overflowItems.find(item => item.isActive) ?? null,
    [overflowItems],
  );

  return {
    ...metrics,
    desktopItems,
    dockEntries,
    dockTrainEntry,
    overflowItems,
    activeOverflowItem,
  };
}
