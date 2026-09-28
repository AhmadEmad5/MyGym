import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '../ui/cn';

export interface QuietActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export function QuietAction({ children, className, ...props }: QuietActionProps) {
  return (
    <a className={cn('forma-quiet-action ui-focus-ring', className)} {...props}>
      <span>{children}</span>
      <span className="ui-directional-affordance" aria-hidden="true">
        &rarr;
      </span>
    </a>
  );
}
