import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from './app/AppShell';
import { APP_ROUTES } from './app/routes';
import { useData } from './hooks/useData';
import { useTranslation } from './lib/i18n';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { checkAndTriggerWorkoutReminder } from './lib/notifications';
import { ToastViewport } from './components/ToastViewport';
import { DynamicLiveWorkoutBar } from './components/DynamicLiveWorkoutBar';
import { GlobalCardioBar } from './components/GlobalCardioBar';
import { isUserAdmin } from './lib/adminAuth';

// Lazy loaded views with automatic retry and cache bust on new deployments
function lazyWithRetry(
  factory: () => Promise<any>,
  name?: string
) {
  return lazy(async () => {
    try {
      const module = await factory();
      return name ? { default: module[name] } : (module.default ? module : { default: module });
    } catch (error: any) {
      const isChunkError = 
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Failed to fetch') ||
        error?.name === 'ChunkLoadError';

      const hasRefreshed = sessionStorage.getItem('chunk_has_refreshed');

      if (isChunkError && !hasRefreshed) {
        sessionStorage.setItem('chunk_has_refreshed', 'true');
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch {}
        }
        window.location.reload();
        return new Promise(() => {}); // wait for reload
      }

      throw error;
    }
  });
}

const TodayView = lazyWithRetry(() => import('./views/TodayView'), 'TodayView');
const CalendarView = lazyWithRetry(() => import('./views/CalendarView'), 'CalendarView');
const RoutinesView = lazyWithRetry(() => import('./views/RoutinesView'), 'RoutinesView');
const NutritionView = lazyWithRetry(() => import('./views/NutritionView'), 'NutritionView');
const SessionDetailView = lazyWithRetry(() => import('./views/SessionDetailView'), 'SessionDetailView');
const SettingsView = lazyWithRetry(() => import('./views/SettingsView'), 'SettingsView');
const PerformanceHubView = lazyWithRetry(() => import('./views/PerformanceHubView'), 'PerformanceHubView');
const LoginView = lazyWithRetry(() => import('./views/LoginView'), 'LoginView');
const AdminDashboard = lazyWithRetry(() => import('./views/AdminDashboard'), 'AdminDashboard');
const AIAssistant = lazyWithRetry(() => import('./components/AIAssistant'), 'AIAssistant');
const OnboardingTour = lazyWithRetry(() => import('./components/OnboardingTour'), 'OnboardingTour');

import { RouteTransition } from './components/layout/RouteTransition';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { useScrollRestoration } from './hooks/useScrollRestoration';

export const prefetchRoute = (route: string) => {
  switch (route) {
    case 'today':
      import('./views/TodayView');
      break;
    case 'plan':
    case 'calendar':
      import('./views/CalendarView');
      break;
    case 'session':
      import('./views/SessionDetailView');
      break;
    case 'routines':
      import('./views/RoutinesView');
      break;
    case 'nutrition':
      import('./views/NutritionView');
      break;
    case 'report':
    case 'performance':
      import('./views/PerformanceHubView');
      break;
    case 'settings':
      import('./views/SettingsView');
      break;
    default:
      break;
  }
};

const preloadAllAppRoutes = () => {
  if (typeof window === 'undefined') return;
  const load = () => {
    import('./views/CalendarView');
    import('./views/RoutinesView');
    import('./views/NutritionView');
    import('./views/PerformanceHubView');
    import('./views/SettingsView');
    import('./views/SessionDetailView');
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(load, { timeout: 2500 });
  } else {
    setTimeout(load, 1500);
  }
};

function GlobalLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center justify-center gap-4">
        <Dumbbell className="w-10 h-10 animate-bounce" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>{t('loading')}</span>
      </div>
    </div>
  );
}

