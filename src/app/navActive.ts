/**
 * Pure, Firebase-free shell-navigation active-state resolution.
 *
 * `routeMeta.ts:53` answers "is this route active?" with a raw
 * `pathname.startsWith(route.to)` and no segment-boundary check, which makes
 * `/planning` look like the `/plan` destination. `isRouteActive` here is the
 * corrected form: a prefix only counts when it ends on a `/` boundary.
 *
 * The `RouteMeta` import is type-only, so this module pulls in no React, no
 * `lucide-react` and no Firebase at runtime and stays safe to load in a node
 * test. `routeMeta.ts` / `navModel.ts` are not touched: the navigation
 * resolver is a later phase, and this module is built and tested now so that
 * phase has something correct to adopt.
 */

import { APP_ROUTES, NAV_ROUTE_PATHS } from './routes';
import type { ShellRouteId } from './routeMeta';

export interface NavRouteLike {
  readonly id: ShellRouteId;
  readonly to: string;
}

export type NavActiveKind = 'exact' | 'nested' | 'alias-exact' | 'alias-nested' | 'none';

export interface NavActiveResult {
  readonly kind: Exclude<NavActiveKind, 'none'>;
  readonly routeId: ShellRouteId;
  readonly pathname: string;
  readonly matched: string;
}

const ALIASES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  plan: Object.freeze([APP_ROUTES.calendar]),
  nutrition: Object.freeze([APP_ROUTES.food]),
});

export const SHELL_ROUTES: readonly NavRouteLike[] = Object.freeze([
  { id: 'today', to: NAV_ROUTE_PATHS.today },
  { id: 'plan', to: NAV_ROUTE_PATHS.plan },
  { id: 'routines', to: NAV_ROUTE_PATHS.routines },
  { id: 'nutrition', to: NAV_ROUTE_PATHS.nutrition },
  { id: 'performance', to: NAV_ROUTE_PATHS.performance },
  { id: 'settings', to: NAV_ROUTE_PATHS.settings },
]);

function normalize(pathname: string): string {
  if (typeof pathname !== 'string' || !pathname) return '/';
  const trimmed = pathname.trim();
  if (!trimmed) return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

/**
 * True only when `pathname` IS `prefix` or sits under it on a segment
 * boundary. `/plan`, `/plan/` and `/plan/2026-01-05` are inside `/plan`;
 * `/planning` and `/planner` are not.
 */
export function isNestedRoute(pathname: string, prefix: string): boolean {
  const path = normalize(pathname);
  const base = normalize(prefix);
  if (base === '/') return path === '/';
  if (path === base) return true;
  return path.startsWith(`${base}/`);
}

function aliasList(route: NavRouteLike): readonly string[] {
  return ALIASES[route.id] ?? [];
}

export function isRouteActive(pathname: string, route: NavRouteLike): boolean {
  if (!route || typeof route.to !== 'string') return false;
  if (isNestedRoute(pathname, route.to)) return true;
  return aliasList(route).some(alias => isNestedRoute(pathname, alias));
}

const KIND_RANK: Readonly<Record<Exclude<NavActiveKind, 'none'>, number>> = Object.freeze({
  'exact': 0,
  'alias-exact': 1,
  'nested': 2,
  'alias-nested': 3,
});

/**
 * Resolves the single shell destination that owns `pathname`, or `null` when
 * the path belongs to no shell route. Exact matches beat nested ones, a route's
 * own path beats one of its aliases, and among nested matches the longest
 * prefix wins so a deeper destination can never be shadowed by a shallower one.
 */
export function resolveActiveShellRoute(pathname: string): NavActiveResult | null {
  const path = normalize(pathname);
  let best: NavActiveResult | null = null;

  for (const route of SHELL_ROUTES) {
    const ownPath = normalize(route.to);
    const ownExact = path === ownPath;
    const ownNested = !ownExact && isNestedRoute(path, route.to);
    const aliases = aliasList(route);

    for (const alias of aliases) {
      const aliasPath = normalize(alias);
      const aliasExact = path === aliasPath;
      const aliasNested = !aliasExact && isNestedRoute(path, alias);
      if (!aliasExact && !aliasNested) continue;
      const kind: Exclude<NavActiveKind, 'none'> = aliasExact ? 'alias-exact' : 'alias-nested';
      best = pick(best, { kind, routeId: route.id, pathname: path, matched: aliasPath }, aliasPath);
    }

    if (ownExact || ownNested) {
      const kind: Exclude<NavActiveKind, 'none'> = ownExact ? 'exact' : 'nested';
      best = pick(best, { kind, routeId: route.id, pathname: path, matched: ownPath }, ownPath);
    }
  }

  return best;
}

function pick(
  current: NavActiveResult | null,
  candidate: NavActiveResult,
  candidatePrefix: string,
): NavActiveResult {
  if (!current) return candidate;
  const currentRank = KIND_RANK[current.kind];
  const candidateRank = KIND_RANK[candidate.kind];
  if (candidateRank < currentRank) return candidate;
  if (candidateRank > currentRank) return current;
  return candidatePrefix.length > current.matched.length ? candidate : current;
}