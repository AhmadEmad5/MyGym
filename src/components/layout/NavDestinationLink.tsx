import type { MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ShellNavItem } from './navModel';
import { NAV_SPRING } from './navMotion';

export type NavSurface = 'desktop' | 'dock' | 'overflow';

interface NavDestinationLinkProps {
  item: ShellNavItem;
  surface: NavSurface;
  activeLayoutId: string | null;
  motionEnabled: boolean;
  onSelect: () => void;
  onPrefetch: () => void;
}

const BADGE_CAP = 99;

function ActivePill({ layoutId, variant }: { layoutId: string; variant: 'desktop' | 'dock' }) {
  if (variant === 'desktop') {
    return (
      <motion.div layoutId={layoutId} className="modern-nav-active-bg" transition={NAV_SPRING} aria-hidden="true">
        <div className="active-top-beam" />
      </motion.div>
    );
  }

  return (
    <motion.div layoutId={layoutId} className="modern-nav-mobile-active-bg" transition={NAV_SPRING} aria-hidden="true" />
  );
}

function NavBadge({ value, surface }: { value: number; surface: NavSurface }) {
  const capped = surface === 'dock' && value > BADGE_CAP ? `${BADGE_CAP}+` : value;
  return <span className="nav-icon-badge">{capped}</span>;
}

export function NavDestinationLink({
  item,
  surface,
  activeLayoutId,
  motionEnabled,
  onSelect,
  onPrefetch,
}: NavDestinationLinkProps) {
  const Icon = item.icon;
  const isActive = item.isActive;
  const className = `${surface === 'overflow' ? 'more-sheet-item' : 'modern-nav-item'}${isActive ? ' is-active' : ''}`;
  const hasBadge = typeof item.badge === 'number' && item.badge > 0;

  const prefetchHandlers = {
    onMouseEnter: onPrefetch,
    onFocus: onPrefetch,
    onTouchStart: onPrefetch,
  };

  if (surface === 'overflow') {
    return (
      <NavLink
        to={item.to}
        onClick={onSelect}
        aria-current={isActive ? 'page' : undefined}
        className={className}
        {...prefetchHandlers}
      >
        <span className="more-sheet-item-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="more-sheet-item-copy">
          <strong>{item.label}</strong>
          <small>{item.description}</small>
        </span>
        <ChevronRight size={16} className="more-sheet-item-chevron" aria-hidden="true" />
      </NavLink>
    );
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onSelect();
    onPrefetch();
    if (!isActive) return;

    event.preventDefault();
    const container = document.querySelector<HTMLElement>('.content-area');
    if (!container) return;
    container.scrollTo({ top: 0, behavior: motionEnabled ? 'smooth' : 'auto' });
  };

  return (
    <NavLink
      to={item.to}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={hasBadge ? `${item.label} (${item.badge})` : item.label}
      className={className}
      data-nav-id={item.id}
      {...prefetchHandlers}
    >
      {isActive && motionEnabled && activeLayoutId && (
        <ActivePill layoutId={activeLayoutId} variant={surface} />
      )}

      <motion.span
        className="nav-icon-wrap"
        aria-hidden="true"
        whileHover={surface === 'desktop' && motionEnabled ? { scale: 1.14, rotate: isActive ? 0 : 5 } : undefined}
        whileTap={motionEnabled ? { scale: 0.88 } : undefined}
        transition={NAV_SPRING}
      >
        <Icon size={surface === 'desktop' ? 17 : 22} strokeWidth={surface === 'desktop' ? 2 : isActive ? 2 : 1.75} className="nav-icon" />
        {hasBadge && <NavBadge value={item.badge as number} surface={surface} />}
      </motion.span>

      {surface === 'desktop' ? (
        <>
          <span className="nav-label">{item.label}</span>
          {isActive && motionEnabled && (
            <motion.span layoutId="nav-active-dot" className="nav-active-dot" transition={NAV_SPRING} aria-hidden="true" />
          )}
        </>
      ) : (
        <>
          <span className="nav-short-label">{item.shortLabel}</span>
          <span className={`nav-active-dot${isActive ? ' is-visible' : ''}`} aria-hidden="true" />
        </>
      )}
    </NavLink>
  );
}
