import type { SaveState } from '../../types/ui';
import { cn } from '../ui/cn';

export interface InlineSaveStatusProps {
  state: SaveState;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
  className?: string;
}

const STATE_CLASS: Record<Exclude<SaveState, 'idle'>, string> = {
  saving: 'text-[var(--accent-cyan)]',
  saved: 'text-[var(--accent-emerald)]',
  error: 'text-[var(--color-danger-ink)]'
};

export function InlineSaveStatus({
  state,
  savingLabel = 'Saving',
  savedLabel = 'Saved',
  errorLabel = 'Try again',
  className
}: InlineSaveStatusProps) {
  if (state === 'idle') return null;
  const label = state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : errorLabel;
  return (
    <span
      className={cn('forma-save-status', `is-${state}`, STATE_CLASS[state], className)}
      role="status"
      aria-live={state === 'error' ? 'assertive' : 'polite'}
    >
      {label}
    </span>
  );
}
