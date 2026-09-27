import type { SaveState } from '../../types/ui';

interface InlineSaveStatusProps {
  state: SaveState;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
}

export function InlineSaveStatus({
  state,
  savingLabel = 'Saving',
  savedLabel = 'Saved',
  errorLabel = 'Try again',
}: InlineSaveStatusProps) {
  if (state === 'idle') return null;
  const label = state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : errorLabel;
  return <span className={`forma-save-status is-${state}`} role="status">{label}</span>;
}
