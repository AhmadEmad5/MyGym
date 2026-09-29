import { useRef, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';
import { ModernNavigationBar } from '../components/ModernNavigationBar';
import { SkipToContentLink } from '../components/layout/SkipToContentLink';
import { AmbientBackground } from '../components/AmbientBackground';

const MAIN_CONTENT_ID = 'forma-main-content';
const SCROLL_CONTAINER_SELECTOR = '.content-area';
const SKIP_LINK_SELECTOR = '.forma-skip-link';

interface AppShellProps {
  children: ReactNode;
  isInSession: boolean;
  hasActiveSession: boolean;
  isAdminRoute?: boolean;
}

export function AppShell({ children, isInSession, hasActiveSession, isAdminRoute }: AppShellProps) {
  const { isRTL } = useTranslation();
  const layoutRef = useRef<HTMLDivElement | null>(null);

  /**
   * The skip link focuses <main> and calls `scrollIntoView()` on it. <main> is
   * `overflow: hidden`, so it is not scrollable and the browser has nothing to
   * scroll - which means activating the skip link from halfway down a page
   * moved focus but left the reader exactly where they were, under the fixed
   * mobile chrome. Resetting the real scroller in the bubble phase (after the
   * link's own handler) lands the focused main region back at the top, clear of
   * the top bar. The canonical scroll memory picks the new offset up from the
   * resulting scroll event.
   */
  const handleSkipLink = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;
    if (!target.closest(SKIP_LINK_SELECTOR)) return;

    const scroller = layoutRef.current?.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
    if (scroller && scroller.scrollTop !== 0) {
      scroller.scrollTop = 0;
    }
  };

  if (isAdminRoute) {
    return <div className="admin-app-layout">{children}</div>;
  }

  const layoutClasses = [
    'app-layout',
    isInSession ? 'in-workout-session' : '',
    hasActiveSession ? 'has-live-bar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const mainClasses = ['main-content', isInSession ? 'in-workout-session-main' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={layoutClasses} ref={layoutRef} onClick={handleSkipLink}>
      <AmbientBackground />

      <SkipToContentLink
        targetId={MAIN_CONTENT_ID}
        label={isRTL ? 'تخطَّ إلى المحتوى' : 'Skip to main content'}
      />

      {!isInSession && <ModernNavigationBar />}

      <main id={MAIN_CONTENT_ID} className={mainClasses} tabIndex={-1}>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
