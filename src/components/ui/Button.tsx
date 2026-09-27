import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    children,
    ...props
  },
  ref
) {
  const variantClass = {
    primary: 'ui-button-primary',
    cyan: 'ui-button-cyan',
    secondary: 'ui-button-secondary',
    ghost: 'ui-button-ghost',
    danger: 'ui-button-danger',
    outline: 'ui-button-secondary'
  }[variant];

  const sizeClass = {
    sm: 'text-xs py-2 px-3.5 min-h-[44px] inline-flex items-center justify-center',
    md: 'text-sm py-2.5 px-4 min-h-[44px] inline-flex items-center justify-center',
    lg: 'text-base py-3 px-6 min-h-[48px] inline-flex items-center justify-center',
    icon: 'ui-button-icon p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center'
  }[size];

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      disabled={disabled || isLoading}
      className={`ui-button ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </motion.button>
  );
});
