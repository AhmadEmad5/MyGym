import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useData } from '../hooks/useData';
import { gymAudio } from '../lib/audio';
import { prefetchRoute } from '../App';
import { QuickWorkoutModal } from './QuickWorkoutModal';
import type { WorkoutSession } from '../lib/api';
import { useShellNavModel } from './layout/navModel';
import { useMotionEnabled } from './layout/useMotionPreference';
import { ShellBrand, ShellDesktopActions, ShellDesktopNavLinks } from './layout/ShellDesktopNav';
import { ShellMobileDock } from './layout/ShellMobileDock';
import { ShellMobileTopBar } from './layout/ShellMobileTopBar';
import { NavOverflowSheet } from './layout/NavOverflowSheet';
import { StartWorkoutSheet } from './layout/StartWorkoutSheet';
import { ThemePalettePopover } from './layout/ThemePalettePopover';

const SCROLL_COMPACT_THRESHOLD = 24;

export function ModernNavigationBar() {
  const { language, setLanguage, isRTL } = useTranslation();
  const { data, theme, setTheme, saveSession } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const motionEnabled = useMotionEnabled();

  const {
    desktopItems,
    dockEntries,
    overflowItems,
    activeOverflowItem,
    activeTodaySession,
    streakDays,
    isOffDay,
  } = useShellNavModel();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);
  const spotlightRef = useRef<HTMLSpanElement | null>(null);

  const navLabel = isRTL ? 'التنقل الرئيسي' : 'Primary navigation';
  const languageLabel = language === 'ar' ? 'English (EN)' : 'العربية (AR)';
  const avatarInitial = (data?.user?.name || data?.user?.email || 'A').charAt(0).toUpperCase();

  useEffect(() => {
    setIsThemePopoverOpen(false);
    setIsOverflowOpen(false);
    setIsStartSheetOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const contentArea = document.querySelector('.content-area');

    const handleScroll = () => {
      const offset = Math.max(window.scrollY, contentArea?.scrollTop ?? 0);
      setIsScrolled(offset > SCROLL_COMPACT_THRESHOLD);
    };

    setIsScrolled(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    contentArea?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      contentArea?.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const selectRoute = useCallback(
    (to: string) => {
      gymAudio.triggerSubtleHaptic([18]);
      navigate(to);
    },
    [navigate],
  );

  const prefetchNav = useCallback((routeId: string) => {
    prefetchRoute(routeId);
  }, []);

  const toggleLanguage = useCallback(() => {
    void setLanguage(language === 'ar' ? 'en' : 'ar');
    gymAudio.triggerSubtleHaptic([20]);
  }, [language, setLanguage]);

  const selectTheme = useCallback(
    async (themeId: string) => {
      await setTheme(themeId);
      setIsThemePopoverOpen(false);
      gymAudio.triggerSubtleHaptic([25]);
    },
    [setTheme],
  );

  const handleQuickWorkoutAdd = useCallback(
    async (draft: Partial<WorkoutSession>) => {
      const session = draft as WorkoutSession;
      await saveSession(session);
      setIsQuickWorkoutOpen(false);
      navigate(`/session/${session.id}`);
    },
    [navigate, saveSession],
  );

  const handleSpotlightMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !motionEnabled) return;
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    spotlight.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
    spotlight.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
    spotlight.dataset.visible = 'true';
  };

  return (
    <>
      <ShellMobileTopBar
        activeTodaySession={activeTodaySession}
        streakDays={streakDays}
        theme={theme}
        avatarUrl={data?.user?.pfp}
        avatarInitial={avatarInitial}
        motionEnabled={motionEnabled}
        onSelectRoute={selectRoute}
        onToggleThemePalette={() => {
          gymAudio.triggerSubtleHaptic([18]);
          setIsThemePopoverOpen(previous => !previous);
        }}
        onToggleLanguage={toggleLanguage}
      />

      <div className={`modern-nav-wrapper${isScrolled ? ' is-scrolled' : ''}`}>
        <nav
          className={`modern-navbar${isScrolled ? ' is-scrolled' : ''}`}
          aria-label={navLabel}
          onPointerMove={handleSpotlightMove}
          onPointerLeave={() => {
            if (spotlightRef.current) spotlightRef.current.dataset.visible = 'false';
          }}
        >
          <span
            ref={spotlightRef}
            className="navbar-magnetic-spotlight"
            data-visible="false"
            aria-hidden="true"
          />

          <ShellBrand motionEnabled={motionEnabled} onSelectRoute={selectRoute} />

          <ShellDesktopNavLinks
            items={desktopItems}
            motionEnabled={motionEnabled}
            onPrefetch={prefetchNav}
          />

          <ShellMobileDock
            entries={dockEntries}
            activeOverflowItem={activeOverflowItem}
            isOverflowOpen={isOverflowOpen}
            activeTodaySessionId={activeTodaySession?.id}
            motionEnabled={motionEnabled}
            onPrefetch={prefetchNav}
            onActivateTrain={() => {
              gymAudio.triggerSubtleHaptic([18]);
              if (activeTodaySession) navigate(`/session/${activeTodaySession.id}`);
              else setIsStartSheetOpen(true);
            }}
            onToggleOverflow={() => {
              gymAudio.triggerSubtleHaptic([18]);
              setIsOverflowOpen(previous => !previous);
            }}
          />

          <ShellDesktopActions
            activeTodaySessionId={activeTodaySession?.id}
            activeTodaySessionTitle={activeTodaySession?.title}
            streakDays={streakDays}
            theme={theme}
            avatarUrl={data?.user?.pfp}
            avatarInitial={avatarInitial}
            motionEnabled={motionEnabled}
            onSelectRoute={selectRoute}
            onToggleThemePalette={() => setIsThemePopoverOpen(previous => !previous)}
            onToggleLanguage={toggleLanguage}
          />
        </nav>
      </div>

      <ThemePalettePopover
        open={isThemePopoverOpen}
        activeTheme={theme}
        motionEnabled={motionEnabled}
        onClose={() => setIsThemePopoverOpen(false)}
        onSelect={themeId => void selectTheme(themeId)}
      />

      <NavOverflowSheet
        open={isOverflowOpen}
        items={overflowItems}
        motionEnabled={motionEnabled}
        languageLabel={languageLabel}
        onClose={() => setIsOverflowOpen(false)}
        onSelect={() => gymAudio.triggerSubtleHaptic([18])}
        onPrefetch={prefetchNav}
        onOpenThemePalette={() => {
          setIsOverflowOpen(false);
          setIsThemePopoverOpen(true);
        }}
        onToggleLanguage={() => {
          setIsOverflowOpen(false);
          toggleLanguage();
        }}
      />

      <StartWorkoutSheet
        open={isStartSheetOpen}
        isOffDay={isOffDay}
        onClose={() => setIsStartSheetOpen(false)}
        onOpenQuickWorkout={() => {
          setIsStartSheetOpen(false);
          setIsQuickWorkoutOpen(true);
        }}
        onNavigate={to => {
          setIsStartSheetOpen(false);
          navigate(to);
        }}
      />

      <QuickWorkoutModal
        isOpen={isQuickWorkoutOpen}
        onClose={() => setIsQuickWorkoutOpen(false)}
        onAdd={handleQuickWorkoutAdd}
        weightUnit={data?.settings?.weightUnit || 'kg'}
        restSeconds={data?.settings?.restTimerSeconds || 90}
      />
    </>
  );
}
