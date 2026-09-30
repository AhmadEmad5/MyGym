import type { ReactNode } from 'react';

interface TodayTierProps {
  /** Matches the existing `today-tier` modifiers, e.g. `targets`, `recovery`. */
  name: string;
  /** Tones the kicker rule: `is-lime` for recovery, `is-emerald` for fuel. */
  tone?: 'is-lime' | 'is-emerald';
  titleId: string;
  label: string;
  /** The recovery tier is a scroll target, so its id stays on the section. */
  id?: string;
  children: ReactNode;
}

/**
 * One section of the Today dashboard: a labelled tier with the shared kicker
 * rule above it.
 *
 * This was open-coded three times in TodayView. Only the `section` wrapper,
 * the `aria-labelledby` pairing and the kicker rule are shared; each caller
 * owns everything inside. The training tier is deliberately not routed through
 * here - it labels itself with a visually hidden `h2` instead of a kicker, and
 * forcing that into the same shape would have added a branch to save one call
 * site.
 */
export function TodayTier({ name, tone, titleId, label, id, children }: TodayTierProps) {
  return (
    <section id={id} className={`today-tier today-tier-${name}`} aria-labelledby={titleId}>
      <p className={`today-tier-kicker${tone ? ` ${tone}` : ''}`} id={titleId}>
        <span className="today-tier-kicker-line" aria-hidden="true" />
        {label}
      </p>
      {children}
    </section>
  );
}
