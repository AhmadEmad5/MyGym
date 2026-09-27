import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'interactive' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className = '', children, ...props },
  ref
) {
  const variantClass = {
    default: 'ui-card',
    interactive: 'ui-card ui-card-interactive',
    glass: 'ui-card ui-card-glass'
  }[variant];

  return (
    <div ref={ref} className={`${variantClass} p-5 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
});

export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col gap-1.5 mb-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-bold text-[var(--text-primary)] tracking-tight m-0 ${className}`.trim()} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-[var(--text-secondary)] m-0 leading-relaxed ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border-subtle)] ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
