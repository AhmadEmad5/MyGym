import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Globe, Palette, Play } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { NAV_ROUTE_PATHS } from '../../app/routes';
import { NAV_SPRING } from './navMotion';
import type { WorkoutSession } from '../../lib/api';

interface ShellMobileTopBarProps {
  activeTodaySession: WorkoutSession | null;
  streakDays: number;
  theme: string;
  avatarUrl?: string;
  avatarInitial: string;
  motionEnabled: boolean;
  onSelectRoute: (to: string) => void;
  onToggleThemePalette: () => void;
  onToggleLanguage: () => void;
}

export function ShellMobileTopBar({
  activeTodaySession,
  streakDays,
  theme,
  avatarUrl,
  avatarInitial,
  motionEnabled,
  onSelectRoute,
  onToggleLanguage,
  onToggleThemePalette,
}: ShellMobileTopBarProps) {
  const { t, language, isRTL } = useTranslation();

  const routeTo = (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onSelectRoute(to);
  };

  const liveLabel = activeTodaySession?.title
    ? `${t('tapToResume')}: ${activeTodaySession.title}`
    : t('tapToResume');

  const otherLanguageName = language === 'ar' ? 'English' : 'العربية';
  const streakUnit = isRTL ? 'ي' : 'd';

  return (
    <header className="mobile-top-bar" aria-label={isRTL ? 'ترويسة التطبيق' : 'App header'}>
      <Link
        to={NAV_ROUTE_PATHS.today}
        onClick={routeTo(NAV_ROUTE_PATHS.today)}
        className="mobile-top-brand"
        aria-label={isRTL ? 'فورما — الرئيسية' : 'FORMA home'}
      >
        <motion.span
          className="brand-logo-gem"
          whileTap={motionEnabled ? { scale: 0.94 } : undefined}
          transition={NAV_SPRING}
          aria-hidden="true"
        >
          <Dumbbell className="brand-icon" size={17} />
          {activeTodaySession && <span className="brand-live-dot-ping" />}
        </motion.span>
        <span className="mobile-brand-title">
          FORMA
          {!activeTodaySession && <span className="mobile-brand-badge">PRO</span>}
        </span>
      </Link>

      <div className="mobile-top-center">
        {activeTodaySession ? (
          <Link
            to={`/session/${activeTodaySession.id}`}
            className="mobile-live-workout-pill compact"
            title={liveLabel}
            onClick={routeTo(`/session/${activeTodaySession.id}`)}
            aria-label={liveLabel}
          >
            <span className="live-pulse-dot" aria-hidden="true" />
            <Play size={10} fill="currentColor" aria-hidden="true" />
            <span className="live-pill-text">{isRTL ? 'مباشر' : 'LIVE'}</span>
          </Link>
        ) : streakDays > 0 ? (
          <Link
            to={NAV_ROUTE_PATHS.performance}
            className="mobile-top-streak"
            onClick={routeTo(NAV_ROUTE_PATHS.performance)}
            title={isRTL ? `${streakDays} أيام تدريب متتالية` : `${streakDays} day training streak`}
          >
            <Flame size={14} className="streak-icon" aria-hidden="true" />
            <span>{streakDays}{streakUnit}</span>
          </Link>
        ) : null}
      </div>

      <div className="mobile-top-actions">
        <motion.button
          type="button"
          className="mobile-top-btn"
          onClick={onToggleThemePalette}
          whileTap={motionEnabled ? { scale: 0.92 } : undefined}
          transition={NAV_SPRING}
          title={t('themesPaletteTitle')}
          aria-label={t('themesPaletteTitle')}
          aria-haspopup="dialog"
        >
          <Palette size={16} aria-hidden="true" />
          <span className="theme-dot-indicator" data-theme-indicator={theme} aria-hidden="true" />
        </motion.button>

        <motion.button
          type="button"
          className="mobile-top-btn"
          onClick={onToggleLanguage}
          whileTap={motionEnabled ? { scale: 0.92 } : undefined}
          transition={NAV_SPRING}
          title={otherLanguageName}
          aria-label={isRTL ? 'تغيير اللغة' : 'Change language'}
        >
          <Globe size={16} aria-hidden="true" />
        </motion.button>

        <Link
          to={NAV_ROUTE_PATHS.settings}
          className="mobile-top-avatar"
          onClick={routeTo(NAV_ROUTE_PATHS.settings)}
          aria-label={t('navSettings')}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="avatar-img" />
          ) : (
            <span className="avatar-letter">{avatarInitial}</span>
          )}
          <span className="online-beacon" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
