import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  Settings,
  Utensils,
} from 'lucide-react';
import type { RouteId } from '../types/ui';
import { APP_ROUTES, NAV_ROUTE_PATHS } from './routes';

export type ShellRouteId = Exclude<RouteId, 'session'>;

export type NavTranslationKey =
  | 'navToday'
  | 'navPlan'
  | 'navRoutines'
  | 'navNutrition'
  | 'navPerformance'
  | 'navSettings';

export interface RouteMeta {
  id: ShellRouteId;
  to: string;
  icon: LucideIcon;
  translationKey: NavTranslationKey;
}

export const ROUTE_META: RouteMeta[] = [
  { id: 'today', to: NAV_ROUTE_PATHS.today, icon: LayoutDashboard, translationKey: 'navToday' },
  { id: 'plan', to: NAV_ROUTE_PATHS.plan, icon: CalendarDays, translationKey: 'navPlan' },
  { id: 'routines', to: NAV_ROUTE_PATHS.routines, icon: Dumbbell, translationKey: 'navRoutines' },
  { id: 'nutrition', to: NAV_ROUTE_PATHS.nutrition, icon: Utensils, translationKey: 'navNutrition' },
  { id: 'performance', to: NAV_ROUTE_PATHS.performance, icon: Activity, translationKey: 'navPerformance' },
  { id: 'settings', to: NAV_ROUTE_PATHS.settings, icon: Settings, translationKey: 'navSettings' },
];

export const ROUTE_META_BY_ID: Record<ShellRouteId, RouteMeta> = ROUTE_META.reduce(
  (accumulator, route) => {
    accumulator[route.id] = route;
    return accumulator;
  },
  {} as Record<ShellRouteId, RouteMeta>,
);

const ALIASED_ROUTE_PREFIXES: Partial<Record<ShellRouteId, readonly string[]>> = {
  plan: [APP_ROUTES.calendar],
  nutrition: [APP_ROUTES.food],
};

export function routeIsActive(pathname: string, route: RouteMeta) {
  if (pathname.startsWith(route.to)) return true;
  const aliases = ALIASED_ROUTE_PREFIXES[route.id];
  return Boolean(aliases?.some(alias => pathname.startsWith(alias)));
}

export const NAV_DOCK_TRAIN_ID = 'routines' as const satisfies ShellRouteId;

export const NAV_DOCK_LAYOUT = [
  'today',
  'plan',
  NAV_DOCK_TRAIN_ID,
  'nutrition',
] as const satisfies readonly ShellRouteId[];

export const NAV_OVERFLOW_ROUTE_IDS = ['routines', 'performance', 'settings'] as const satisfies readonly ShellRouteId[];
