import { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarDays, 
  House,
  LayoutGrid,
  Dumbbell, 
  Utensils, 
  Activity, 
  Settings, 
  Globe, 
  Flame, 
  Palette, 
  X, 
  Check, 
  Play, 
  ChevronRight, 
  Layers 
} from 'lucide-react';
import { isSameDay, startOfDay, subDays } from 'date-fns';
import { useTranslation } from '../lib/i18n';
import { useData } from '../hooks/useData';
import { gymAudio } from '../lib/audio';
import { prefetchRoute } from '../App';
import { QuickWorkoutModal } from './QuickWorkoutModal';
import { MobileActionSheet } from './layout/MobileActionSheet';
import type { WorkoutSession } from '../lib/api';

const navSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.75
};

const sheetSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34
};

const THEMES = [
  { id: 'dark', name: 'Obsidian', color: '#38bdf8' },
  { id: 'light', name: 'Cloud', color: '#3b82f6' },
  { id: 'midnight', name: 'Midnight', color: '#60a5fa' },
  { id: 'neon', name: 'Neon', color: '#e879f9' },
  { id: 'ocean', name: 'Ocean', color: '#14b8a6' },
  { id: 'forest', name: 'Forest', color: '#10b981' },
  { id: 'sunset', name: 'Sunset', color: '#f97316' },
  { id: 'paper', name: 'Paper', color: '#cbd5e1' },
] as const;

