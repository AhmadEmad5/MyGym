import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Dumbbell,
  Inbox,
  Medal,
  Minus,
  RefreshCw,
  Sprout,
  TrendingUp,
  TriangleAlert,
  Trophy
} from 'lucide-react';
import { adminCopy } from './copy';
import type { AthleteTier } from '../../lib/adminData';
import type { PanelProps } from './types';

export function AdminCard({
  title,
  icon,
  action,
  children,
  className = ''
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-card ${className}`.trim()}>
      {(title || action) && (
        <header className="admin-card-head">
          <div className="admin-card-head-title">
            {icon && (
              <span className="admin-card-head-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            {title && <h3>{title}</h3>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  action
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="admin-panel-head">
      <div className="admin-panel-head-copy">
        <span className="admin-eyebrow">
          {icon}
          {eyebrow}
        </span>
        <h1 className="admin-title">{title}</h1>
        <p className="admin-subtitle">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

const TIER_META: Record<AthleteTier, { icon: typeof Trophy; modifier: string; label: Record<'ar' | 'en', string> }> = {
  Elite: { icon: Trophy, modifier: 'elite', label: { en: 'Elite', ar: 'نخبة' } },
  Pro: { icon: Medal, modifier: 'pro', label: { en: 'Pro', ar: 'محترف' } },
  Dedicated: { icon: Dumbbell, modifier: 'dedicated', label: { en: 'Dedicated', ar: 'ملتزم' } },
  Rookie: { icon: Sprout, modifier: 'rookie', label: { en: 'Rookie', ar: 'مبتدئ' } }
};

export function TierBadge({ tier, locale }: { tier: AthleteTier; locale: 'ar' | 'en' }) {
  const meta = TIER_META[tier] ?? TIER_META.Rookie;
  const Icon = meta.icon;
  return (
    <span className={`admin-tier is-${meta.modifier}`}>
      <Icon size={12} aria-hidden="true" />
      <span>{meta.label[locale]}</span>
    </span>
  );
}

export type StatusTone = 'ok' | 'idle' | 'warn' | 'bad';

export function StatusPill({ tone, label, icon }: { tone: StatusTone; label: string; icon?: ReactNode }) {
  const fallback = {
    ok: <Check size={12} aria-hidden="true" />,
    idle: <Minus size={12} aria-hidden="true" />,
    warn: <AlertTriangle size={12} aria-hidden="true" />,
    bad: <CircleSlash size={12} aria-hidden="true" />
  }[tone];
  return (
    <span className={`admin-status is-${tone}`}>
      <span className="admin-status-mark" aria-hidden="true">
        {icon ?? fallback}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function ActivityStatus({ days, isRTL, neverLabel }: { days: number | null; isRTL: boolean; neverLabel: string }) {
  if (days === null) return <StatusPill tone="idle" label={neverLabel} />;
  if (days === 0) return <StatusPill tone="ok" label={isRTL ? 'نشط اليوم' : 'Active today'} />;
  if (days <= 7) return <StatusPill tone="ok" label={isRTL ? `منذ ${days} يوم` : `${days}d ago`} />;
  if (days <= 30) return <StatusPill tone="warn" label={isRTL ? `منذ ${days} يوم` : `${days}d ago`} />;
  return <StatusPill tone="idle" label={isRTL ? `منذ ${days} يوم` : `${days}d ago`} />;
}

export function KpiCard({
  label,
  value,
  unit,
  footer,
  icon,
  tone
}: {
  label: string;
  value: string;
  unit?: string;
  footer: ReactNode;
  icon: ReactNode;
  tone: 'cyan' | 'lime' | 'blue' | 'orange' | 'yellow' | 'purple';
}) {
  return (
    <article className={`admin-kpi is-${tone}`}>
      <div className="admin-kpi-head">
        <span className="admin-kpi-label">{label}</span>
        <span className="admin-kpi-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="admin-kpi-value">
        {value}
        {unit && <small>{unit}</small>}
      </p>
      <div className="admin-kpi-foot">{footer}</div>
    </article>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon" aria-hidden="true">
        {icon ?? <Inbox size={26} />}
      </span>
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function AdminErrorState({ onRetry, locale }: PanelProps & { onRetry: () => void }) {
  return (
    <div className="admin-empty is-error" role="alert">
      <span className="admin-empty-icon" aria-hidden="true">
        <TriangleAlert size={26} />
      </span>
      <h4>{adminCopy.errorTitle(locale)}</h4>
      <p>{adminCopy.errorBody(locale)}</p>
      <button type="button" className="admin-action-btn" onClick={onRetry}>
        <RefreshCw size={14} aria-hidden="true" />
        {adminCopy.retry(locale)}
      </button>
    </div>
  );
}

export function AdminLoadingState({ rows = 6, locale }: PanelProps & { rows?: number }) {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <span className="admin-spinner" aria-hidden="true" />
      <h4>{adminCopy.loadingTitle(locale)}</h4>
      <p>{adminCopy.loadingBody(locale)}</p>
      <div className="admin-skeleton" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <span key={index} className="admin-skeleton-row" />
        ))}
      </div>
      <span className="sr-only">{adminCopy.skeletonRows(locale)}</span>
    </div>
  );
}

export function SortableHeader<K extends string>({
  label,
  column,
  active,
  locale,
  onSort
}: {
  label: string;
  column: K;
  active: K;
  locale: 'ar' | 'en';
  onSort: (column: K) => void;
}) {
  const isActive = active === column;
  return (
    <th scope="col" aria-sort={isActive ? 'descending' : 'none'}>
      <button
        type="button"
        className={`admin-sort-btn ${isActive ? 'is-active' : ''}`}
        onClick={() => onSort(column)}
        aria-label={`${label} — ${adminCopy.sortBy(locale)}`}
      >
        <span>{label}</span>
        <TrendingUp size={13} aria-hidden="true" className={isActive ? '' : 'is-muted'} />
      </button>
    </th>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  ariaLabel
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="admin-pills" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`admin-pill ${value === option.value ? 'is-active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.value === value && <Check size={12} aria-hidden="true" />}
          <span>{option.label}</span>
          {option.count !== undefined && <em>{option.count}</em>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  shown,
  onChange,
  locale,
  isRTL
}: PanelProps & { page: number; pageCount: number; total: number; shown?: number; onChange: (page: number) => void }) {
  const prevIcon = isRTL ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />;
  const nextIcon = isRTL ? <ChevronLeft size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />;
  return (
    <nav className="admin-pagination" aria-label={adminCopy.page(locale, page, pageCount)}>
      <span className="admin-pagination-count">{adminCopy.resultsCount(locale, shown ?? total, total)}</span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-page-btn"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label={adminCopy.prevPage(locale)}
        >
          {prevIcon}
        </button>
        <span className="admin-page-label">{adminCopy.page(locale, page, pageCount)}</span>
        <button
          type="button"
          className="admin-page-btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={adminCopy.nextPage(locale)}
        >
          {nextIcon}
        </button>
      </div>
    </nav>
  );
}

export function StatInline({ icon, value, unit }: { icon?: ReactNode; value: string; unit?: string }) {
  return (
    <span className="admin-stat-inline">
      {icon}
      <span>{value}</span>
      {unit && <small>{unit}</small>}
    </span>
  );
}
