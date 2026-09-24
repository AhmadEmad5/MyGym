import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Dumbbell, History, Settings, LayoutDashboard, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from './hooks/useData';
import { useTranslation } from './lib/i18n';
import { AIAssistant } from './components/AIAssistant';
import { LoginView } from './views/LoginView';
import { OnboardingTour } from './components/OnboardingTour';

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
const HistoryView = lazyWithRetry(() => import('./views/HistoryView'), 'HistoryView');
const SessionDetailView = lazyWithRetry(() => import('./views/SessionDetailView'), 'SessionDetailView');
const SettingsView = lazyWithRetry(() => import('./views/SettingsView'), 'SettingsView');

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
  const { data, loading, updateSettings } = useData();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('chunk_has_refreshed');
    document.documentElement.setAttribute('data-density', data?.settings?.density || 'comfortable');
    document.documentElement.setAttribute('data-motion', data?.settings?.motion || 'full');
  }, [data?.settings?.density, data?.settings?.motion]);

  useEffect(() => {
    if (!data?.user) return;
    const tourKey = `mygym_onboarding_complete_${data.user.email}`;
    setShowOnboarding(localStorage.getItem(tourKey) !== 'true');
  }, [data?.user?.email]);


  const handleLogin = async (user?: { email: string, name: string }) => {
    if (data) {
      await updateSettings(
        data.settings, 
        user || { email: 'guest@example.com', name: 'Guest' }
      );
    }
    navigate('/today');
  };


  const navItems = [
    { to: '/today', icon: LayoutDashboard, label: t('navToday') },
    { to: '/calendar', icon: CalendarDays, label: t('navCalendar') },
    { to: '/routines', icon: Dumbbell, label: t('navRoutines') },
    { to: '/nutrition', icon: Utensils, label: t('navNutrition') },
    { to: '/history', icon: History, label: t('navHistory') },
    { to: '/settings', icon: Settings, label: t('navSettings') }
  ];

  if (loading) return <GlobalLoading />;

  if (!data?.user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <div className="sidebar-wrapper">
        <nav className="sidebar">
          <motion.div className="sidebar-header" onClick={() => navigate('/today')} whileTap={{ scale: 0.97 }} style={{ cursor: 'pointer' }}>
            <div className="logo-box">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span>MyGym</span>
          </motion.div>
          
          <div className="sidebar-nav" style={{ position: 'relative', justifyContent: 'center' }}>
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(67, 220, 255, 0.16), rgba(133, 92, 255, 0.12))',
                        border: '1px solid rgba(117, 224, 255, 0.2)',
                        borderRadius: '12px',
                        zIndex: -1
                      }}
                    />
                  )}
                  <item.icon className="w-4 h-4" style={{ color: isActive ? 'var(--text-primary)' : 'inherit' }} />
                  <span style={{ color: isActive ? 'var(--text-primary)' : 'inherit' }}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        <div className="content-area">
          <Suspense fallback={<GlobalLoading />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route path="/today" element={<TodayView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/session/:id" element={<SessionDetailView />} />
                <Route path="/routines" element={<RoutinesView />} />
                <Route path="/nutrition" element={<NutritionView />} />
                <Route path="/history" element={<HistoryView />} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      <AIAssistant />
      {showOnboarding && <OnboardingTour onFinish={() => {
        if (data?.user?.email) localStorage.setItem(`mygym_onboarding_complete_${data.user.email}`, 'true');
        setShowOnboarding(false);
      }} />}
    </div>
  );
}

export default App;
