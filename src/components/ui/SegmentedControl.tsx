import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from './cn';
import { useReducedMotion } from '../performance/useReducedMotion';
import { useRovingRadioGroup } from './useRovingRadioGroup';
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
  'aria-labelledby'?: string;
  /** Forces the writing direction; when omitted it is read from the DOM. */
  dir?: 'ltr' | 'rtl';
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  layoutId: customLayoutId,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  dir
}: SegmentedControlProps<T>) {
  const generatedId = useId();
  const activeLayoutId = customLayoutId || `segmented-active-${generatedId}`;
  const sizeClasses = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm';
  const itemPadding = size === 'sm' ? 'py-1 px-2.5' : 'py-1.5 px-3.5';
  const reduced = useReducedMotion();
  const motionEnabled = !reduced;
  // A segmented control picks exactly one option out of a set; it never reveals a
  // panel, so `radiogroup` is the honest role. `tablist` promises a tabpanel and
  // `aria-controls` target that does not exist here.
  const { containerRef, handleKeyDown, tabIndexFor, registerOption } = useRovingRadioGroup({
    items: options,
    value,
    onChange,
    dir
  });
  // `layout="position"` keeps the thumb on the compositor: framer corrects
  // position only and never animates the trigger's width/height, so switching
  // segments can never reflow the surrounding page.
  const indicatorTransition = resolveTransition({ type: 'spring', stiffness: 500, damping: 36 }, motionEnabled);
  const pressTransition = resolveTransition({ duration: 0.12, ease: [0.22, 1, 0.36, 1] }, motionEnabled);

  return (
    <div
      ref={containerRef}
      className={cn('ui-segmented items-center border rounded-full', sizeClasses, className)}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <motion.button
            key={String(option.value)}
            ref={(node) => registerOption(index, node)}
            type="button"
            role="radio"
            id={`${activeLayoutId}-option-${index}`}
            aria-checked={isSelected}
            aria-label={option['aria-label']}
            disabled={option.disabled}
            tabIndex={tabIndexFor(index)}
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
