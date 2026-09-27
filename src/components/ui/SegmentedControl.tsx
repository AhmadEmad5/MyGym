import { useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  layoutId?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  layoutId: customLayoutId
}: SegmentedControlProps<T>) {
  const generatedId = useId();
  const activeLayoutId = customLayoutId || `segmented-active-${generatedId}`;
  const sizeClasses = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm';
  const itemPadding = size === 'sm' ? 'py-1 px-2.5' : 'py-1.5 px-3.5';

  return (
    <div
      className={`inline-flex items-center bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-full ${sizeClasses} ${className}`.trim()}
      role="tablist"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <motion.button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.95 }}
            className={`relative inline-flex items-center justify-center gap-1.5 font-bold rounded-full transition-colors z-10 select-none touch-manipulation ${itemPadding} ${
              isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-full bg-[var(--surface-card-hover)] border border-[var(--border-card)] shadow-sm z-[-1]"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="text-[0.65rem] px-1.5 py-0.2 rounded-full bg-white/10 tabular-nums">
                {option.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
