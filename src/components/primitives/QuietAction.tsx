import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface QuietActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export function QuietAction({ children, className = '', ...props }: QuietActionProps) {
  return (
    <a className={`forma-quiet-action ${className}`.trim()} {...props}>
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
}
