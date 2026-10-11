import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AppShell } from './app/AppShell';
import { APP_ROUTES } from './app/routes';
import { useData } from './hooks/useData';
import { useTranslation } from './lib/i18n';
import { auth } from './lib/firebase';
import { GUEST_EMAIL } from './lib/guestIdentity';
import { useAdminStatus } from './lib/useAdminStatus';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { checkAndTriggerWorkoutReminder } from './lib/notifications';
import { ToastViewport } from './components/ToastViewport';
import { DynamicLiveWorkoutBar } from './components/DynamicLiveWorkoutBar';
import { GlobalCardioBar } from './components/GlobalCardioBar';

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

function GlobalLoading({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center justify-center gap-4">
        <Dumbbell className="w-10 h-10 animate-bounce" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>{label ?? t('loading')}</span>
      </div>
    </div>
  );
}

/**
 * Route guard for admin-only surfaces. The signed `admin` custom claim is the
 * real authority (firestore.rules `isAdmin()`); this keeps a non-admin from
 * rendering the admin shell at all, and waits for the claim before deciding.
 */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { isRTL } = useTranslation();
  const { user, isAdmin, refresh } = useAdminStatus();
  const [resolved, setResolved] = useState(() => !user);

  useEffect(() => {
    if (!user) {
      setResolved(true);
      return;
    }
    let active = true;
    setResolved(false);
    void refresh(true).finally(() => {
      if (active) setResolved(true);
    });
    return () => {
      active = false;
    };
  }, [user, refresh]);

  if (!resolved) {
    return <GlobalLoading />;
  }

  if (!isAdmin) {
    return <Navigate to={APP_ROUTES.today} replace state={{ denied: isRTL }} />;
  }

  return <>{children}</>;
}

function App() {
  const { data, loading, updateSettings, saveSession, signOutUser } = useData();
  const { isRTL, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [workoutReminderBanner, setWorkoutReminderBanner] = useState<{ title: string; message: string } | null>(null);
  /**
   * Signed-in account, tracked separately from `data.user`. `data.user` is
   * absent for a beat on first sign-in and on a failed profile read, so it
   * cannot be used to tell "nobody is signed in" from "the athlete is still
   * loading" — only the auth observer can.
   */
  const [authUser, setAuthUser] = useState<User | null>(() => auth?.currentUser ?? null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (firebaseUser) => setAuthUser(firebaseUser));
  }, []);

  // Single source of truth for `.content-area` scroll memory. Restoration is
  // applied by RouteTransition once the new route is actually mounted, so the
  // exit animation is never fought by a stale scrollTop write.
  useScrollRestoration('.content-area');

  useEffect(() => {
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

  // Auto-dismiss reminder banner after 15 seconds of inactivity
  useEffect(() => {
    if (!workoutReminderBanner) return;
    const timer = setTimeout(() => {
      setWorkoutReminderBanner(null);
    }, 15000);
    return () => clearTimeout(timer);
  }, [workoutReminderBanner]);


  const handleLogin = async (user?: { email: string, name: string; isAdmin?: boolean }) => {
    const isAdmin = user?.isAdmin === true;
    // The guest fallback is only ever valid for a truly unauthenticated
    // visitor; a signed-in athlete must keep their own identity.
    const guestProfile = authUser
      ? undefined
      : { email: GUEST_EMAIL, name: isRTL ? 'رياضي FORMA' : 'FORMA Athlete' };
    const targetUser = user ?? guestProfile;
    if (data && targetUser) {
      await updateSettings(data.settings, targetUser);
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
    /**
     * Signed in but the profile has not resolved yet (first sign-in, slow or
     * failed read). Showing the login screen here would offer "guest" actions
     * that would overwrite the real athlete's identity — wait it out instead.
     */
    if (authUser) return <GlobalLoading label={t('restoringSession')} />;

    return (
      <Suspense fallback={<GlobalLoading />}>
        <LoginView onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <>
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
            {/* Admin Dashboard Route (guarded by the signed admin custom claim) */}
            <Route
              path={APP_ROUTES.adminDashboard}
              element={(
                <RequireAdmin>
                  <RouteTransition>
                    <AdminDashboard onLogout={async () => { await signOutUser(); }} />
                  </RouteTransition>
                </RequireAdmin>
              )}
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

    </AppShell>

    {/* Workout Reminder Floating Toast / Banner (Placed outside AppShell to prevent scroller containment, positioned safely below navbar) */}
    <AnimatePresence>
      {!isInSession && workoutReminderBanner && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="forma-reminder-toast"
          role="alert"
          aria-live="polite"
        >
          <div className="forma-reminder-body">
            <div className="forma-reminder-icon-box" aria-hidden="true">
              <Dumbbell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="forma-reminder-text">
              <h4 className="forma-reminder-title">
                {workoutReminderBanner.title}
              </h4>
              <p className="forma-reminder-desc">
                {workoutReminderBanner.message}
              </p>
            </div>
          </div>
          <div className="forma-reminder-actions">
            <button
              type="button"
              className="btn btn-primary forma-reminder-btn"
              onClick={() => {
                startHomeWorkout().catch(() => setWorkoutReminderBanner(null));
              }}
            >
              {isRTL ? 'ابدأ تمرين 10 دقائق' : 'Start 10-min workout'}
            </button>
            <button
              type="button"
              className="forma-reminder-close"
              aria-label={isRTL ? 'إغلاق التذكير' : 'Dismiss reminder'}
              onClick={() => setWorkoutReminderBanner(null)}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}

export default App;
