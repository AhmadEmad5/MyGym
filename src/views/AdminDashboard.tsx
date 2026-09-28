import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportAthletesToCSV, type AthleteSummary } from '../lib/adminData';
import { ADMIN_CREDENTIALS } from '../lib/adminAuth';
import { notify } from '../lib/feedback';
import { useTranslation } from '../lib/i18n';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminErrorState, AdminLoadingState } from '../components/admin/AdminPrimitives';
import { AthleteDrawer } from '../components/admin/AthleteDrawer';
import { AthletesPanel } from '../components/admin/AthletesPanel';
import { GovernancePanel } from '../components/admin/GovernancePanel';
import { NutritionPanel } from '../components/admin/NutritionPanel';
import { OverviewPanel } from '../components/admin/OverviewPanel';
import { RecordsPanel } from '../components/admin/RecordsPanel';
import { WorkoutsPanel } from '../components/admin/WorkoutsPanel';
import { adminCopy } from '../components/admin/copy';
import { useAdminData } from '../components/admin/useAdminData';
import type { AdminCategory } from '../components/admin/types';
import './AdminDashboard.css';
import '../components/admin/admin-data.css';
import '../components/admin/admin-drawer.css';

export function AdminDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const navigate = useNavigate();
  const { isRTL, language, setLanguage } = useTranslation();
  const locale = language;

  const [activeCategory, setActiveCategory] = useState<AdminCategory>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteSummary | null>(null);

  const handleNotify = useCallback(
    (message: string, tone: 'success' | 'error') => {
      notify(message === 'sync-ok' ? adminCopy.syncedToast(locale) : adminCopy.failedToast(locale), tone);
    },
    [locale]
  );

  const { status, stats, athletes, isRefreshing, lastSyncedAt, refresh, retry } = useAdminData(handleNotify);

  const panel = useMemo(() => ({ locale, isRTL }), [locale, isRTL]);

  const downloadBackup = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      adminEmail: ADMIN_CREDENTIALS.email,
      stats,
      athletes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forma_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(adminCopy.backupToast(locale), 'success');
  }, [athletes, locale, stats]);

  const openAthlete = useCallback((athlete: AthleteSummary) => {
    setSelectedAthlete(athlete);
  }, []);

  const body = () => {
    if (status === 'loading') return <AdminLoadingState locale={locale} isRTL={isRTL} />;
    if (status === 'error') return <AdminErrorState locale={locale} isRTL={isRTL} onRetry={() => void retry()} />;

    switch (activeCategory) {
      case 'athletes':
        return (
          <AthletesPanel
            {...panel}
            athletes={athletes}
            totalCount={athletes.length}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onSelectAthlete={openAthlete}
            onExport={() => {
              exportAthletesToCSV(athletes);
              notify(adminCopy.exportToast(locale), 'success');
            }}
          />
        );
      case 'workouts':
        return <WorkoutsPanel {...panel} athletes={athletes} searchQuery={searchQuery} onSelectAthlete={openAthlete} />;
      case 'nutrition':
        return <NutritionPanel {...panel} stats={stats} athletes={athletes} searchQuery={searchQuery} />;
      case 'records':
        return <RecordsPanel {...panel} stats={stats} athletes={athletes} onSelectAthlete={openAthlete} />;
      case 'governance':
        return (
          <GovernancePanel
            {...panel}
            adminEmail={ADMIN_CREDENTIALS.email}
            stats={stats}
            athletes={athletes}
            lastSyncedAt={lastSyncedAt}
            onRefresh={() => void refresh(true)}
            onDownloadBackup={downloadBackup}
          />
        );
      default:
        return (
          <OverviewPanel
            {...panel}
            stats={stats}
            athletes={athletes}
            onSelectAthlete={openAthlete}
            onOpenAthletes={() => setActiveCategory('athletes')}
            onOpenWorkouts={() => setActiveCategory('workouts')}
          />
        );
    }
  };

  return (
    <>
      <AdminShell
        locale={locale}
        isRTL={isRTL}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => void refresh(true)}
        isRefreshing={isRefreshing}
        status={status}
        stats={stats}
        athletes={athletes}
        adminEmail={ADMIN_CREDENTIALS.email}
        onSwitchToAthlete={() => navigate('/today')}
        onLogout={() => void onLogout()}
        onToggleLanguage={() => void setLanguage(isRTL ? 'en' : 'ar')}
      >
        {body()}
      </AdminShell>

      <AthleteDrawer locale={locale} isRTL={isRTL} athlete={selectedAthlete} onClose={() => setSelectedAthlete(null)} />
    </>
  );
}
