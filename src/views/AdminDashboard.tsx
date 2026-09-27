import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  Users, 
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Search,
  Menu,
  X,
  RefreshCw,
  Flame,
  Calendar,
  Clock,
  Shield,
  Activity,
  Trophy,
  ChevronDown,
  CheckCircle2,
  Database,
  Download,
  ArrowUpDown,
  Zap,
  Layers,
  Scale
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../lib/i18n';
import { notify } from '../lib/feedback';
import { 
  loadAdminPlatformData, 
  exportAthletesToCSV,
  AthleteSummary, 
  AdminPlatformStats
} from '../lib/adminData';
import { ADMIN_CREDENTIALS } from '../lib/adminAuth';
import './AdminDashboard.css';

type AdminCategory = 'overview' | 'athletes' | 'workouts' | 'nutrition' | 'records' | 'settings';

export function AdminDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const navigate = useNavigate();
  const { isRTL, language, setLanguage } = useTranslation();

  const [activeCategory, setActiveCategory] = useState<AdminCategory>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Close sidebar on small screen resize or navigation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Data states
  const [platformStats, setPlatformStats] = useState<AdminPlatformStats | null>(null);
  const [athletes, setAthletes] = useState<AthleteSummary[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteSummary | null>(null);

  // Athlete Roster filters & sorting
  const [athleteFilterTab, setAthleteFilterTab] = useState<'all' | 'active' | 'elite' | 'rookie'>('all');
  const [athleteSortBy, setAthleteSortBy] = useState<'workouts' | 'tonnage' | 'recent' | 'name'>('workouts');

  // Workout feed filter
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<string>('all');

  // Fetch real live Firestore data
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { stats, athletes: loadedAthletes } = await loadAdminPlatformData();
      setPlatformStats(stats);
      setAthletes(loadedAthletes);
      if (isManual) {
        notify(isRTL ? 'تمت مزامنة البيانات الحية بنجاح ⚡' : 'Live telemetry synced from Firestore ⚡', 'success');
      }
    } catch (err) {
      console.error('Error loading admin platform data:', err);
      notify(isRTL ? 'تعذر جلب بعض البيانات من السيرفر.' : 'Failed to synchronize live data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered and sorted athletes
  const processedAthletes = useMemo(() => {
    let result = [...athletes];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.email.toLowerCase().includes(q) ||
        a.uid.toLowerCase().includes(q)
      );
    }

    // Category filter tab
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    if (athleteFilterTab === 'active') {
      result = result.filter(a => a.lastActive && new Date(a.lastActive).getTime() >= thirtyDaysAgo);
    } else if (athleteFilterTab === 'elite') {
      result = result.filter(a => a.tier === 'Elite' || a.tier === 'Pro');
    } else if (athleteFilterTab === 'rookie') {
      result = result.filter(a => a.tier === 'Rookie' || a.tier === 'Dedicated');
    }

    // Sorting
    result.sort((a, b) => {
      if (athleteSortBy === 'tonnage') return b.totalTonnage - a.totalTonnage;
      if (athleteSortBy === 'recent') {
        const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return dateB - dateA;
      }
      if (athleteSortBy === 'name') return a.name.localeCompare(b.name);
      return b.totalWorkouts - a.totalWorkouts;
    });

    return result;
  }, [athletes, searchQuery, athleteFilterTab, athleteSortBy]);

  const navSections = [
    {
      group: isRTL ? 'التحليلات والمباشر' : 'PULSE & TELEMETRY',
      items: [
        { id: 'overview' as AdminCategory, label: isRTL ? 'نظرة عامة تنفيذية' : 'Executive Pulse', icon: <LayoutDashboard size={18} /> },
        { id: 'records' as AdminCategory, label: isRTL ? 'لوحة الأرقام القياسية (PR)' : 'PRs & Strength Records', icon: <Trophy size={18} />, badge: platformStats?.globalPRs.length },
      ]
    },
    {
      group: isRTL ? 'إدارة الرياضيين' : 'ATHLETES & ROSTER',
      items: [
        { id: 'athletes' as AdminCategory, label: isRTL ? 'دليل الرياضيين' : 'Athletes Directory', icon: <Users size={18} />, badge: athletes.length },
        { id: 'workouts' as AdminCategory, label: isRTL ? 'سجل التمارين المكتملة' : 'Workout Intelligence', icon: <Dumbbell size={18} />, badge: platformStats?.totalWorkoutsCompleted },
      ]
    },
    {
      group: isRTL ? 'الصحة والأداء' : 'HEALTH & NUTRITION',
      items: [
        { id: 'nutrition' as AdminCategory, label: isRTL ? 'مركز التغذية والسعرات' : 'Nutrition & Macros Hub', icon: <Utensils size={18} />, badge: platformStats?.totalMealsLogged },
      ]
    },
    {
      group: isRTL ? 'النظام والأمان' : 'SYSTEM & GOVERNANCE',
      items: [
        { id: 'settings' as AdminCategory, label: isRTL ? 'إعدادات القاعدة والأمان' : 'Master DB & Security', icon: <SettingsIcon size={18} /> },
      ]
    }
  ];

  const mobileCategories = useMemo(() => [
    { id: 'overview' as AdminCategory, label: isRTL ? 'نظرة عامة' : 'Pulse', icon: <LayoutDashboard size={15} /> },
    { id: 'athletes' as AdminCategory, label: isRTL ? 'الرياضيين' : 'Athletes', icon: <Users size={15} />, badge: athletes.length },
    { id: 'workouts' as AdminCategory, label: isRTL ? 'التمارين' : 'Workouts', icon: <Dumbbell size={15} />, badge: platformStats?.totalWorkoutsCompleted },
    { id: 'nutrition' as AdminCategory, label: isRTL ? 'التغذية' : 'Nutrition', icon: <Utensils size={15} />, badge: platformStats?.totalMealsLogged },
    { id: 'records' as AdminCategory, label: isRTL ? 'الأرقام' : 'PRs', icon: <Trophy size={15} />, badge: platformStats?.globalPRs?.length },
    { id: 'settings' as AdminCategory, label: isRTL ? 'الأمان' : 'Security', icon: <SettingsIcon size={15} /> },
  ], [isRTL, athletes.length, platformStats?.totalWorkoutsCompleted, platformStats?.totalMealsLogged, platformStats?.globalPRs?.length]);

  return (
    <div className="admin-root" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
         SIDEBAR NAVIGATION
         ========================================================================= */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-wrapper">
            <div className="admin-brand-gem">
              <Shield size={20} />
            </div>
            {sidebarOpen && (
              <div className="admin-brand-text">
                <span className="admin-brand-title">FORMA</span>
                <span className="admin-brand-badge">PRO ADMIN</span>
              </div>
            )}
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="admin-nav-section-group">
              {sidebarOpen && (
                <div className="admin-nav-section-title">{section.group}</div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-item ${activeCategory === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(item.id);
                    setSelectedAthlete(null);
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={item.label}
                >
                  <div className="admin-nav-icon">{item.icon}</div>
                  {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
                  {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                    <span className="admin-nav-counter">{item.badge}</span>
                  )}
                  {sidebarOpen && activeCategory === item.id && (
                    <ChevronRight size={15} className="admin-nav-arrow" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Button 
            variant="cyan" 
            fullWidth 
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
              navigate('/today');
            }}
            leftIcon={<Dumbbell size={16} />}
            className="admin-switch-btn"
          >
            {sidebarOpen ? (isRTL ? 'تطبيق المتدرب' : 'Switch to Athlete View') : ''}
          </Button>
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
              onLogout();
            }}
            leftIcon={<LogOut size={16} />}
            className="admin-logout-btn"
          >
            {sidebarOpen ? (isRTL ? 'تسجيل الخروج' : 'Sign Out') : ''}
          </Button>
        </div>
      </aside>

      {/* =========================================================================
         MAIN APPLICATION CONTENT
         ========================================================================= */}
      <main className="admin-main">
        {/* Top Executive Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button 
              type="button"
              className="admin-icon-btn admin-toggle-sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="admin-live-badge">
              <span className="admin-live-dot" />
              <span>{isRTL ? 'قاعدة بيانات مباشرة (Firestore)' : 'Firestore Connected (Live)'}</span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="admin-topbar-center">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input 
                type="text"
                placeholder={isRTL ? 'بحث سريع عن الرياضيين، الجولات، المعرف...' : 'Search athletes, workouts, or UID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="admin-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* CSV Export Button */}
            <button 
              type="button"
              className="admin-header-action-btn"
              onClick={() => {
                exportAthletesToCSV(athletes);
                notify(isRTL ? 'تم تصدير ملف CSV بنجاح' : 'Athlete roster exported to CSV', 'success');
              }}
              title={isRTL ? 'تصدير البيانات CSV' : 'Export CSV'}
            >
              <Download size={15} />
              <span className="admin-btn-label">{isRTL ? 'تصدير' : 'Export'}</span>
            </button>

            {/* Sync Refresh Button */}
            <button 
              type="button" 
              className={`admin-icon-btn admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchData(true)}
              title={isRTL ? 'تحديث البيانات' : 'Refresh Live Data'}
              disabled={refreshing}
            >
              <RefreshCw size={16} />
            </button>

            {/* Language Switcher */}
            <button 
              type="button"
              className="admin-lang-pill"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Admin Profile */}
            <div className="admin-profile-chip">
              <div className="admin-profile-avatar">A</div>
              <div className="admin-profile-info">
                <span className="admin-profile-name">Ahmed</span>
                <span className="admin-profile-email">{ADMIN_CREDENTIALS.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Quick Category Bar */}
        <nav className="admin-mobile-category-bar" aria-label="Admin Sections">
          {mobileCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`admin-mobile-tab-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedAthlete(null);
              }}
            >
              <span className="admin-mobile-tab-icon">{cat.icon}</span>
              <span className="admin-mobile-tab-label">{cat.label}</span>
              {cat.badge !== undefined && cat.badge > 0 && (
                <span className="admin-mobile-tab-badge">{cat.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Dynamic Body */}
        <div className="admin-body">
          {loading ? (
            <div className="admin-loading-state">
              <div className="admin-spinner" />
              <p>{isRTL ? 'جاري الاتصال بقاعدة بيانات Firestore...' : 'Synchronizing live athlete telemetry...'}</p>
            </div>
          ) : (
            <>
              {activeCategory === 'overview' && (
                <ExecutivePulseView 
                  stats={platformStats} 
                  athletes={athletes} 
                  onSelectAthlete={(athlete) => {
                    setSelectedAthlete(athlete);
                    setActiveCategory('athletes');
                  }}
                  onViewAllAthletes={() => setActiveCategory('athletes')}
                  onViewAllWorkouts={() => setActiveCategory('workouts')}
                />
              )}

              {activeCategory === 'athletes' && (
                <AthletesDirectoryView 
                  athletes={processedAthletes}
                  totalCount={athletes.length}
                  filterTab={athleteFilterTab}
                  onFilterTabChange={setAthleteFilterTab}
                  sortBy={athleteSortBy}
                  onSortByChange={setAthleteSortBy}
                  onSelectAthlete={setSelectedAthlete}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                  onExportCSV={() => exportAthletesToCSV(processedAthletes)}
                />
              )}

              {activeCategory === 'workouts' && (
                <WorkoutIntelligenceView 
                  athletes={athletes}
                  typeFilter={workoutTypeFilter}
                  onTypeFilterChange={setWorkoutTypeFilter}
                  onSelectAthlete={(a) => {
                    setSelectedAthlete(a);
                    setActiveCategory('athletes');
                  }}
                />
              )}

              {activeCategory === 'nutrition' && (
                <NutritionHubView 
                  stats={platformStats}
                  athletes={athletes} 
                />
              )}

              {activeCategory === 'records' && (
                <StrengthLeaderboardView 
                  stats={platformStats}
                  athletes={athletes}
                  onSelectAthlete={(a) => {
                    setSelectedAthlete(a);
                    setActiveCategory('athletes');
                  }}
                />
              )}

              {activeCategory === 'settings' && (
                <SystemGovernanceView 
                  athletes={athletes}
                  stats={platformStats}
                  onRefresh={() => fetchData(true)} 
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* =========================================================================
         ATHLETE DOSSIER INSPECTION MODAL (EXPANDED WORKOUT HISTORY)
         ========================================================================= */}
      {selectedAthlete && (
        <AthleteDossierModal 
          athlete={selectedAthlete} 
          onClose={() => setSelectedAthlete(null)} 
        />
      )}
    </div>
  );
}

/* =========================================================================
   1. EXECUTIVE PULSE & OVERVIEW VIEW
   ========================================================================= */
function ExecutivePulseView({ 
  stats, 
  athletes,
  onSelectAthlete,
  onViewAllAthletes,
  onViewAllWorkouts
}: { 
  stats: AdminPlatformStats | null; 
  athletes: AthleteSummary[];
  onSelectAthlete: (athlete: AthleteSummary) => void;
  onViewAllAthletes: () => void;
  onViewAllWorkouts: () => void;
}) {
  const { isRTL } = useTranslation();

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Zap size={14} />
            <span>{isRTL ? 'لوحة القيادة التنفيذية' : 'EXECUTIVE TELEMETRY PULSE'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'مؤشرات الأداء العامة' : 'Platform Command Center'}</h1>
          <p className="admin-view-subtitle">
            {isRTL 
              ? 'مراقبة فورية لنشاط الرياضيين، الحجم التدريبي الإجمالي، واستهلاك الطاقة' 
              : 'Real-time telemetry, aggregate volume tonnage, and athlete training intensity'}
          </p>
        </div>
        <div className="admin-header-timestamp">
          <Clock size={13} />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* 6-Card High-Density KPI Grid */}
      <div className="admin-kpi-grid">
        {/* Total Athletes */}
        <div className="admin-kpi-card glow-cyan">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'إجمالي الرياضيين' : 'Total Athletes'}</span>
            <div className="admin-kpi-icon icon-cyan"><Users size={19} /></div>
          </div>
          <div className="admin-kpi-val">{stats?.totalAthletes || athletes.length}</div>
          <div className="admin-kpi-footer">
            <span className="badge-active">● {stats?.activeAthletes30d || 1} {isRTL ? 'نشط مؤخراً' : 'active (30d)'}</span>
          </div>
        </div>

        {/* Total Workouts Completed */}
        <div className="admin-kpi-card glow-lime">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'التمارين المنجزة' : 'Workouts Logged'}</span>
            <div className="admin-kpi-icon icon-lime"><Dumbbell size={19} /></div>
          </div>
          <div className="admin-kpi-val">{stats?.totalWorkoutsCompleted || 0}</div>
          <div className="admin-kpi-footer">
            <span className="text-secondary">{stats?.totalSessionsPlanned || 0} {isRTL ? 'جلسة مجدولة' : 'planned in schedule'}</span>
          </div>
        </div>

        {/* Total Tonnage Moved (Kg/Lb) */}
        <div className="admin-kpi-card glow-blue">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'الحجم التراكمي (الأوزان)' : 'Total Volume Moved'}</span>
            <div className="admin-kpi-icon icon-blue"><Layers size={19} /></div>
          </div>
          <div className="admin-kpi-val">
            {(stats?.totalTonnage || 0).toLocaleString()} <small className="unit">kg</small>
          </div>
          <div className="admin-kpi-footer">
            <span className="text-secondary">{isRTL ? 'مجموع التكرارات × الأوزان' : 'Aggregate set tonnage'}</span>
          </div>
        </div>

        {/* Calories Burned */}
        <div className="admin-kpi-card glow-orange">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'السعرات المستهلكة' : 'Energy Burned'}</span>
            <div className="admin-kpi-icon icon-orange"><Flame size={19} /></div>
          </div>
          <div className="admin-kpi-val">
            {(stats?.totalCaloriesBurned || 0).toLocaleString()} <small className="unit">kcal</small>
          </div>
          <div className="admin-kpi-footer">
            <span className="text-secondary">{isRTL ? 'إجمالي حرق التمارين' : 'Calorie expenditure'}</span>
          </div>
        </div>

        {/* Avg Workout Duration */}
        <div className="admin-kpi-card glow-yellow">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'متوسط مدة الجلسة' : 'Avg Workout Time'}</span>
            <div className="admin-kpi-icon icon-yellow"><Clock size={19} /></div>
          </div>
          <div className="admin-kpi-val">
            {stats?.avgWorkoutDuration || 45} <small className="unit">min</small>
          </div>
          <div className="admin-kpi-footer">
            <span className="text-secondary">{isRTL ? 'كثافة تدريبية قياسية' : 'Standard session length'}</span>
          </div>
        </div>

        {/* Total Meals Logged */}
        <div className="admin-kpi-card glow-purple">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'الوجبات المسجلة' : 'Nutrition Entries'}</span>
            <div className="admin-kpi-icon icon-purple"><Utensils size={19} /></div>
          </div>
          <div className="admin-kpi-val">{stats?.totalMealsLogged || 0}</div>
          <div className="admin-kpi-footer">
            <span className="text-secondary">{isRTL ? 'سجلات الماكروز الغذائية' : 'Diet logs tracked'}</span>
          </div>
        </div>
      </div>

      {/* Split Section: Real-time Live Feed + Top PRs / High Volume Athletes */}
      <div className="admin-split-grid">
        {/* Live Workout Stream */}
        <section className="admin-card admin-feed-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Activity size={18} className="text-lime" />
              <h3>{isRTL ? 'سجل الأنشطة الحية فورياً' : 'Live Workout Stream (Telemetry)'}</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={onViewAllWorkouts}>
              {isRTL ? 'فتح سجل التمارين' : 'Open logbook'} <ChevronRight size={14} />
            </button>
          </div>

          <div className="admin-activity-stream">
            {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <div className="admin-empty-box">
                <Dumbbell size={32} className="text-muted" />
                <p>{isRTL ? 'لا توجد أنشطة مسجلة بعد.' : 'No recent workout completions yet.'}</p>
              </div>
            ) : (
              stats.recentActivity.slice(0, 8).map((act) => {
                const matched = athletes.find(a => a.name === act.athleteName);
                return (
                  <div 
                    key={act.id} 
                    className="admin-stream-item admin-clickable-tr"
                    onClick={() => matched && onSelectAthlete(matched)}
                  >
                    <div className="admin-stream-avatar">
                      {act.athleteName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="admin-stream-body">
                      <div className="admin-stream-top">
                        <span className="admin-stream-athlete">{act.athleteName}</span>
                        <span className="admin-stream-time">
                          {act.date ? new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="admin-stream-title">{act.title}</div>
                      <div className="admin-stream-meta">
                        {act.duration ? <span><Clock size={12} /> {act.duration}m</span> : null}
                        {act.exerciseCount ? <span><Dumbbell size={12} /> {act.exerciseCount} exercises</span> : null}
                        {act.tonnage > 0 ? <span><Layers size={12} /> {act.tonnage}kg vol</span> : null}
                        {act.burnedCalories ? <span><Flame size={12} /> {act.burnedCalories} kcal</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* High Volume Leaders / PR Highlights */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Trophy size={18} className="text-orange" />
              <h3>{isRTL ? 'أبرز الأرقام القياسية (PRs)' : 'Platform Strength Records'}</h3>
            </div>
            <button type="button" className="admin-link-btn" onClick={onViewAllAthletes}>
              {isRTL ? 'جميع الرياضيين' : 'All athletes'} <ChevronRight size={14} />
            </button>
          </div>

          <div className="admin-pr-list">
            {(!stats?.globalPRs || stats.globalPRs.length === 0) ? (
              <div className="admin-empty-box">
                <Trophy size={32} className="text-muted" />
                <p>{isRTL ? 'سيتم رصد الأرقام القياسية فور رفع الأوزان.' : 'PRs will automatically register as athletes log weighted sets.'}</p>
              </div>
            ) : (
              stats.globalPRs.slice(0, 6).map((pr, idx) => {
                const matched = athletes.find(a => a.name === pr.athleteName);
                return (
                  <div 
                    key={idx} 
                    className="admin-pr-row admin-clickable-tr"
                    onClick={() => matched && onSelectAthlete(matched)}
                  >
                    <div className="admin-pr-rank">#{idx + 1}</div>
                    <div className="admin-pr-info">
                      <strong>{pr.exerciseName}</strong>
                      <span className="admin-pr-athlete">{pr.athleteName}</span>
                    </div>
                    <div className="admin-pr-weight">
                      <span>{pr.weight}</span>
                      <small>{pr.unit}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Training Focus Discipline Breakdown */}
          <div className="admin-discipline-breakdown">
            <h4 className="admin-subheading">{isRTL ? 'توزيع التمارين حسب التخصص' : 'Discipline Breakdown'}</h4>
            <div className="admin-discipline-bars">
              <div className="admin-bar-item">
                <span className="bar-label">{isRTL ? 'تمارين القوة' : 'Strength'}</span>
                <span className="bar-val">{stats?.categoryBreakdown.strength || 0}</span>
              </div>
              <div className="admin-bar-item">
                <span className="bar-label">{isRTL ? 'تضخيم (Hypertrophy)' : 'Hypertrophy'}</span>
                <span className="bar-val">{stats?.categoryBreakdown.hypertrophy || 0}</span>
              </div>
              <div className="admin-bar-item">
                <span className="bar-label">{isRTL ? 'كارديو' : 'Cardio'}</span>
                <span className="bar-val">{stats?.categoryBreakdown.cardio || 0}</span>
              </div>
              <div className="admin-bar-item">
                <span className="bar-label">{isRTL ? 'وزن الجسم' : 'Bodyweight'}</span>
                <span className="bar-val">{stats?.categoryBreakdown.bodyweight || 0}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================
   2. ATHLETE DIRECTORY & ROSTER VIEW
   ========================================================================= */
function AthletesDirectoryView({
  athletes,
  totalCount,
  filterTab,
  onFilterTabChange,
  sortBy,
  onSortByChange,
  onSelectAthlete,
  searchQuery,
  onClearSearch,
  onExportCSV
}: {
  athletes: AthleteSummary[];
  totalCount: number;
  filterTab: 'all' | 'active' | 'elite' | 'rookie';
  onFilterTabChange: (tab: 'all' | 'active' | 'elite' | 'rookie') => void;
  sortBy: 'workouts' | 'tonnage' | 'recent' | 'name';
  onSortByChange: (sort: 'workouts' | 'tonnage' | 'recent' | 'name') => void;
  onSelectAthlete: (athlete: AthleteSummary | null) => void;
  searchQuery: string;
  onClearSearch: () => void;
  onExportCSV: () => void;
}) {
  const { isRTL } = useTranslation();

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Users size={14} />
            <span>{isRTL ? 'دليل الرياضيين المحترفين' : 'ATHLETES & ROSTER INTELLIGENCE'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'سجل الرياضيين وإدارة الحسابات' : 'Athletes Directory'}</h1>
          <p className="admin-view-subtitle">
            {isRTL 
              ? `عرض وتدقيق ${athletes.length} من إجمالي ${totalCount} رياضي مسجل. اضغط على أي رياضي لفتح ملفه وسجل تمارينه بالكامل.` 
              : `Displaying ${athletes.length} of ${totalCount} athletes. Click any athlete to open their dossier, workout logbook, and diet history.`}
          </p>
        </div>

        <button type="button" className="admin-btn-action" onClick={onExportCSV}>
          <Download size={15} />
          <span>{isRTL ? 'تحميل جدول CSV' : 'Export Roster CSV'}</span>
        </button>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="admin-table-toolbar">
        {/* Category Tabs */}
        <div className="admin-filter-tabs">
          <button 
            type="button" 
            className={`admin-filter-pill ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => onFilterTabChange('all')}
          >
            {isRTL ? 'الكل' : 'All Athletes'} ({totalCount})
          </button>
          <button 
            type="button" 
            className={`admin-filter-pill ${filterTab === 'active' ? 'active' : ''}`}
            onClick={() => onFilterTabChange('active')}
          >
            {isRTL ? 'النشطون (30 يوم)' : 'Active (30d)'}
          </button>
          <button 
            type="button" 
            className={`admin-filter-pill ${filterTab === 'elite' ? 'active' : ''}`}
            onClick={() => onFilterTabChange('elite')}
          >
            {isRTL ? 'نخبة ومحترفون (Elite/Pro)' : 'Elite & Pro'}
          </button>
          <button 
            type="button" 
            className={`admin-filter-pill ${filterTab === 'rookie' ? 'active' : ''}`}
            onClick={() => onFilterTabChange('rookie')}
          >
            {isRTL ? 'رياضيون جدد' : 'Rookies'}
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="admin-sort-group">
          <ArrowUpDown size={14} className="text-secondary" />
          <label>{isRTL ? 'ترتيب حسب:' : 'Sort by:'}</label>
          <select 
            value={sortBy} 
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="admin-select"
          >
            <option value="workouts">{isRTL ? 'الأكثر تماريناً' : 'Most Workouts'}</option>
            <option value="tonnage">{isRTL ? 'الحجم التدريبي (Tonnage)' : 'Total Tonnage Moved'}</option>
            <option value="recent">{isRTL ? 'النشاط الأحدث' : 'Recently Active'}</option>
            <option value="name">{isRTL ? 'الاسم أبجدياً' : 'Name (A-Z)'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-card admin-table-container">
        {athletes.length === 0 ? (
          <div className="admin-empty-box">
            <Users size={36} className="text-muted" />
            <h3>{isRTL ? 'لا يوجد رياضيون يطابقون الفلتر' : 'No athletes match your criteria'}</h3>
            <p>{isRTL ? 'جرب تغيير كلمة البحث أو اختيار تبويب آخر.' : 'Try changing your search terms or filter selection.'}</p>
            {searchQuery && (
              <Button variant="secondary" size="sm" onClick={onClearSearch}>
                {isRTL ? 'إلغاء البحث' : 'Clear search'}
              </Button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isRTL ? 'الرياضي' : 'Athlete'}</th>
                <th>{isRTL ? 'المستوى' : 'Tier'}</th>
                <th>{isRTL ? 'البريد الإلكتروني' : 'Email'}</th>
                <th>{isRTL ? 'التمارين المنجزة' : 'Workouts Logged'}</th>
                <th>{isRTL ? 'الحجم الإجمالي' : 'Total Tonnage'}</th>
                <th>{isRTL ? 'السعرات المحروقة' : 'Calories Burned'}</th>
                <th>{isRTL ? 'آخر نشاط' : 'Last Active'}</th>
                <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{isRTL ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete) => (
                <tr 
                  key={athlete.uid} 
                  onClick={() => onSelectAthlete(athlete)}
                  className="admin-clickable-tr"
                >
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-athlete-avatar">
                        {athlete.pfp ? (
                          <img src={athlete.pfp} alt={athlete.name} />
                        ) : (
                          <span>{athlete.name?.charAt(0).toUpperCase() || 'A'}</span>
                        )}
                      </div>
                      <div>
                        <strong className="admin-athlete-table-name">{athlete.name}</strong>
                        {athlete.latestWeight ? (
                          <div className="admin-user-subtext">
                            {athlete.latestWeight} {athlete.weightUnit}
                            {athlete.weightDelta !== undefined && athlete.weightDelta !== 0 && (
                              <span className={athlete.weightDelta > 0 ? 'text-lime' : 'text-cyan'}>
                                {' '}({athlete.weightDelta > 0 ? '+' : ''}{athlete.weightDelta})
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-tier-badge tier-${athlete.tier.toLowerCase()}`}>
                      {athlete.tier}
                    </span>
                  </td>
                  <td>
                    <span className="admin-table-email">{athlete.email}</span>
                  </td>
                  <td>
                    <span className="admin-count-pill lime">
                      <Dumbbell size={12} /> {athlete.totalWorkouts}
                    </span>
                  </td>
                  <td>
                    <span className="admin-count-pill blue">
                      <Layers size={12} /> {athlete.totalTonnage.toLocaleString()} {athlete.weightUnit}
                    </span>
                  </td>
                  <td>
                    <span className="admin-count-pill orange">
                      <Flame size={12} /> {Math.round(athlete.totalCaloriesBurned).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="admin-table-date">
                      {athlete.lastActive ? new Date(athlete.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : (isRTL ? 'لم يسجل' : 'Never')}
                    </span>
                  </td>
                  <td style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAthlete(athlete);
                      }}
                    >
                      {isRTL ? 'فتح الملف' : 'View Dossier'}
                      <ChevronRight size={13} className="ml-1 mr-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   3. WORKOUT INTELLIGENCE & LOGBOOK VIEW
   ========================================================================= */
function WorkoutIntelligenceView({ 
  athletes,
  typeFilter,
  onTypeFilterChange,
  onSelectAthlete 
}: { 
  athletes: AthleteSummary[];
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  onSelectAthlete: (athlete: AthleteSummary) => void;
}) {
  const { isRTL } = useTranslation();

  const allWorkouts = useMemo(() => {
    const list: Array<{
      athlete: AthleteSummary;
      workout: AthleteSummary['history'][0];
    }> = [];

    for (const athlete of athletes) {
      for (const w of athlete.history) {
        list.push({ athlete, workout: w });
      }
    }

    list.sort((a, b) => new Date(b.workout.date).getTime() - new Date(a.workout.date).getTime());

    if (typeFilter !== 'all') {
      return list.filter(item => {
        const type = (item.workout.snapshot?.type || 'strength').toLowerCase();
        return type.includes(typeFilter.toLowerCase());
      });
    }

    return list;
  }, [athletes, typeFilter]);

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Dumbbell size={14} />
            <span>{isRTL ? 'سجل التدريب الذكي' : 'TRAINING INTELLIGENCE & LOGS'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'سجل التمارين المكتملة' : 'Global Workout Logbook'}</h1>
          <p className="admin-view-subtitle">
            {isRTL 
              ? `تدقيق شامل لكافة التمارين المسجلة (${allWorkouts.length} جلسة تدريبية عبر التطبيق).` 
              : `Telemetry of ${allWorkouts.length} completed sessions across all athletes with exercise breakdowns.`}
          </p>
        </div>
      </div>

      {/* Discipline Filters */}
      <div className="admin-filter-tabs mb-4">
        {['all', 'strength', 'hypertrophy', 'cardio', 'bodyweight'].map((type) => (
          <button
            key={type}
            type="button"
            className={`admin-filter-pill ${typeFilter === type ? 'active' : ''}`}
            onClick={() => onTypeFilterChange(type)}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {allWorkouts.length === 0 ? (
          <div className="admin-empty-box">
            <Dumbbell size={40} className="text-muted" />
            <h3>{isRTL ? 'لا توجد تمارين مسجلة لهذا التصنيف' : 'No workouts found for this discipline'}</h3>
            <p>{isRTL ? 'اختر تصنيفاً آخر لمشاهدة التمارين.' : 'Try selecting another training filter.'}</p>
          </div>
        ) : (
          <div className="admin-workout-feed">
            {allWorkouts.map(({ athlete, workout }) => (
              <div 
                key={`${athlete.uid}-${workout.id}`} 
                className="admin-workout-feed-card"
                onClick={() => onSelectAthlete(athlete)}
              >
                <div className="admin-workout-feed-header">
                  <div className="admin-workout-athlete-badge">
                    <div className="admin-stream-avatar small">
                      {athlete.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <strong>{athlete.name}</strong>
                      <span className="admin-feed-email">{athlete.email}</span>
                    </div>
                  </div>
                  <div className="admin-workout-date">
                    <Clock size={13} />
                    <span>{workout.date ? new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                  </div>
                </div>

                <div className="admin-workout-title-bar">
                  <h4>{workout.title || 'Workout Session'}</h4>
                  <div className="admin-workout-chips">
                    {workout.snapshot?.duration ? <span className="chip"><Clock size={12} /> {workout.snapshot.duration} min</span> : null}
                    {workout.burnedCalories ? <span className="chip"><Flame size={12} /> {workout.burnedCalories} kcal</span> : null}
                    {workout.snapshot?.type ? <span className="chip accent">{workout.snapshot.type}</span> : null}
                  </div>
                </div>

                {/* Exercises Tags */}
                {workout.snapshot?.exercises && workout.snapshot.exercises.length > 0 && (
                  <div className="admin-exercise-tags">
                    {workout.snapshot.exercises.map((ex, idx) => (
                      <span key={idx} className="admin-exercise-tag">
                        {ex.name} <small>({ex.sets?.length || 0} sets)</small>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   4. NUTRITION & MACROS HUB VIEW
   ========================================================================= */
function NutritionHubView({ 
  stats, 
  athletes 
}: { 
  stats: AdminPlatformStats | null; 
  athletes: AthleteSummary[];
}) {
  const { isRTL } = useTranslation();
  const [mealFilter, setMealFilter] = useState<string>('all');

  const allMeals = useMemo(() => {
    const list: Array<{ athlete: AthleteSummary; meal: AthleteSummary['meals'][0] }> = [];
    for (const athlete of athletes) {
      for (const m of athlete.meals) {
        list.push({ athlete, meal: m });
      }
    }
    list.sort((a, b) => new Date(b.meal.date).getTime() - new Date(a.meal.date).getTime());

    if (mealFilter !== 'all') {
      return list.filter(item => item.meal.mealType === mealFilter);
    }
    return list;
  }, [athletes, mealFilter]);

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Utensils size={14} />
            <span>{isRTL ? 'إحصائيات التغذية والسعرات' : 'NUTRITION & METABOLIC TELEMETRY'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'مركز التغذية وتوزيع الماكروز' : 'Nutrition Intelligence Hub'}</h1>
          <p className="admin-view-subtitle">
            {isRTL 
              ? `متابعة ${allMeals.length} وجبة مسجلة مع تتبع توزيع البروتين والكربوهيدرات والدهون.` 
              : `Tracking ${allMeals.length} logged meals across athletes with total macronutrient breakdowns.`}
          </p>
        </div>
      </div>

      {/* Aggregate Macro Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card glow-cyan">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'إجمالي البروتين' : 'Total Protein'}</span>
            <div className="admin-kpi-icon icon-cyan"><Utensils size={19} /></div>
          </div>
          <div className="admin-kpi-val">{Math.round(stats?.macroTotals.protein || 0).toLocaleString()} <small className="unit">g</small></div>
          <div className="admin-kpi-footer"><span className="text-secondary">{isRTL ? 'لبناء العضلات والتعافي' : 'Muscle recovery macro'}</span></div>
        </div>

        <div className="admin-kpi-card glow-orange">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'إجمالي الكربوهيدرات' : 'Total Carbs'}</span>
            <div className="admin-kpi-icon icon-orange"><Flame size={19} /></div>
          </div>
          <div className="admin-kpi-val">{Math.round(stats?.macroTotals.carbs || 0).toLocaleString()} <small className="unit">g</small></div>
          <div className="admin-kpi-footer"><span className="text-secondary">{isRTL ? 'طاقة التمارين الأساسية' : 'Primary workout fuel'}</span></div>
        </div>

        <div className="admin-kpi-card glow-purple">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isRTL ? 'إجمالي الدهون' : 'Total Fats'}</span>
            <div className="admin-kpi-icon icon-purple"><Activity size={19} /></div>
          </div>
          <div className="admin-kpi-val">{Math.round(stats?.macroTotals.fats || 0).toLocaleString()} <small className="unit">g</small></div>
          <div className="admin-kpi-footer"><span className="text-secondary">{isRTL ? 'صحة الهرمونات والمفاصل' : 'Hormonal support macro'}</span></div>
        </div>
      </div>

      {/* Meal Filters */}
      <div className="admin-filter-tabs mb-4">
        {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((m) => (
          <button
            key={m}
            type="button"
            className={`admin-filter-pill ${mealFilter === m ? 'active' : ''}`}
            onClick={() => setMealFilter(m)}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {allMeals.length === 0 ? (
          <div className="admin-empty-box">
            <Utensils size={40} className="text-muted" />
            <h3>{isRTL ? 'لا توجد وجبات مسجلة' : 'No logged meals found'}</h3>
            <p>{isRTL ? 'الوجبات المسجلة من الرياضيين ستظهر هنا فورياً.' : 'Meals logged by athletes will populate this table.'}</p>
          </div>
        ) : (
          <div className="admin-meals-grid">
            {allMeals.map(({ athlete, meal }) => (
              <div key={`${athlete.uid}-${meal.id}`} className="admin-meal-card">
                <div className="admin-meal-top">
                  <span className={`admin-meal-type ${meal.mealType}`}>
                    {meal.mealType}
                  </span>
                  <span className="admin-meal-calories">
                    <Flame size={13} /> {meal.calories} kcal
                  </span>
                </div>
                <h4 className="admin-meal-title">{meal.title}</h4>
                <div className="admin-meal-macros">
                  <span>P: {meal.protein}g</span>
                  <span>C: {meal.carbs}g</span>
                  <span>F: {meal.fats}g</span>
                </div>
                <div className="admin-meal-user-footer">
                  <strong>{athlete.name}</strong>
                  <small>{meal.date ? new Date(meal.date).toLocaleDateString() : ''}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   5. STRENGTH & PR LEADERBOARD VIEW
   ========================================================================= */
function StrengthLeaderboardView({ 
  stats, 
  athletes,
  onSelectAthlete 
}: { 
  stats: AdminPlatformStats | null; 
  athletes: AthleteSummary[];
  onSelectAthlete: (athlete: AthleteSummary) => void;
}) {
  const { isRTL } = useTranslation();

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Trophy size={14} />
            <span>{isRTL ? 'سجلات القوة الفردية والجماعية' : 'STRENGTH BENCHMARKS & PRs'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'لوحة الشرف والأرقام القياسية' : 'Platform PR Leaderboard'}</h1>
          <p className="admin-view-subtitle">
            {isRTL 
              ? 'أعلى الأوزان المسجلة في تمارين البنش، الاسكوات، الديدلفت، وغيرها عبر جميع الرياضيين.' 
              : 'Maximum weight lifted milestones recorded across all compound and isolation lifts.'}
          </p>
        </div>
      </div>

      <div className="admin-card">
        {(!stats?.globalPRs || stats.globalPRs.length === 0) ? (
          <div className="admin-empty-box">
            <Trophy size={40} className="text-muted" />
            <h3>{isRTL ? 'لا توجد أرقام قياسية مسجلة بعد' : 'No Personal Records recorded yet'}</h3>
            <p>{isRTL ? 'بمجرد تسجيل جلسات تدريبية بأوزان، ستظهر الأرقام القياسية هنا.' : 'PRs will appear as soon as athletes record weighted sets.'}</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isRTL ? 'المركز' : 'Rank'}</th>
                  <th>{isRTL ? 'التمرين' : 'Exercise'}</th>
                  <th>{isRTL ? 'أقصى وزن مسجل' : 'Heaviest Weight'}</th>
                  <th>{isRTL ? 'حامل الرقم' : 'Record Holder'}</th>
                  <th>{isRTL ? 'تاريخ الإنجاز' : 'Achieved Date'}</th>
                  <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{isRTL ? 'الملف' : 'Athlete'}</th>
                </tr>
              </thead>
              <tbody>
                {stats.globalPRs.map((pr, idx) => {
                  const athleteMatch = athletes.find(a => a.email === pr.athleteEmail);
                  return (
                    <tr key={idx}>
                      <td>
                        <span className={`admin-rank-chip rank-${idx + 1}`}>#{idx + 1}</span>
                      </td>
                      <td>
                        <strong className="text-primary">{pr.exerciseName}</strong>
                      </td>
                      <td>
                        <span className="admin-weight-highlight">
                          {pr.weight} <small>{pr.unit}</small>
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-user">
                          <span>{pr.athleteName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-secondary">{pr.date ? new Date(pr.date).toLocaleDateString() : ''}</span>
                      </td>
                      <td style={{ textAlign: isRTL ? 'left' : 'right' }}>
                        {athleteMatch && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => onSelectAthlete(athleteMatch)}
                          >
                            {isRTL ? 'عرض الملف' : 'View'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   6. SYSTEM & GOVERNANCE VIEW
   ========================================================================= */
function SystemGovernanceView({ 
  athletes,
  stats,
  onRefresh 
}: { 
  athletes: AthleteSummary[];
  stats: AdminPlatformStats | null;
  onRefresh: () => void;
}) {
  const { isRTL } = useTranslation();

  const handleDownloadBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      adminEmail: ADMIN_CREDENTIALS.email,
      stats,
      athletes
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forma_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(isRTL ? 'تم تنزيل النسخة الاحتياطية بنجاح' : 'System backup downloaded', 'success');
  };

  return (
    <div className="admin-view-content">
      <div className="admin-view-header">
        <div>
          <div className="admin-category-eyebrow">
            <Shield size={14} />
            <span>{isRTL ? 'النظام والحوكمة السحابية' : 'GOVERNANCE & DATABASE INTEGRITY'}</span>
          </div>
          <h1 className="admin-view-title">{isRTL ? 'إعدادات النظام والأمان' : 'Master System & DB Controls'}</h1>
          <p className="admin-view-subtitle">
            {isRTL ? 'إدارة الاتصال السحابي، صلاحيات المشرف، والنسخ الاحتياطي' : 'Cloud connection status, security policies, and master backup utilities'}
          </p>
        </div>
      </div>

      <div className="admin-settings-container">
        {/* Administrator Info Card */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Shield size={18} className="text-cyan" />
              <h3>{isRTL ? 'حساب المشرف الرئيسي' : 'Master Administrator Credentials'}</h3>
            </div>
          </div>
          <div className="admin-settings-row">
            <div>
              <strong>{isRTL ? 'البريد الإلكتروني المعتمد' : 'Sole Authorized Admin Email'}</strong>
              <p className="text-secondary">{ADMIN_CREDENTIALS.email}</p>
            </div>
            <span className="badge-active">Verified Exclusive Admin</span>
          </div>
          <div className="admin-settings-row">
            <div>
              <strong>{isRTL ? 'مستوى الصلاحيات' : 'Security Level'}</strong>
              <p className="text-secondary">{isRTL ? 'تحكم كامل وقراءة مباشرة لجميع السجلات' : 'Read all user collections & subcollections'}</p>
            </div>
            <span className="badge-active">Root Owner</span>
          </div>
        </section>

        {/* Database Telemetry */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Database size={18} className="text-lime" />
              <h3>{isRTL ? 'حالة قاعدة البيانات (Google Cloud Firestore)' : 'Database Telemetry'}</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={onRefresh} leftIcon={<RefreshCw size={14} />}>
              {isRTL ? 'إعادة المزامنة' : 'Re-sync'}
            </Button>
          </div>
          <div className="admin-settings-row">
            <div>
              <strong>{isRTL ? 'محرك التخزين السحابي' : 'Storage Engine'}</strong>
              <p className="text-secondary">Firestore Multi-Tab Persistent Cache</p>
            </div>
            <span className="badge-active">Active & Online</span>
          </div>
          <div className="admin-settings-row">
            <div>
              <strong>{isRTL ? 'قواعد الأمان' : 'Security Rules (firestore.rules)'}</strong>
              <p className="text-secondary">Enforced via token email & role authorization</p>
            </div>
            <span className="badge-active">Enforced</span>
          </div>
        </section>

        {/* Platform Master Backup */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <Download size={18} className="text-orange" />
              <h3>{isRTL ? 'النسخ الاحتياطي الشامل للمنصة' : 'Platform Master Backup'}</h3>
            </div>
          </div>
          <div className="admin-settings-row">
            <div>
              <strong>{isRTL ? 'تصدير نسخة JSON شاملة' : 'Export Full Database Snapshot'}</strong>
              <p className="text-secondary">{isRTL ? 'تنزيل جميع بيانات الرياضيين، التمارين، والوجبات في ملف JSON واحد.' : 'Download complete telemetry of all athletes, workouts, and nutrition logs in one JSON snapshot.'}</p>
            </div>
            <Button variant="primary" size="sm" onClick={handleDownloadBackup} leftIcon={<Download size={14} />}>
              {isRTL ? 'تنزيل Backup' : 'Download Backup'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================
   7. ATHLETE DOSSIER MODAL (FULL WORKOUT HISTORY & STATS)
   ========================================================================= */
function AthleteDossierModal({
  athlete,
  onClose
}: {
  athlete: AthleteSummary;
  onClose: () => void;
}) {
  const { isRTL } = useTranslation();
  const [tab, setTab] = useState<'workouts' | 'prs' | 'sessions' | 'meals' | 'metrics'>('workouts');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="admin-modal-panel" 
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-user-info">
            <div className="admin-modal-avatar">
              {athlete.pfp ? (
                <img src={athlete.pfp} alt={athlete.name} />
              ) : (
                <span>{athlete.name?.charAt(0).toUpperCase() || 'A'}</span>
              )}
            </div>
            <div>
              <div className="admin-dossier-name-row">
                <h2>{athlete.name}</h2>
                <span className={`admin-tier-badge tier-${athlete.tier.toLowerCase()}`}>
                  {athlete.tier} Athlete
                </span>
              </div>
              <p className="admin-modal-email">{athlete.email}</p>
              <div className="admin-modal-pills">
                <span className="pill">UID: {athlete.uid.slice(0, 10)}...</span>
                <span className="pill workouts"><Dumbbell size={12} /> {athlete.totalWorkouts} {isRTL ? 'تمرين' : 'workouts'}</span>
                <span className="pill volume"><Layers size={12} /> {athlete.totalTonnage.toLocaleString()} {athlete.weightUnit}</span>
                {athlete.latestWeight ? (
                  <span className="pill weight"><Scale size={12} /> {athlete.latestWeight} {athlete.weightUnit}</span>
                ) : null}
              </div>
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Modal Category Tabs */}
        <div className="admin-modal-tabs">
          <button 
            type="button" 
            className={`admin-modal-tab ${tab === 'workouts' ? 'active' : ''}`}
            onClick={() => setTab('workouts')}
          >
            <Dumbbell size={15} />
            <span>{isRTL ? 'سجل التمارين المكتملة' : 'Workout Logbook'} ({athlete.history.length})</span>
          </button>

          <button 
            type="button" 
            className={`admin-modal-tab ${tab === 'prs' ? 'active' : ''}`}
            onClick={() => setTab('prs')}
          >
            <Trophy size={15} />
            <span>{isRTL ? 'الأرقام القياسية' : 'Personal Records'} ({athlete.personalRecords.length})</span>
          </button>

          <button 
            type="button" 
            className={`admin-modal-tab ${tab === 'sessions' ? 'active' : ''}`}
            onClick={() => setTab('sessions')}
          >
            <Calendar size={15} />
            <span>{isRTL ? 'الجداول المخططة' : 'Planned'} ({athlete.sessions.length})</span>
          </button>

          <button 
            type="button" 
            className={`admin-modal-tab ${tab === 'meals' ? 'active' : ''}`}
            onClick={() => setTab('meals')}
          >
            <Utensils size={15} />
            <span>{isRTL ? 'الوجبات' : 'Meals'} ({athlete.meals.length})</span>
          </button>

          <button 
            type="button" 
            className={`admin-modal-tab ${tab === 'metrics' ? 'active' : ''}`}
            onClick={() => setTab('metrics')}
          >
            <Scale size={15} />
            <span>{isRTL ? 'الوزن' : 'Weight'} ({athlete.bodyMetrics.length})</span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="admin-modal-body">
          {/* 1. Workout History */}
          {tab === 'workouts' && (
            <div className="admin-modal-list">
              {athlete.history.length === 0 ? (
                <div className="admin-empty-box">
                  <Dumbbell size={36} className="text-muted" />
                  <p>{isRTL ? 'لم يقم هذا الرياضي بإكمال أي تمرين بعد.' : 'No completed workouts recorded for this athlete.'}</p>
                </div>
              ) : (
                athlete.history.map((record) => {
                  const isExpanded = expandedWorkoutId === record.id;
                  const exercises = record.snapshot?.exercises || [];
                  return (
                    <div key={record.id} className="admin-history-detail-card">
                      <div 
                        className="admin-history-card-top"
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : record.id)}
                      >
                        <div>
                          <div className="admin-history-date">
                            <Clock size={12} />
                            <span>{record.date ? new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <h4 className="admin-history-title">{record.title}</h4>
                          <div className="admin-history-tags">
                            {record.snapshot?.duration ? <span><Clock size={12} /> {record.snapshot.duration} min</span> : null}
                            {record.burnedCalories ? <span><Flame size={12} /> {record.burnedCalories} kcal</span> : null}
                            <span><Dumbbell size={12} /> {exercises.length} exercises</span>
                          </div>
                        </div>
                        <button type="button" className="admin-expand-btn">
                          <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </button>
                      </div>

                      {/* Detailed Exercises & Sets breakdown */}
                      {isExpanded && (
                        <div className="admin-history-exercises-breakdown">
                          {exercises.length === 0 ? (
                            <p className="text-secondary">{isRTL ? 'لا توجد تمارين مفصلة مسجلة في هذه الجولة.' : 'No exercise details logged.'}</p>
                          ) : (
                            exercises.map((ex, eIdx) => (
                              <div key={ex.id || eIdx} className="admin-exercise-box">
                                <div className="admin-exercise-header">
                                  <strong>{ex.name}</strong>
                                  <span className="admin-muscle-badge">{ex.targetMuscle || 'General'}</span>
                                </div>
                                <div className="admin-sets-table">
                                  {ex.sets?.map((s, sIdx) => (
                                    <div key={s.id || sIdx} className="admin-set-chip">
                                      <span className="set-num">Set {sIdx + 1}:</span>
                                      <span className="set-val">
                                        <strong>{s.weight}</strong> {s.unit || athlete.weightUnit} × <strong>{s.repsActual || s.repsTarget}</strong> reps
                                      </span>
                                      {s.isCompleted && <CheckCircle2 size={12} className="text-lime" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Personal Records */}
          {tab === 'prs' && (
            <div className="admin-modal-list">
              {athlete.personalRecords.length === 0 ? (
                <div className="admin-empty-box">
                  <Trophy size={36} className="text-muted" />
                  <p>{isRTL ? 'لم يتم رصد أرقام قياسية بعد.' : 'No personal records detected from weighted workouts yet.'}</p>
                </div>
              ) : (
                <div className="admin-athlete-prs-grid">
                  {athlete.personalRecords.map((pr, idx) => (
                    <div key={idx} className="admin-athlete-pr-card">
                      <div className="pr-top">
                        <Trophy size={16} className="text-orange" />
                        <span className="pr-date">{pr.date ? new Date(pr.date).toLocaleDateString() : ''}</span>
                      </div>
                      <h4>{pr.exerciseName}</h4>
                      <div className="pr-weight-display">
                        <span>{pr.weight}</span>
                        <small>{pr.unit}</small>
                        <span className="pr-reps">× {pr.reps} reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Planned Sessions */}
          {tab === 'sessions' && (
            <div className="admin-modal-list">
              {athlete.sessions.length === 0 ? (
                <div className="admin-empty-box">
                  <Calendar size={36} className="text-muted" />
                  <p>{isRTL ? 'لا توجد جولات تدريبية مخطط لها.' : 'No planned sessions found in schedule.'}</p>
                </div>
              ) : (
                athlete.sessions.map((sess) => (
                  <div key={sess.id} className="admin-history-detail-card">
                    <div className="admin-history-date">
                      <span>{sess.date ? new Date(sess.date).toLocaleDateString() : ''}</span>
                    </div>
                    <h4>{sess.title}</h4>
                    <p className="text-secondary">{sess.exercises?.length || 0} exercises planned • {sess.duration} min</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Meals */}
          {tab === 'meals' && (
            <div className="admin-modal-list">
              {athlete.meals.length === 0 ? (
                <div className="admin-empty-box">
                  <Utensils size={36} className="text-muted" />
                  <p>{isRTL ? 'لا توجد وجبات مسجلة لهذا الرياضي.' : 'No meals logged by this athlete.'}</p>
                </div>
              ) : (
                athlete.meals.map((m) => (
                  <div key={m.id} className="admin-history-detail-card">
                    <div className="admin-meal-top">
                      <span className={`admin-meal-type ${m.mealType}`}>{m.mealType}</span>
                      <span>{m.calories} kcal</span>
                    </div>
                    <h4>{m.title}</h4>
                    <p className="text-secondary">P: {m.protein}g | C: {m.carbs}g | F: {m.fats}g</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. Weight Metrics */}
          {tab === 'metrics' && (
            <div className="admin-modal-list">
              {athlete.bodyMetrics.length === 0 ? (
                <div className="admin-empty-box">
                  <Scale size={36} className="text-muted" />
                  <p>{isRTL ? 'لا توجد قياسات وزن مسجلة.' : 'No weight measurements logged.'}</p>
                </div>
              ) : (
                athlete.bodyMetrics.map((b) => (
                  <div key={b.id} className="admin-history-detail-card">
                    <div className="admin-history-date">
                      <span>{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                    <h4>{b.weight} {b.unit}</h4>
                    {b.bodyFat ? <p className="text-secondary">Body Fat: {b.bodyFat}%</p> : null}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
