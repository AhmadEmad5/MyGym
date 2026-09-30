import { Database, Download, KeyRound, Lock, RefreshCw, Shield, ShieldCheck } from 'lucide-react';
import { adminCopy } from './copy';
import { formatTime } from './format';
import { AdminCard, PanelHeader, StatusPill } from './AdminPrimitives';
import type { AdminPlatformStats, AthleteSummary } from '../../lib/adminData';
import type { PanelProps } from './types';

type GovernanceProps = PanelProps & {
  adminEmail: string;
  stats: AdminPlatformStats | null;
  athletes: AthleteSummary[];
  lastSyncedAt: Date | null;
  onRefresh: () => void;
  onDownloadBackup: () => void;
};

export function GovernancePanel({
  locale,
  adminEmail,
  stats,
  athletes,
  lastSyncedAt,
  onRefresh,
  onDownloadBackup
}: GovernanceProps) {
  return (
    <div className="admin-panel">
      <PanelHeader
        eyebrow={adminCopy.governanceEyebrow(locale)}
        title={adminCopy.governanceTitle(locale)}
        subtitle={adminCopy.governanceSubtitle(locale)}
        icon={<Shield size={13} aria-hidden="true" />}
      />

      <div className="admin-grid-two">
        <AdminCard title={adminCopy.adminAccount(locale)} icon={<ShieldCheck size={16} aria-hidden="true" />}>
          <dl className="admin-definition">
            <div>
              <dt>{adminCopy.adminEmailLabel(locale)}</dt>
              <dd className="admin-mono">{adminEmail}</dd>
            </div>
            <div>
              <dt>{adminCopy.passwordProtected(locale)}</dt>
              <dd>
                <StatusPill tone="ok" label={adminCopy.statusVerified(locale)} icon={<Lock size={12} aria-hidden="true" />} />
              </dd>
            </div>
            <div>
              <dt>{adminCopy.securityLevel(locale)}</dt>
              <dd>
                <StatusPill tone="ok" label={adminCopy.securityLevelValue(locale)} icon={<KeyRound size={12} aria-hidden="true" />} />
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard
          title={adminCopy.dbTelemetry(locale)}
          icon={<Database size={16} aria-hidden="true" />}
          action={
            <button type="button" className="admin-action-btn touch-target" onClick={onRefresh}>
              <RefreshCw size={14} aria-hidden="true" />
              {adminCopy.resync(locale)}
            </button>
          }
        >
          <dl className="admin-definition">
            <div>
              <dt>{adminCopy.storageEngine(locale)}</dt>
              <dd>
                <StatusPill tone="ok" label={adminCopy.storageEngineValue(locale)} />
              </dd>
            </div>
            <div>
              <dt>{adminCopy.securityRules(locale)}</dt>
              <dd>
                <StatusPill tone="ok" label={adminCopy.statusEnforced(locale)} icon={<Lock size={12} aria-hidden="true" />} />
              </dd>
            </div>
            <div>
              <dt>{adminCopy.ready(locale)}</dt>
              <dd className="admin-muted">
                {lastSyncedAt ? formatTime(locale) : '—'} · {stats?.totalAthletes ?? athletes.length}
              </dd>
            </div>
          </dl>
        </AdminCard>
      </div>

      <AdminCard title={adminCopy.masterBackup(locale)} icon={<Download size={16} aria-hidden="true" />}>
        <div className="admin-backup-row">
          <div>
            <strong>{adminCopy.downloadBackup(locale)}</strong>
            <p>{adminCopy.backupBody(locale)}</p>
          </div>
          <button type="button" className="admin-action-btn is-primary touch-target" onClick={onDownloadBackup}>
            <Download size={14} aria-hidden="true" />
            {adminCopy.downloadBackup(locale)}
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
