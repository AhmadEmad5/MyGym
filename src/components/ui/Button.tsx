import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';
import { Pressable } from '../motion/Pressable';
import { MOTION_SCALE } from '../../lib/motion';

export type ButtonVariant = 'primary' | 'cyan' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'ui-button-primary',
  cyan: 'ui-button-cyan',
  secondary: 'ui-button-secondary',
  ghost: 'ui-button-ghost',
  danger: 'ui-button-danger',
  outline: 'ui-button-outline'
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'text-xs py-2 px-3.5 min-h-[44px]',
  md: 'text-sm py-2.5 px-4 min-h-[44px]',
  lg: 'text-base py-3 px-6 min-h-[48px]',
  icon: 'ui-button-icon p-2.5 min-h-[44px] min-w-[44px]'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref
) {
  const isInactive = disabled || isLoading;

  return (
    <Pressable
      as="button"
      ref={ref}
      type={type}
      scale={MOTION_SCALE.press}
      disabled={isInactive}
      aria-busy={isLoading || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        'ui-button inline-flex items-center justify-center',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && 'w-full',
        className
      )}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </Pressable>
  );
});
