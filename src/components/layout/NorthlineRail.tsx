import { motion } from 'framer-motion';
import type { NorthlineItem } from '../../types/ui';

interface NorthlineRailProps {
  items: NorthlineItem[];
  orientation?: 'vertical' | 'horizontal';
  label?: string;
}

export function NorthlineRail({ items, orientation = 'vertical', label = 'Route progress' }: NorthlineRailProps) {
  return (
    <div
      className={`northline-rail northline-rail-${orientation}`}
      role="list"
      aria-label={label}
    >
      <span className="northline-rail-line" aria-hidden="true" />
      {items.map((item) => (
        <motion.div
          key={item.id}
          className={`northline-rail-item northline-status-${item.status}`}
          role="listitem"
          layout
        >
          <span className="northline-rail-marker" aria-hidden="true" />
          <span className="northline-rail-copy">
            <strong>{item.label}</strong>
            {item.meta && <small>{item.meta}</small>}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
