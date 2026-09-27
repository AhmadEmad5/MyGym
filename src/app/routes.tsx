export const APP_ROUTES = {
  home: '/',
  today: '/today',
  plan: '/plan',
  calendar: '/calendar',
  routines: '/routines',
  nutrition: '/nutrition',
  food: '/food',
  performance: '/performance',
  settings: '/settings',
  session: '/session/:id',
  adminDashboard: '/admin/dashboard',
} as const;

export const NAV_ROUTE_PATHS = {
  today: APP_ROUTES.today,
  plan: APP_ROUTES.plan,
  routines: APP_ROUTES.routines,
  nutrition: APP_ROUTES.nutrition,
  performance: APP_ROUTES.performance,
  settings: APP_ROUTES.settings,
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
