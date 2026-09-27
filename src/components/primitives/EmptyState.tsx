import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <section className={`forma-empty-state ${className}`.trim()}>
      {icon && <div className="forma-empty-icon" aria-hidden="true">{icon}</div>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="forma-empty-action">{action}</div>}
    </section>
  );
}
