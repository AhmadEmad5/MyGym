import { describe, expect, it } from 'vitest';
import { SHELL_ROUTES, isNestedRoute, isRouteActive, resolveActiveShellRoute } from '../navActive';
import { NAV_ROUTE_PATHS } from '../../app/routes';

const plan = { id: 'plan', to: NAV_ROUTE_PATHS.plan } as const;
const nutrition = { id: 'nutrition', to: NAV_ROUTE_PATHS.nutrition } as const;
const today = { id: 'today', to: NAV_ROUTE_PATHS.today } as const;

describe('isRouteActive (N-01)', () => {
  it('N-01 /planning is NOT the /plan destination', () => {
    expect(plan.to).toBe('/plan');
    expect(isRouteActive('/planning', plan)).toBe(false);
    expect(isRouteActive('/planner', plan)).toBe(false);
    expect(isRouteActive('/plan-2026', plan)).toBe(false);
    expect(isRouteActive('/planning', nutrition)).toBe(false);
    expect(isRouteActive('/planning', today)).toBe(false);
  });

  it('N-01 the same path a raw startsWith would wrongly accept is now rejected everywhere', () => {
    for (const route of SHELL_ROUTES) {
      const sibling = `${route.to}ning`;
      expect(isRouteActive(sibling, route), `${sibling} vs ${route.to}`).toBe(false);
    }
  });

  it('N-01 the genuine routes are still active', () => {
    expect(isRouteActive('/plan', plan)).toBe(true);
    expect(isRouteActive('/plan/2026-01-05', plan)).toBe(true);
    expect(isRouteActive('/today', today)).toBe(true);
    expect(isRouteActive('/today/anything/deep', today)).toBe(true);
    expect(isRouteActive('/nutrition', nutrition)).toBe(true);
  });

  it('N-01 aliases stay active, and only on a segment boundary', () => {
    expect(isRouteActive('/calendar', plan)).toBe(true);
    expect(isRouteActive('/calendar/2026-01-05', plan)).toBe(true);
    expect(isRouteActive('/calendaring', plan)).toBe(false);
    expect(isRouteActive('/food', nutrition)).toBe(true);
    expect(isRouteActive('/food-log', nutrition)).toBe(false);
  });

  it('N-01 rejects a malformed route argument instead of throwing', () => {
    expect(isRouteActive('/plan', undefined as never)).toBe(false);
    expect(isRouteActive('/plan', { id: 'plan', to: undefined as never })).toBe(false);
  });
});

describe('isNestedRoute (N-04)', () => {
  it('N-04 requires a segment boundary', () => {
    expect(isNestedRoute('/plan', '/plan')).toBe(true);
    expect(isNestedRoute('/plan/', '/plan')).toBe(true);
    expect(isNestedRoute('/plan///', '/plan')).toBe(true);
    expect(isNestedRoute('/plan/2026-01-05', '/plan')).toBe(true);
    expect(isNestedRoute('/planning', '/plan')).toBe(false);
    expect(isNestedRoute('/planx/y', '/plan')).toBe(false);
  });

  it('N-04 normalises trailing slashes on both sides', () => {
    expect(isNestedRoute('/plan/', '/plan/')).toBe(true);
    expect(isNestedRoute('/plan/a/', '/plan')).toBe(true);
  });

  it('N-04 the root prefix owns only the root', () => {
    expect(isNestedRoute('/', '/')).toBe(true);
    expect(isNestedRoute('/today', '/')).toBe(false);
    expect(isNestedRoute('', '/')).toBe(true);
  });

  it('N-04 tolerates non-string and whitespace input', () => {
    expect(isNestedRoute('  /plan/a  ', '/plan')).toBe(true);
    expect(isNestedRoute(undefined as never, '/plan')).toBe(false);
    expect(isNestedRoute('/plan', undefined as never)).toBe(false);
  });
});

