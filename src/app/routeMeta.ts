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
import { NAV_ROUTE_PATHS } from './routes';

export interface RouteMeta {
  id: Exclude<RouteId, 'session'>;
  to: string;
  icon: LucideIcon;
  translationKey:
    | 'navToday'
    | 'navPlan'
    | 'navRoutines'
    | 'navNutrition'
    | 'navPerformance'
    | 'navSettings';
}

export const ROUTE_META: RouteMeta[] = [
  { id: 'today', to: NAV_ROUTE_PATHS.today, icon: LayoutDashboard, translationKey: 'navToday' },
  { id: 'plan', to: NAV_ROUTE_PATHS.plan, icon: CalendarDays, translationKey: 'navPlan' },
  { id: 'routines', to: NAV_ROUTE_PATHS.routines, icon: Dumbbell, translationKey: 'navRoutines' },
  { id: 'nutrition', to: NAV_ROUTE_PATHS.nutrition, icon: Utensils, translationKey: 'navNutrition' },
  { id: 'performance', to: NAV_ROUTE_PATHS.performance, icon: Activity, translationKey: 'navPerformance' },
  { id: 'settings', to: NAV_ROUTE_PATHS.settings, icon: Settings, translationKey: 'navSettings' },
];

export function routeIsActive(pathname: string, route: RouteMeta) {
  if (route.id === 'plan') {
    return pathname.startsWith('/plan') || pathname.startsWith('/calendar');
  }
  return pathname.startsWith(route.to);
}
