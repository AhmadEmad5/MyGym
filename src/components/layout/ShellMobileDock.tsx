import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { NAV_SPRING } from './navMotion';
import { NavDestinationLink } from './NavDestinationLink';
import type { ShellDockEntry, ShellNavItem, ShellNavTrainAction } from './navModel';

interface ShellMobileDockProps {
  entries: ShellDockEntry[];
  activeOverflowItem: ShellNavItem | null;
  isOverflowOpen: boolean;
  activeTodaySessionId?: string;
  motionEnabled: boolean;
  onPrefetch: (routeId: string) => void;
  onActivateTrain: () => void;
  onToggleOverflow: () => void;
}

function DockTrainTab({
  entry,
  activeTodaySessionId,
  motionEnabled,
  onActivate,
}: {
  entry: ShellNavTrainAction;
  activeTodaySessionId?: string;
  motionEnabled: boolean;
  onActivate: () => void;
}) {
  const { isRTL } = useTranslation();
  const accessibleName = activeTodaySessionId
    ? isRTL
      ? 'متابعة التدريب'
      : 'Resume training'
    : isRTL
      ? 'بدء تدريب'
      : 'Start a workout';

  const Icon = entry.icon;

  return (
    <button
      type="button"
      className={`modern-nav-item nav-train-action${entry.isActive ? ' is-active' : ''}`}
      onClick={onActivate}
      aria-label={accessibleName}
      aria-pressed={entry.isActive}
      data-nav-id={entry.id}
    >
      <motion.span
        className="nav-icon-wrap"
        whileTap={motionEnabled ? { scale: 0.88 } : undefined}
        transition={NAV_SPRING}
        aria-hidden="true"
      >
        <Icon size={22} strokeWidth={2} className="nav-icon" />
      </motion.span>
      <span className="nav-short-label">{entry.shortLabel}</span>
      <span className={`nav-active-dot${entry.isActive ? ' is-visible' : ''}`} aria-hidden="true" />
    </button>
  );
}

function DockMoreTab({
  activeItem,
  isOpen,
  motionEnabled,
  onToggle,
}: {
  activeItem: ShellNavItem | null;
  isOpen: boolean;
  motionEnabled: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const isActive = Boolean(activeItem);
  const Icon = activeItem ? activeItem.icon : LayoutGrid;

  return (
    <button
      type="button"
      className={`modern-nav-item${isActive ? ' is-active' : ''}`}
      onClick={onToggle}
      aria-label={t('navMore')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      data-nav-id="more"
    >
      <motion.span
        className="nav-icon-wrap"
        whileTap={motionEnabled ? { scale: 0.88 } : undefined}
        transition={NAV_SPRING}
        aria-hidden="true"
      >
        <Icon size={22} strokeWidth={isActive ? 2 : 1.75} className="nav-icon" />
      </motion.span>
      <span className="nav-short-label">{activeItem ? activeItem.shortLabel : t('navMore')}</span>
      <span className={`nav-active-dot${isActive ? ' is-visible' : ''}`} aria-hidden="true" />
    </button>
  );
}

export function ShellMobileDock({
  entries,
  activeOverflowItem,
  isOverflowOpen,
  activeTodaySessionId,
  motionEnabled,
  onPrefetch,
  onActivateTrain,
  onToggleOverflow,
}: ShellMobileDockProps) {
  return (
    <div className="modern-nav-links mobile-only-nav">
      {entries.map(entry =>
        entry.kind === 'action' ? (
          <DockTrainTab
            key={entry.id}
            entry={entry}
            activeTodaySessionId={activeTodaySessionId}
            motionEnabled={motionEnabled}
            onActivate={onActivateTrain}
          />
        ) : (
          <NavDestinationLink
            key={entry.id}
            item={entry}
            surface="dock"
            activeLayoutId="modern-nav-mobile-active-pill"
            motionEnabled={motionEnabled}
            onSelect={() => undefined}
            onPrefetch={() => onPrefetch(entry.id)}
          />
        ),
      )}

      <DockMoreTab
        activeItem={activeOverflowItem}
        isOpen={isOverflowOpen}
        motionEnabled={motionEnabled}
        onToggle={onToggleOverflow}
      />
    </div>
  );
}
