import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Trophy,
  Utensils,
  Users,
  X
} from 'lucide-react';
import { adminCopy } from './copy';
import { formatTime } from './format';
import type { AdminCategory, LoadStatus } from './types';
import type { AdminPlatformStats, AthleteSummary } from '../../lib/adminData';

type ShellProps = {
  locale: 'ar' | 'en';
  isRTL: boolean;
  activeCategory: AdminCategory;
  onCategoryChange: (category: AdminCategory) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  status: LoadStatus;
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  adminEmail: string;
  onSwitchToAthlete: () => void;
  onLogout: () => void;
  onToggleLanguage: () => void;
  children: ReactNode;
};

type NavItem = { id: AdminCategory; label: string; icon: typeof LayoutDashboard; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

export function AdminShell({
  locale,
  isRTL,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  status,
  stats,
  athletes,
  adminEmail,
  onSwitchToAthlete,
  onLogout,
  onToggleLanguage,
  children
}: ShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [activeCategory]);

  useEffect(() => {
    if (!navOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  const groups: NavGroup[] = [
    {
      title: adminCopy.sectionPulse(locale),
      items: [
        { id: 'overview', label: adminCopy.catOverview(locale), icon: LayoutDashboard, badge: stats?.totalAthletes },
        { id: 'records', label: adminCopy.catRecords(locale), icon: Trophy, badge: stats?.globalPRs.length }
      ]
    },
    {
      title: adminCopy.sectionRoster(locale),
      items: [
        { id: 'athletes', label: adminCopy.catAthletes(locale), icon: Users, badge: athletes.length },
        { id: 'workouts', label: adminCopy.catWorkouts(locale), icon: Dumbbell, badge: stats?.totalWorkoutsCompleted }
      ]
    },
    {
      title: adminCopy.sectionHealth(locale),
      items: [{ id: 'nutrition', label: adminCopy.catNutrition(locale), icon: Utensils, badge: stats?.totalMealsLogged }]
    },
    {
      title: adminCopy.sectionSystem(locale),
      items: [{ id: 'governance', label: adminCopy.catGovernance(locale), icon: Settings2 }]
    }
  ];

  const flat = groups.flatMap((group) => group.items);
  const connectionLabel =
    status === 'error'
      ? adminCopy.liveError(locale)
      : status === 'loading'
        ? adminCopy.loading(locale)
        : adminCopy.liveConnected(locale);
  const connectionTone = status === 'error' ? 'bad' : status === 'ready' || status === 'refreshing' ? 'ok' : 'warn';

  return (
    <div className="admin-root" dir={isRTL ? 'rtl' : 'ltr'}>
      {navOpen && <div className="admin-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`admin-sidebar ${navOpen ? 'is-open' : ''}`} aria-label={adminCopy.navAriaLabel(locale)}>
        <div className="admin-sidebar-head">
          <span className="admin-brand-gem" aria-hidden="true">
            <Shield size={18} />
          </span>
          <div className="admin-brand-text">
            <span className="admin-brand-name">FORMA</span>
            <span className="admin-brand-tag">{adminCopy.productTag(locale)}</span>
          </div>
          <button
            type="button"
            className="admin-icon-btn admin-nav-close touch-target"
            onClick={() => setNavOpen(false)}
            aria-label={adminCopy.toggleSidebar(locale)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {groups.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <h2 className="admin-nav-group-title">{group.title}</h2>
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const current = activeCategory === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`admin-nav-item touch-target ${current ? 'is-active' : ''}`}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => onCategoryChange(item.id)}
                      >
                        <Icon size={17} aria-hidden="true" />
                        <span className="admin-nav-label">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && <span className="admin-nav-badge">{item.badge}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <button type="button" className="admin-nav-action touch-target" onClick={onSwitchToAthlete}>
            <Dumbbell size={16} aria-hidden="true" />
            <span>{adminCopy.switchToAthlete(locale)}</span>
          </button>
          <button type="button" className="admin-nav-action is-danger touch-target" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>{adminCopy.signOut(locale)}</span>
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-row">
            <button
              type="button"
              className="admin-icon-btn touch-target"
              onClick={() => setNavOpen((open) => !open)}
              aria-label={adminCopy.toggleSidebar(locale)}
              aria-expanded={navOpen}
            >
              {navOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>

            <span className={`admin-connection is-${connectionTone}`} role="status">
              {connectionTone === 'ok' ? (
                <CheckCircle2 size={13} aria-hidden="true" />
              ) : connectionTone === 'bad' ? (
                <CircleAlert size={13} aria-hidden="true" />
              ) : (
                <Loader2 size={13} aria-hidden="true" className="is-spinning" />
              )}
              {connectionLabel}
            </span>

            <div className="admin-topbar-spacer" />

            <button
              type="button"
              className="admin-icon-btn touch-target"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={adminCopy.refresh(locale)}
            >
              <RefreshCw size={17} aria-hidden="true" className={isRefreshing ? 'is-spinning' : ''} />
            </button>

            <button type="button" className="admin-lang-pill touch-target" onClick={onToggleLanguage} aria-label={adminCopy.navAriaLabel(locale)}>
              {isRTL ? 'EN' : 'عربي'}
            </button>

            <div className="admin-account">
              <span className="admin-account-avatar" aria-hidden="true">
                A
              </span>
              <span className="admin-account-email">{adminEmail}</span>
            </div>
          </div>

          <div className="admin-topbar-row is-search">
            <label className="admin-search" htmlFor="admin-global-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">{adminCopy.searchLabel(locale)}</span>
              <input
                id="admin-global-search"
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={adminCopy.searchPlaceholder(locale)}
              />
              {searchQuery && (
                <button type="button" className="touch-target" onClick={() => onSearchChange('')} aria-label={adminCopy.clearSearch(locale)}>
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </label>
            <span className="admin-clock">{formatTime(locale)}</span>
          </div>
        </header>

        <nav className="admin-tabbar" aria-label={adminCopy.navAriaLabel(locale)}>
          {flat.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-tab touch-target ${activeCategory === item.id ? 'is-active' : ''}`}
                aria-current={activeCategory === item.id ? 'page' : undefined}
                onClick={() => onCategoryChange(item.id)}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="admin-body">{children}</main>
      </div>
    </div>
  );
}
