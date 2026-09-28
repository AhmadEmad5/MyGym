import type { ReactNode } from 'react';
import { useId } from 'react';
import { NorthlineRail } from './NorthlineRail';
import type { NorthlineItem, RouteId } from '../../types/ui';

interface PageFrameProps {
  routeId: RouteId;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  railItems?: NorthlineItem[];
  railLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageFrame({
  routeId,
  title,
  subtitle,
  eyebrow,
  railItems,
  railLabel,
  actions,
  children,
  className = '',
}: PageFrameProps) {
  const titleId = useId();
  const hasRail = Array.isArray(railItems) && railItems.length > 0;

  return (
    <div
      className={`forma-page-frame forma-route-${routeId} ${className}`.trim()}
      data-route={routeId}
    >
      <div className={`forma-page-grid${hasRail ? ' has-northline-rail' : ''}`}>
        {hasRail && <NorthlineRail items={railItems} label={railLabel} />}

        <div className="forma-page-main">
          <header className="forma-page-header" aria-labelledby={titleId}>
            <div className="forma-page-heading">
              {eyebrow && <span className="forma-page-eyebrow">{eyebrow}</span>}
              <h1 id={titleId}>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>

            {actions && (
              <div className="forma-page-actions" role="group" aria-label={title}>
                {actions}
              </div>
            )}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
