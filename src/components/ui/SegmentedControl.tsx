import { useCallback, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';
import { useReducedMotion } from '../performance/useReducedMotion';
import { MOTION_SCALE, resolveTransition } from '../../lib/motion';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  'aria-label'?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  layoutId?: string;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  layoutId: customLayoutId,
  'aria-label': ariaLabel
}: SegmentedControlProps<T>) {
  const generatedId = useId();
  const activeLayoutId = customLayoutId || `segmented-active-${generatedId}`;
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sizeClasses = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm';
  const itemPadding = size === 'sm' ? 'py-1 px-2.5' : 'py-1.5 px-3.5';
  const reduced = useReducedMotion();
  const motionEnabled = !reduced;
  // `layout="position"` keeps the thumb on the compositor: framer corrects
  // position only and never animates the trigger's width/height, so switching
  // segments can never reflow the surrounding page.
  const indicatorTransition = resolveTransition({ type: 'spring', stiffness: 500, damping: 36 }, motionEnabled);
  const pressTransition = resolveTransition({ duration: 0.12, ease: [0.22, 1, 0.36, 1] }, motionEnabled);

  const focusOption = useCallback(
    (index: number) => {
      const step = index >= options.length ? 0 : index < 0 ? options.length - 1 : index;
      const next = options[step];
      if (!next || next.disabled) return;
      onChange(next.value);
      triggerRefs.current[step]?.focus();
    },
    [onChange, options]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((option) => option.value === value);
    if (currentIndex < 0) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(currentIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    }
  };

  return (
    <div
      className={cn('ui-segmented items-center border rounded-full', sizeClasses, className)}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <motion.button
            key={String(option.value)}
            ref={(node) => {
              triggerRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${activeLayoutId}-tab-${index}`}
            aria-selected={isSelected}
            aria-label={option['aria-label']}
            disabled={option.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            whileTap={option.disabled || !motionEnabled ? undefined : { scale: MOTION_SCALE.pressControl }}
            transition={pressTransition}
            className={cn(
              'ui-segmented-trigger',
              itemPadding,
              !isSelected && 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
          >
            {isSelected && (
              <motion.span
                layoutId={activeLayoutId}
                layout="position"
                initial={false}
                aria-hidden="true"
                className="ui-segmented-indicator"
                transition={indicatorTransition}
              />
            )}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="text-[0.65rem] px-1.5 py-0.2 rounded-full bg-[var(--surface-elevated)] tabular-nums">
                {option.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
