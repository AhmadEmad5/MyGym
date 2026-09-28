import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Globe, Palette, Play } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { NAV_ROUTE_PATHS } from '../../app/routes';
import { NAV_SPRING } from './navMotion';
import { NavDestinationLink } from './NavDestinationLink';
import type { ShellNavItem } from './navModel';

export interface ShellDesktopActionsProps {
  activeTodaySessionId?: string;
  activeTodaySessionTitle?: string;
  streakDays: number;
  theme: string;
  avatarUrl?: string;
  avatarInitial: string;
  motionEnabled: boolean;
  onSelectRoute: (to: string) => void;
  onToggleThemePalette: () => void;
  onToggleLanguage: () => void;
}

export function ShellDesktopNavLinks({
  items,
  motionEnabled,
  onPrefetch,
}: {
  items: ShellNavItem[];
  motionEnabled: boolean;
  onPrefetch: (routeId: string) => void;
}) {
  return (
    <div className="modern-nav-links desktop-only-nav">
      {items.map(item => (
        <NavDestinationLink
          key={item.id}
          item={item}
          surface="desktop"
          activeLayoutId="modern-nav-active-pill"
          motionEnabled={motionEnabled}
          onSelect={() => undefined}
          onPrefetch={() => onPrefetch(item.id)}
        />
      ))}
    </div>
  );
}

export function ShellDesktopActions({
  activeTodaySessionId,
  activeTodaySessionTitle,
  streakDays,
  theme,
  avatarUrl,
  avatarInitial,
  motionEnabled,
  onSelectRoute,
  onToggleThemePalette,
  onToggleLanguage,
}: ShellDesktopActionsProps) {
  const { t, language, isRTL } = useTranslation();
  const streakUnit = isRTL ? 'ي' : 'd';
  const liveTitle = activeTodaySessionTitle
    ? `${t('tapToResume')}: ${activeTodaySessionTitle}`
    : t('tapToResume');

  return (
    <div className="modern-nav-actions desktop-only-nav">
      {activeTodaySessionId && (
        <Link
          to={`/session/${activeTodaySessionId}`}
          className="live-workout-nav-pill"
          title={liveTitle}
          aria-label={liveTitle}
        >
          <span className="live-pulse-dot" aria-hidden="true" />
          <Play size={11} fill="currentColor" aria-hidden="true" />
          <span className="live-workout-title-truncate">
            {activeTodaySessionTitle || t('activeWorkoutLive')}
          </span>
        </Link>
      )}

      {streakDays > 0 && (
        <motion.button
          type="button"
          className="nav-streak-pill"
          onClick={() => onSelectRoute(NAV_ROUTE_PATHS.performance)}
          whileHover={motionEnabled ? { scale: 1.05 } : undefined}
          whileTap={motionEnabled ? { scale: 0.94 } : undefined}
          transition={NAV_SPRING}
          title={isRTL ? `${streakDays} أيام تدريب متتالية` : `${streakDays} day training streak`}
        >
          <Flame size={14} className="streak-icon" aria-hidden="true" />
          <span>{streakDays}{streakUnit}</span>
        </motion.button>
      )}

      <div className="nav-theme-container">
        <motion.button
          type="button"
          className="nav-action-pill theme-cycler"
          onClick={onToggleThemePalette}
          whileHover={motionEnabled ? { scale: 1.05 } : undefined}
          whileTap={motionEnabled ? { scale: 0.92 } : undefined}
          transition={NAV_SPRING}
          title={t('themesPaletteTitle')}
          aria-label={t('themesPaletteTitle')}
          aria-haspopup="dialog"
        >
          <Palette size={14} className="action-icon" aria-hidden="true" />
          <span className="theme-dot-indicator" data-theme-indicator={theme} aria-hidden="true" />
        </motion.button>
      </div>

      <motion.button
        type="button"
        className="nav-action-pill"
        onClick={onToggleLanguage}
        whileHover={motionEnabled ? { scale: 1.05 } : undefined}
        whileTap={motionEnabled ? { scale: 0.94 } : undefined}
        transition={NAV_SPRING}
        title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        aria-label={isRTL ? 'تغيير اللغة' : 'Change language'}
      >
        <Globe size={14} className="action-icon" aria-hidden="true" />
        <span className="lang-text" aria-hidden="true">{language === 'ar' ? 'EN' : 'عربي'}</span>
      </motion.button>

      <Link
        to={NAV_ROUTE_PATHS.settings}
        className="nav-profile-pill"
        onClick={event => {
          event.preventDefault();
          onSelectRoute(NAV_ROUTE_PATHS.settings);
        }}
        aria-label={t('navSettings')}
      >
        <span className="avatar-disc">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="avatar-img" />
          ) : (
            <span className="avatar-letter">{avatarInitial}</span>
          )}
          <span className="online-beacon" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

export function ShellBrand({
  motionEnabled,
  onSelectRoute,
}: {
  motionEnabled: boolean;
  onSelectRoute: (to: string) => void;
}) {
  const { isRTL } = useTranslation();

  return (
    <Link
      to={NAV_ROUTE_PATHS.today}
      onClick={event => {
        event.preventDefault();
        onSelectRoute(NAV_ROUTE_PATHS.today);
      }}
      className="modern-nav-brand desktop-only-nav"
      aria-label={isRTL ? 'فورما — الرئيسية' : 'FORMA home'}
    >
      <motion.span
        className="brand-logo-gem"
        whileHover={motionEnabled ? { scale: 1.02 } : undefined}
        whileTap={motionEnabled ? { scale: 0.96 } : undefined}
        transition={NAV_SPRING}
        aria-hidden="true"
      >
        <Dumbbell className="brand-icon" size={18} />
        <span className="brand-glow-halo" />
      </motion.span>
      <span className="brand-text-col">
        <span className="brand-title-row">
          <span className="brand-name">FORMA</span>
          <span className="brand-badge">PRO</span>
        </span>
      </span>
    </Link>
  );
}
