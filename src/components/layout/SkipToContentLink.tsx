import type { MouseEvent } from 'react';

interface SkipToContentLinkProps {
  targetId: string;
  label: string;
}

export function SkipToContentLink({ targetId, label }: SkipToContentLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });

    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <a className="forma-skip-link" href={`#${targetId}`} onClick={handleClick}>
      {label}
    </a>
  );
}