describe('resolveActiveShellRoute (N-05)', () => {
  it('N-05 reports exact matches', () => {
    expect(resolveActiveShellRoute('/plan')).toEqual({
      kind: 'exact',
      routeId: 'plan',
      pathname: '/plan',
      matched: '/plan',
    });
    expect(resolveActiveShellRoute('/today')).toMatchObject({ kind: 'exact', routeId: 'today' });
    expect(resolveActiveShellRoute('/settings')).toMatchObject({ kind: 'exact', routeId: 'settings' });
  });

  it('N-05 reports nested matches', () => {
    expect(resolveActiveShellRoute('/plan/2026-01-05')).toEqual({
      kind: 'nested',
      routeId: 'plan',
      pathname: '/plan/2026-01-05',
      matched: '/plan',
    });
    expect(resolveActiveShellRoute('/performance/records/1rm')).toMatchObject({
      kind: 'nested',
      routeId: 'performance',
    });
  });

  it('N-05 reports alias matches', () => {
    expect(resolveActiveShellRoute('/calendar')).toEqual({
      kind: 'alias-exact',
      routeId: 'plan',
      pathname: '/calendar',
      matched: '/calendar',
    });
    expect(resolveActiveShellRoute('/food')).toMatchObject({ kind: 'alias-exact', routeId: 'nutrition' });
    expect(resolveActiveShellRoute('/calendar/2026-01-05')).toMatchObject({
      kind: 'alias-nested',
      routeId: 'plan',
    });
  });

  it('N-05 returns null for a path that belongs to no shell route', () => {
    expect(resolveActiveShellRoute('/planning')).toBeNull();
    expect(resolveActiveShellRoute('/planner')).toBeNull();
    expect(resolveActiveShellRoute('/session/abc-123')).toBeNull();
    expect(resolveActiveShellRoute('/admin/dashboard')).toBeNull();
    expect(resolveActiveShellRoute('/')).toBeNull();
    expect(resolveActiveShellRoute('')).toBeNull();
  });

  it('N-05 prefers an exact match over a nested one', () => {
    for (const route of SHELL_ROUTES) {
      const nested = resolveActiveShellRoute(`${route.to}/deeper`);
      expect(nested, route.id).toMatchObject({ kind: 'nested', routeId: route.id });
      expect(resolveActiveShellRoute(route.to), route.id).toMatchObject({ kind: 'exact', routeId: route.id });
    }
  });

  it('N-05 at most one route is ever active for a given path', () => {
    const paths = [
      '/today',
      '/plan',
      '/plan/2026-01-05',
      '/routines',
      '/nutrition',
      '/performance',
      '/settings',
      '/calendar',
      '/food',
      '/planning',
      '/session/abc',
      '/',
    ];
    for (const path of paths) {
      const active = SHELL_ROUTES.filter(route => isRouteActive(path, route)).map(route => route.id);
      expect(active.length, `${path} matched ${active.join(',')}`).toBeLessThanOrEqual(1);
      const resolved = resolveActiveShellRoute(path);
      expect(resolved?.routeId ?? null, path).toEqual(active[0] ?? null);
    }
  });

  it('N-05 is deterministic across repeated calls', () => {
    for (const path of ['/plan', '/plan/2026-01-05', '/calendar', '/food', '/planning']) {
      const first = resolveActiveShellRoute(path);
      const second = resolveActiveShellRoute(path);
      expect(second).toEqual(first);
      expect(resolveActiveShellRoute(path)).toEqual(first);
    }
  });

  it('N-05 normalises the path it reports', () => {
    expect(resolveActiveShellRoute('/plan/')).toMatchObject({ kind: 'exact', pathname: '/plan' });
    expect(resolveActiveShellRoute('  /plan/a/  ')).toMatchObject({ pathname: '/plan/a' });
  });
});

describe('SHELL_ROUTES', () => {
  it('covers the six shell destinations with their real paths', () => {
    expect(SHELL_ROUTES).toEqual([
      { id: 'today', to: '/today' },
      { id: 'plan', to: '/plan' },
      { id: 'routines', to: '/routines' },
      { id: 'nutrition', to: '/nutrition' },
      { id: 'performance', to: '/performance' },
      { id: 'settings', to: '/settings' },
    ]);
  });
});