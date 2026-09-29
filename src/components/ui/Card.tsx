import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CardVariant = 'default' | 'interactive' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: 'ui-card',
  interactive: 'ui-card ui-card-interactive',
  glass: 'ui-card ui-card-glass'
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn(VARIANT_CLASS[variant], 'p-5', className)} {...props}>
      {children}
    </div>
  );
});

