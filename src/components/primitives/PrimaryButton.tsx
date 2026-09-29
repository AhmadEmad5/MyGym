import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../ui/cn';
import { Pressable } from '../motion/Pressable';
import { MOTION_SCALE } from '../../lib/motion';

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(function PrimaryButton(
  { children, icon, isLoading = false, className, disabled, type = 'button', ...props },
  ref
) {
  const isInactive = disabled || isLoading;

  return (
    <Pressable
      as="button"
      ref={ref}
      type={type}
      scale={MOTION_SCALE.pressPrimary}
      disabled={isInactive}
      aria-busy={isLoading || undefined}
      className={cn('forma-primary-button ui-focus-ring', className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        icon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <span>{children}</span>
    </Pressable>
  );
});
