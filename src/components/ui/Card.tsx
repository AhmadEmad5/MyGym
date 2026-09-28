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

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-[var(--text-primary)] tracking-tight m-0', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[var(--text-secondary)] m-0 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border-subtle)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}