export function ModernNavigationBar() {
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { data, theme, setTheme, saveSession } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const themeContainerRef = useRef<HTMLDivElement | null>(null);
  const sheetDragControls = useDragControls();

  // Close any open overlay after navigation.
  useEffect(() => {
    setIsThemePopoverOpen(false);
    setIsMoreSheetOpen(false);
    setIsLogSheetOpen(false);
  }, [location.pathname]);

  // Outside click listener for Theme Popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeContainerRef.current && !themeContainerRef.current.contains(e.target as Node)) {
        setIsThemePopoverOpen(false);
      }
    };

    if (isThemePopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isThemePopoverOpen]);

  // Scroll listener for dynamic compact header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.querySelector('.content-area')?.scrollTop || 0;
      setIsScrolled(scrollY > 24);
    };

    setIsScrolled(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    const contentArea = document.querySelector('.content-area');
    contentArea?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      contentArea?.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  // Today's active uncompleted session (Friday is strictly off-day / gym is closed)
  const activeTodaySession = useMemo(() => {
    const today = new Date();
    if (today.getDay() === 5) return null;
    return (data?.sessions || []).find(
      s => isSameDay(new Date(s.date), today) && !s.isCompleted
    );
  }, [data?.sessions]);

  // Today's pending workouts count (Friday is strictly off-day / gym is closed)
  const pendingTodayCount = useMemo(() => {
    const today = new Date();
    if (today.getDay() === 5) return 0;
    return (data?.sessions || []).filter(
      s => isSameDay(new Date(s.date), today) && !s.isCompleted
    ).length;
  }, [data?.sessions]);

  // Athlete consecutive training streak (days)
  const streakDays = useMemo(() => {
    let count = 0;
    const today = startOfDay(new Date());

    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasWorkout = (data?.history || []).some(h => isSameDay(new Date(h.date), checkDate)) ||
                         (data?.sessions || []).some(s => s.isCompleted && isSameDay(new Date(s.date), checkDate));
      
      if (hasWorkout) {
        count++;
      } else {
        if (i === 0) continue; // Today grace period
        break;
      }
    }
    return count;
  }, [data?.history, data?.sessions]);

  // Desktop Navigation Items (Consolidated 6 views, history merged into calendar)
  const desktopNavItems = useMemo(() => [
    { 
      to: '/today', 
      icon: LayoutDashboard, 
      label: t('navToday'), 
      badge: pendingTodayCount > 0 ? pendingTodayCount : undefined
    },
    { 
      to: '/plan', 
      icon: CalendarDays, 
      label: t('navPlan') 
    },
    { 
      to: '/routines', 
      icon: Dumbbell, 
      label: t('navRoutines') 
    },
    { 
      to: '/nutrition', 
      icon: Utensils, 
      label: t('navNutrition') 
    },
    { 
      to: '/performance', 
      icon: Activity, 
      label: t('navPerformance') 
    },
    { 
      to: '/settings', 
      icon: Settings, 
      label: t('navSettings') 
    }
  ], [t, pendingTodayCount]);

  // Four destinations plus a dedicated quick-start training action.
  const mobilePrimaryItems = useMemo(() => [
    { 
      to: '/today', 
      icon: House, 
      shortLabel: isRTL ? 'اليوم' : 'Today',
      badge: pendingTodayCount > 0 ? pendingTodayCount : undefined
    },
    { 
      to: '/plan', 
      icon: CalendarDays, 
      shortLabel: isRTL ? 'الخطة' : 'Plan' 
    },
    { 
      to: '/routines', 
      icon: Dumbbell, 
      shortLabel: isRTL ? 'ابدأ' : 'Train',
      isLog: true
    },
    { 
      to: '/nutrition', 
      icon: Utensils, 
      shortLabel: isRTL ? 'التغذية' : 'Meals' 
    }
  ], [isRTL, pendingTodayCount]);

  // Mobile "More" Sheet Items
  const moreSheetItems = useMemo(() => [
    {
      to: '/routines',
      icon: Dumbbell,
      title: t('navRoutines'),
      desc: isRTL ? 'اختر بنية تدريب وجدولها للأسبوع' : 'Choose a training structure and schedule it'
    },
    {
      to: '/performance',
      icon: Activity,
      title: t('navPerformance'),
      desc: isRTL ? 'تحليلات القوة والأوزان والتقدم' : 'Strength records, volume & progression'
    },
    {
      to: '/settings',
      icon: Settings,
      title: t('navSettings'),
      desc: isRTL ? 'تخصيص التنبيهات، المظهر، والنسخ الاحتياطي' : 'Audio, haptics, theme & backup'
    }
  ], [t, isRTL]);

  // Keep secondary destinations visibly grouped under More while browsing them.
  const isMoreActive = useMemo(() => {
    return ['/routines', '/performance', '/settings'].some(path => location.pathname.startsWith(path));
  }, [location.pathname]);

  // Determine which icon to display on the 5th mobile tab
  const activeMoreIcon = useMemo(() => {
    if (location.pathname.startsWith('/routines')) return Dumbbell;
    if (location.pathname.startsWith('/performance')) return Activity;
    if (location.pathname.startsWith('/settings')) return Settings;
    return LayoutGrid;
  }, [location.pathname]);

  const activeMoreLabel = useMemo(() => {
    if (location.pathname.startsWith('/routines')) return isRTL ? 'الروتينات' : 'Routines';
    if (location.pathname.startsWith('/performance')) return isRTL ? 'الأداء' : 'Stats';
    if (location.pathname.startsWith('/settings')) return isRTL ? 'الضبط' : 'Settings';
    return isRTL ? 'المزيد' : 'More';
  }, [location.pathname, isRTL]);

  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    gymAudio.triggerSubtleHaptic([20]);
  };

  const selectTheme = async (themeId: string) => {
    await setTheme(themeId as any);
    setIsThemePopoverOpen(false);
    gymAudio.triggerSubtleHaptic([25]);
  };

  const handleNavTouch = () => {
    gymAudio.triggerSubtleHaptic([18]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const userInitial = (data?.user?.name || data?.user?.email || 'A').charAt(0).toUpperCase();
  const isFriday = new Date().getDay() === 5;

  const handleQuickWorkoutAdd = async (draft: Partial<WorkoutSession>) => {
    const session = draft as WorkoutSession;
    await saveSession(session);
    setIsQuickWorkoutOpen(false);
    navigate(`/session/${session.id}`);
  };

  return (
    <>
      {/* 1. Mobile Top Floating Glass Header (Visible only on mobile <= 768px) */}
      <header className="mobile-top-bar">
        {/* Brand with optional live workout pulse gem */}
        <motion.div 
          className="mobile-top-brand"
          onClick={() => {
            handleNavTouch();
            navigate('/today');
          }}
          whileTap={{ scale: 0.94 }}
        >
          <div className="brand-logo-gem">
            <Dumbbell className="brand-icon" size={17} />
            {activeTodaySession && <span className="brand-live-dot-ping" />}
          </div>
          <span className="mobile-brand-title">
            FORMA
            {!activeTodaySession && <span className="mobile-brand-badge">PRO</span>}
          </span>
        </motion.div>

        {/* Center: Ultra-Compact Live Badge if workout is active, otherwise training streak */}
        <div className="mobile-top-center">
          {activeTodaySession ? (
            <motion.div
              className="mobile-live-workout-pill compact"
              onClick={() => {
                handleNavTouch();
                navigate(`/session/${activeTodaySession.id}`);
              }}
              whileTap={{ scale: 0.94 }}
              title={activeTodaySession.title ? `${t('tapToResume')}: ${activeTodaySession.title}` : t('tapToResume')}
            >
              <span className="live-pulse-dot" />
              <Play size={10} fill="currentColor" />
              <span className="live-pill-text">{isRTL ? 'مباشر' : 'LIVE'}</span>
            </motion.div>
          ) : streakDays > 0 ? (
            <motion.button
              type="button"
              className="mobile-top-streak"
              onClick={() => {
                handleNavTouch();
                navigate('/performance');
              }}
              whileTap={{ scale: 0.94 }}
            >
              <Flame size={14} className="streak-icon" />
              <span>{streakDays}{isRTL ? 'ي' : 'd'}</span>
            </motion.button>
          ) : null}
        </div>

        {/* Right Actions: Theme + Language + Profile + Quick Utilities */}
        <div className="mobile-top-actions">

          {/* Quick Theme Toggle */}
          <motion.button
            type="button"
            className="mobile-top-btn"
            onClick={() => {
              handleNavTouch();
              setIsThemePopoverOpen(prev => !prev);
            }}
            whileTap={{ scale: 0.92 }}
            title={t('themesPaletteTitle')}
          >
            <Palette size={16} />
          </motion.button>

          {/* Quick Language */}
          <motion.button
            type="button"
            className="mobile-top-btn"
            onClick={toggleLanguage}
            whileTap={{ scale: 0.92 }}
            title={language === 'ar' ? 'English' : 'العربية'}
          >
            <Globe size={16} />
          </motion.button>

          {/* Avatar */}
          <motion.div
            className="mobile-top-avatar"
            onClick={() => {
              handleNavTouch();
              navigate('/settings');
            }}
            whileTap={{ scale: 0.92 }}
          >
            {data?.user?.pfp ? (
              <img src={data.user.pfp} alt="Profile" className="avatar-img" />
            ) : (
              <span>{userInitial}</span>
            )}
            <span className="online-beacon" />
          </motion.div>
        </div>
      </header>

      {/* 2. Main Navigation Bar (Desktop top floating bar & Mobile bottom island) */}
      <header className={`modern-nav-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
        <nav 
          ref={navRef}
          className={`modern-navbar ${isScrolled ? 'is-scrolled' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Interactive Magnetic Cursor Spotlight (Desktop) */}
          {mousePos && (
            <div
              className="navbar-magnetic-spotlight"
              style={{
                background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.14), transparent 75%)`
              }}
            />
          )}

          {/* Desktop Brand / Logo Section */}
          <motion.div 
            className="modern-nav-brand desktop-only-nav"
            onClick={() => navigate('/today')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={navSpring}
          >
            <div className="brand-logo-gem">
              <Dumbbell className="brand-icon" size={18} />
              <div className="brand-glow-halo" />
            </div>
            <div className="brand-text-col">
              <div className="brand-title-row">
                <span className="brand-name">FORMA</span>
                <span className="brand-badge">PRO</span>
              </div>
            </div>
          </motion.div>

          {/* Desktop Links (All 7 Tabs) */}
          <div className="modern-nav-links desktop-only-nav">
            {desktopNavItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavTouch}
                  onMouseEnter={() => prefetchRoute(item.to.replace('/', ''))}
                  onTouchStart={() => prefetchRoute(item.to.replace('/', ''))}
                  className={`modern-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="modern-nav-active-pill"
                      className="modern-nav-active-bg"
                      transition={navSpring}
                    >
                      <div className="active-top-beam" />
                    </motion.div>
                  )}

                  <motion.div 
                    className="nav-icon-wrap"
                    whileHover={{ scale: 1.14, rotate: isActive ? 0 : 5 }}
                    whileTap={{ scale: 0.88 }}
                    transition={navSpring}
                  >
                    <item.icon size={17} className="nav-icon" />

                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="nav-icon-badge" title={`${item.badge} uncompleted sessions`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.div>

                  <span className="nav-label">{item.label}</span>

                  {isActive && (
                    <motion.span 
                      layoutId="nav-active-dot" 
                      className="nav-active-dot" 
                      transition={navSpring} 
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Links (5 Comfortable, Thumb-Friendly Tabs) */}
          <div className="modern-nav-links mobile-only-nav">
            {mobilePrimaryItems.map(item => {
              const isActive = item.isLog
                ? location.pathname.startsWith('/session/')
                : location.pathname.startsWith(item.to);
              const itemClassName = `modern-nav-item ${item.isLog ? 'nav-train-action' : ''} ${isActive ? 'is-active' : ''}`;
              const itemContent = (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="modern-nav-mobile-active-pill"
                      className="modern-nav-mobile-active-bg"
                      transition={navSpring}
                    />
                  )}
                  <motion.div
                    className="nav-icon-wrap"
                    whileTap={{ scale: 0.88 }}
                    transition={navSpring}
                  >
                    <item.icon
                      size={22}
                      strokeWidth={isActive || item.isLog ? 2 : 1.75}
                      className="nav-icon"
                      aria-hidden="true"
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="nav-icon-badge">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </motion.div>
                  <span className="nav-short-label">{item.shortLabel}</span>
                  <span className={`nav-active-dot ${isActive ? 'is-visible' : ''}`} />
                </>
              );

              if (item.isLog) {
                return (
                  <button
                    key={item.to}
                    type="button"
                    onMouseEnter={() => prefetchRoute('routines')}
                    onTouchStart={() => prefetchRoute('routines')}
                    onClick={() => {
                      handleNavTouch();
                      if (activeTodaySession) navigate(`/session/${activeTodaySession.id}`);
                      else setIsLogSheetOpen(true);
                    }}
                    className={itemClassName}
                    aria-label={activeTodaySession
                      ? (isRTL ? 'متابعة التدريب' : 'Resume training')
                      : (isRTL ? 'بدء تدريب' : 'Start a workout')}
                    aria-pressed={isActive}
                  >
                    {itemContent}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onMouseEnter={() => prefetchRoute(item.to.replace('/', ''))}
                  onTouchStart={() => prefetchRoute(item.to.replace('/', ''))}
                  onClick={handleNavTouch}
                  className={itemClassName}
                  aria-label={item.shortLabel}
                >
                  {itemContent}
                </NavLink>
              );
            })}

            {/* 5th Tab: "More" Action Button */}
            <button
              type="button"
              onClick={() => {
                handleNavTouch();
                setIsMoreSheetOpen(prev => !prev);
              }}
              className={`modern-nav-item ${isMoreActive ? 'is-active' : ''}`}
              aria-label={t('navMore')}
              aria-pressed={isMoreActive}
            >
              {isMoreActive && (
                <motion.div
                  layoutId="modern-nav-mobile-active-pill"
                  className="modern-nav-mobile-active-bg"
                  transition={navSpring}
                />
              )}
              <motion.div
                className="nav-icon-wrap"
                whileTap={{ scale: 0.88 }}
                transition={navSpring}
              >
                {(() => {
                  const Icon = activeMoreIcon;
                  return <Icon size={22} strokeWidth={isMoreActive ? 2 : 1.75} className="nav-icon" aria-hidden="true" />;
                })()}
              </motion.div>
              <span className="nav-short-label">{activeMoreLabel}</span>
              <span className={`nav-active-dot ${isMoreActive ? 'is-visible' : ''}`} />
            </button>
          </div>

          {/* Desktop Right Quick Actions */}
          <div className="modern-nav-actions desktop-only-nav">
            {/* Live Workout Badge (Desktop) */}
            {activeTodaySession && (
              <NavLink
                to={`/session/${activeTodaySession.id}`}
                className="live-workout-nav-pill"
                title={activeTodaySession.title ? `${t('tapToResume')}: ${activeTodaySession.title}` : t('tapToResume')}
              >
                <span className="live-pulse-dot" />
                <Play size={11} fill="currentColor" />
                <span className="live-workout-title-truncate">{activeTodaySession.title || t('activeWorkoutLive')}</span>
              </NavLink>
            )}

            {/* Streak Chip */}
            {streakDays > 0 && (
              <motion.button
                type="button"
                className="nav-streak-pill"
                onClick={() => navigate('/performance')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                title={isRTL ? `${streakDays} أيام تدريب متتالية!` : `${streakDays} Day Training Streak!`}
              >
                <Flame size={14} className="streak-icon" />
                <span>{streakDays}{isRTL ? 'ي' : 'd'}</span>
              </motion.button>
            )}

            {/* 8-Theme Popover Selector Button */}
            <div className="nav-theme-container" ref={themeContainerRef}>
              <motion.button
                type="button"
                className="nav-action-pill theme-cycler"
                onClick={() => setIsThemePopoverOpen(prev => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                title={t('themesPaletteTitle')}
              >
                <Palette size={14} className="action-icon" />
                <span className="theme-dot-indicator" data-theme-indicator={theme} />
              </motion.button>
            </div>

            {/* Quick Language Switcher */}
            <motion.button
              type="button"
              className="nav-action-pill"
              onClick={toggleLanguage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe size={14} className="action-icon" />
              <span className="lang-text">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </motion.button>

            {/* Profile Avatar Pill */}
            <motion.div
              className="nav-profile-pill"
              onClick={() => navigate('/settings')}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              title={t('navSettings')}
            >
              <div className="avatar-disc">
                {data?.user?.pfp ? (
                  <img src={data.user.pfp} alt="Profile" className="avatar-img" />
                ) : (
                  <span className="avatar-letter">{userInitial}</span>
                )}
                <span className="online-beacon" />
              </div>
            </motion.div>
          </div>
        </nav>
      </header>

      {/* 3. 8-Theme Popover Palette (Desktop & Mobile) */}
      <AnimatePresence>
        {isThemePopoverOpen && (
          <>
            <motion.div
              className="theme-popover-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsThemePopoverOpen(false)}
            />
            <motion.div
              className="theme-popover-menu"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.16 }}
            >
              <div className="theme-popover-header">
                <span className="theme-popover-title">{t('themesPaletteTitle')}</span>
                <button
                  type="button"
                  className="theme-popover-close-btn"
                  onClick={() => setIsThemePopoverOpen(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="theme-popover-grid">
                {THEMES.map(th => {
                  const isSelected = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      className={`theme-popover-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => selectTheme(th.id)}
                    >
                      <span 
                        className="theme-preview-dot" 
                        style={{ backgroundColor: th.color }} 
                      />
                      <span>{th.name}</span>
                      {isSelected && <Check size={13} style={{ marginInlineStart: 'auto' }} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MobileActionSheet
        open={isLogSheetOpen}
        title={isFriday ? (isRTL ? 'عطلة أسبوعية' : 'Weekly off-day') : (isRTL ? 'بدء التسجيل' : 'Start logging')}
        onClose={() => setIsLogSheetOpen(false)}
      >
        <div className="mobile-log-actions">
          {isFriday ? (
            <p>{isRTL ? 'الجيم مغلق اليوم الجمعة. يمكنك استكشاف الروتينات أو مراجعة خطة الأسبوع.' : 'The gym is closed today (Friday). Explore routines or review your training week.'}</p>
          ) : (
            <p>{isRTL ? 'ابدأ جلسة سريعة أو اختر روتيناً محفوظاً.' : 'Start a quick workout or choose a saved routine.'}</p>
          )}
          {!isFriday && (
            <button type="button" className="forma-primary-button" onClick={() => { setIsLogSheetOpen(false); setIsQuickWorkoutOpen(true); }}>
              <Dumbbell width={17} height={17} />
              <span>{isRTL ? 'تمرين سريع' : 'Quick workout'}</span>
            </button>
          )}
          <button type="button" className="forma-quiet-button" onClick={() => { setIsLogSheetOpen(false); navigate('/routines'); }}>
            <Layers width={17} height={17} />
            <span>{isRTL ? 'استكشاف الروتينات' : 'Browse routines'}</span>
          </button>
          <button type="button" className="forma-quiet-button" onClick={() => { setIsLogSheetOpen(false); navigate('/plan'); }}>
            <CalendarDays width={17} height={17} />
            <span>{isRTL ? 'عرض الخطة الأسبوعية' : 'View weekly plan'}</span>
          </button>
        </div>
      </MobileActionSheet>
      <QuickWorkoutModal
        isOpen={isQuickWorkoutOpen}
        onClose={() => setIsQuickWorkoutOpen(false)}
        onAdd={handleQuickWorkoutAdd}
        weightUnit={data?.settings?.weightUnit || 'kg'}
        restSeconds={data?.settings?.restTimerSeconds || 90}
      />

      {/* 4. Mobile "More" Slide-up Bottom Sheet */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <>
            <motion.div
              className="more-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
            />
            <motion.div
              className="more-sheet-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={sheetSpring}
              drag="y"
              dragControls={sheetDragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.28 }}
              dragListener={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 96 || info.velocity.y > 650) {
                  setIsMoreSheetOpen(false);
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label={t('navMore')}
            >
              <div
                className="more-sheet-handle"
                role="presentation"
                aria-label={isRTL ? 'اسحب للأسفل للإغلاق' : 'Drag down to close'}
                onPointerDown={(event) => sheetDragControls.start(event)}
              />

              <div className="more-sheet-title-row">
                <span className="more-sheet-title">{t('navMore')}</span>
                <button
                  type="button"
                  className="more-sheet-close-btn"
                  onClick={() => setIsMoreSheetOpen(false)}
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="more-sheet-grid">
                {moreSheetItems.map(item => {
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        handleNavTouch();
                        setIsMoreSheetOpen(false);
                      }}
                      className={`more-sheet-item ${isActive ? 'is-active' : ''}`}
                    >
                      <div className="more-sheet-item-icon">
                        <item.icon size={22} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>{item.title}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {item.desc}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </NavLink>
                  );
                })}
              </div>

              {/* Quick Actions in Footer */}
              <div className="more-sheet-footer-actions">
                <button
                  type="button"
                  className="more-sheet-footer-btn"
                  onClick={() => {
                    handleNavTouch();
                    setIsThemePopoverOpen(true);
                    setIsMoreSheetOpen(false);
                  }}
                >
                  <Palette size={16} />
                  <span>{t('themesPaletteTitle')}</span>
                </button>

                <button
                  type="button"
                  className="more-sheet-footer-btn"
                  onClick={toggleLanguage}
                >
                  <Globe size={16} />
                  <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
