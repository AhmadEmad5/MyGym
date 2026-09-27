import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(function PrimaryButton(
  { children, icon, className = '', ...props },
  ref,
) {
  return (
    <button ref={ref} className={`forma-primary-button ${className}`.trim()} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
});
