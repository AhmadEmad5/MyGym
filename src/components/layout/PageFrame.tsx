import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { NorthlineRail } from './NorthlineRail';
import type { NorthlineItem, RouteId } from '../../types/ui';

interface PageFrameProps {
  routeId: RouteId;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  railItems?: NorthlineItem[];
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
  actions,
  children,
  className = '',
}: PageFrameProps) {
  return (
    <motion.div
      className={`forma-page-frame forma-route-${routeId} ${className}`.trim()}
      data-route={routeId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, transform', transform: 'translateZ(0)' }}
    >
      <div className="forma-page-grid">
        {railItems && railItems.length > 0 && <NorthlineRail items={railItems} />}
        <div className="forma-page-main">
          <header className="forma-page-header">
            <div>
              {eyebrow && <span className="forma-page-eyebrow">{eyebrow}</span>}
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="forma-page-actions">{actions}</div>}
          </header>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