function App() {
  const { data, loading, updateSettings, saveSession } = useData();
  const { isRTL } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [workoutReminderBanner, setWorkoutReminderBanner] = useState<{ title: string; message: string } | null>(null);

  // Maintain smooth scroll restoration across tabs with zero layout jump
  useScrollRestoration('.content-area');

  useEffect(() => {
    preloadAllAppRoutes();
    sessionStorage.removeItem('chunk_has_refreshed');
    document.documentElement.setAttribute('data-density', data?.settings?.density || 'comfortable');
    document.documentElement.setAttribute('data-motion', data?.settings?.motion || 'full');
  }, [data?.settings?.density, data?.settings?.motion]);

  useEffect(() => {
    if (!data?.user?.email) return;
    const tourKey = `forma_onboarding_complete_${data.user.email}`;
    const legacyTourKey = `mygym_onboarding_complete_${data.user.email}`;
    const completed = localStorage.getItem(tourKey) === 'true' || localStorage.getItem(legacyTourKey) === 'true';
    setShowOnboarding(!completed);
  }, [data?.user?.email]);

  // Workout Reminder periodic checker (runs every 30s)
  useEffect(() => {
    if (!data?.settings) return;
    const checkReminder = () => {
      const res = checkAndTriggerWorkoutReminder(
        data.settings,
        data.sessions || [],
        data.history || [],
        isRTL
      );
      if (res && res.triggered) {
        setWorkoutReminderBanner({ title: res.title, message: res.message });
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [data?.settings, data?.sessions, data?.history, isRTL]);


  const handleLogin = async (user?: { email: string, name: string; isAdmin?: boolean }) => {
    const isAdmin = Boolean(user?.isAdmin || isUserAdmin(user?.email));
    if (data) {
      await updateSettings(
        data.settings,
        user || { email: 'guest@example.com', name: 'Guest' }
      );
    }
    
    // Route to admin dashboard if admin credentials used
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/today');
    }
  };

  const startHomeWorkout = async () => {
    const id = `home-${Date.now()}`;
    await saveSession({
      id, title: isRTL ? 'تمرين منزلي سريع' : '10-Minute Home Workout', date: new Date().toISOString(),
      duration: 10, type: 'bodyweight', notes: isRTL ? 'تمرين منزلي مقترح من التذكير.' : 'Suggested by your flexible workout reminder.',
      isCompleted: false,
      exercises: [
        { id: `${id}-squats`, name: 'Bodyweight Squat', targetMuscle: 'Legs', restTime: 30, notes: '', sets: [{ id: `${id}-s1`, weight: 0, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false }, { id: `${id}-s2`, weight: 0, repsTarget: 15, repsActual: 0, unit: 'kg', isCompleted: false }] },
        { id: `${id}-pushups`, name: 'Push-ups', targetMuscle: 'Chest', restTime: 30, notes: '', sets: [{ id: `${id}-p1`, weight: 0, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false }, { id: `${id}-p2`, weight: 0, repsTarget: 10, repsActual: 0, unit: 'kg', isCompleted: false }] },
        { id: `${id}-plank`, name: 'Plank', targetMuscle: 'Core', restTime: 30, notes: '', duration: 1, sets: [{ id: `${id}-pl1`, weight: 0, repsTarget: 1, repsActual: 0, unit: 'kg', isCompleted: false }] }
      ]
    });
    setWorkoutReminderBanner(null);
    navigate(`/session/${id}`);
  };


  const isInSession = location.pathname.startsWith('/session/');
  const isAdminRoute = location.pathname.startsWith('/admin');

  const hasActiveSession = useMemo(() => {
    if (isInSession || !data?.sessions) return false;
    const today = new Date();
    return data.sessions.some(s => {
      const d = new Date(s.date);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate() &&
             !s.isCompleted;
    });
  }, [isInSession, data?.sessions]);

  if (loading) return <PageSkeleton />;

  if (!data?.user) {
    return (
      <Suspense fallback={<GlobalLoading />}>
        <LoginView onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <AppShell isInSession={isInSession} hasActiveSession={hasActiveSession} isAdminRoute={isAdminRoute}>
      <Suspense fallback={<PageSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path={APP_ROUTES.home} element={<Navigate to={APP_ROUTES.today} replace />} />
            <Route path={APP_ROUTES.today} element={<RouteTransition><TodayView /></RouteTransition>} />
            <Route path={APP_ROUTES.plan} element={<RouteTransition><CalendarView /></RouteTransition>} />
            <Route path={APP_ROUTES.calendar} element={<Navigate to={APP_ROUTES.plan} replace />} />
            <Route path={APP_ROUTES.session} element={<RouteTransition><SessionDetailView /></RouteTransition>} />
            <Route path={APP_ROUTES.routines} element={<RouteTransition><RoutinesView /></RouteTransition>} />
            <Route path={APP_ROUTES.nutrition} element={<RouteTransition><NutritionView /></RouteTransition>} />
            <Route path={APP_ROUTES.food} element={<Navigate to={APP_ROUTES.nutrition} replace />} />
            <Route path={APP_ROUTES.performance} element={<RouteTransition><PerformanceHubView /></RouteTransition>} />
            <Route path="/history" element={<Navigate to={APP_ROUTES.plan} replace />} />
            <Route path={APP_ROUTES.settings} element={<RouteTransition><SettingsView /></RouteTransition>} />
            {/* Admin Dashboard Route */}
            <Route
              path={APP_ROUTES.adminDashboard}
              element={<RouteTransition><AdminDashboard onLogout={async () => { await navigate('/today'); }} /></RouteTransition>}
            />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <NetworkStatusIndicator />
      <ToastViewport />
      {!isAdminRoute && (
        <>
          <InstallAppPrompt />
          {!isInSession && (
            <>
              <DynamicLiveWorkoutBar />
              <GlobalCardioBar />
            </>
          )}
          {!isInSession && (
            <Suspense fallback={null}>
              <AIAssistant />
            </Suspense>
          )}
          {showOnboarding && (
            <Suspense fallback={null}>
              <OnboardingTour onFinish={() => {
                if (data?.user?.email) {
                  localStorage.setItem(`forma_onboarding_complete_${data.user.email}`, 'true');
                  localStorage.setItem(`mygym_onboarding_complete_${data.user.email}`, 'true');
                }
                setShowOnboarding(false);
              }} />
            </Suspense>
          )}
        </>
      )}

      {/* Workout Reminder Floating Toast / Banner (Suppressed during active sessions) */}
      <AnimatePresence>
        {!isInSession && workoutReminderBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            style={{
              position: 'fixed',
              top: 'calc(16px + max(0px, env(safe-area-inset-top, 0px)))',
              left: 0,
              right: 0,
              marginInline: 'auto',
              zIndex: 9999,
              width: 'calc(100% - 32px)',
              maxWidth: '480px',
              padding: '1rem 1.25rem',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.96), rgba(15, 23, 42, 0.98))',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(234, 179, 8, 0.2)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                padding: '0.5rem',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#eab308',
                display: 'flex'
              }}>
                <Dumbbell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {workoutReminderBanner.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {workoutReminderBanner.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => {
                  startHomeWorkout().catch(() => setWorkoutReminderBanner(null));
                }}
              >
                {isRTL ? 'ابدأ تمرين 10 دقائق' : 'Start 10-min workout'}
              </button>
              <button
                type="button"
                className="btn-icon btn-ghost"
                style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
                onClick={() => setWorkoutReminderBanner(null)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

export default App;
