import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Dumbbell, History, Settings, Moon, Sun, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from './hooks/useData';
import { AIAssistant } from './components/AIAssistant';
import { LoginView } from './views/LoginView';

// Lazy loaded views
const TodayView = lazy(() => import('./views/TodayView').then(m => ({ default: m.TodayView })));
const CalendarView = lazy(() => import('./views/CalendarView').then(m => ({ default: m.CalendarView })));
const RoutinesView = lazy(() => import('./views/RoutinesView').then(m => ({ default: m.RoutinesView })));
const HistoryView = lazy(() => import('./views/HistoryView').then(m => ({ default: m.HistoryView })));
const SessionDetailView = lazy(() => import('./views/SessionDetailView').then(m => ({ default: m.SessionDetailView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

function GlobalLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center justify-center gap-4">
        <Dumbbell className="w-10 h-10 animate-bounce" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
      </div>
    </div>
  );
}

function App() {
  const { data, loading, updateData } = useData();
  const [theme, setTheme] = useState<string>('dark');
  const location = useLocation();
  const navigate = useNavigate();

  // Sync theme
  useEffect(() => {
    if (data?.settings?.theme) {
      setTheme(data.settings.theme);
    }
  }, [data?.settings?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    if (!data) return;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await updateData({
      ...data,
      settings: { ...data.settings, theme: newTheme }
    });
  };

  const handleLogin = async (user?: { email: string, name: string }) => {
    if (data) {
      await updateData({
        ...data,
        user: user || { email: 'guest@example.com', name: 'Guest' }
      });
    }
    navigate('/today');
  };


  const navItems = [
    { to: '/today', icon: LayoutDashboard, label: 'Today' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/routines', icon: Dumbbell, label: 'Routines' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' }
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
          <div className="sidebar-header" onClick={() => navigate('/today')} style={{ cursor: 'pointer' }}>
            <div className="logo-box">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span>MyGym</span>
          </div>
          
          <div className="sidebar-nav" style={{ position: 'relative', justifyContent: 'center' }}>
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{ position: 'relative', zIndex: 1, padding: '0.5rem 1.5rem' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '2rem',
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
          <div className="theme-toggle-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button 
              className="btn btn-icon btn-ghost" 
              onClick={toggleTheme}
              title="Toggle Dark Mode"
              style={{ border: '1px solid var(--border-color)', borderRadius: '50%' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        <div className="content-area" style={{ position: 'relative', overflow: 'hidden' }}>
          <Suspense fallback={<GlobalLoading />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname.split('/')[1] || '/'}>
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route path="/today" element={<TodayView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/session/:id" element={<SessionDetailView />} />
                <Route path="/routines" element={<RoutinesView />} />
                <Route path="/history" element={<HistoryView />} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
}

export default App;
