import type { ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';
import { ModernNavigationBar } from '../components/ModernNavigationBar';
import { SkipToContentLink } from '../components/layout/SkipToContentLink';

const MAIN_CONTENT_ID = 'forma-main-content';

interface AppShellProps {
  children: ReactNode;
  isInSession: boolean;
  hasActiveSession: boolean;
  isAdminRoute?: boolean;
}

export function AppShell({ children, isInSession, hasActiveSession, isAdminRoute }: AppShellProps) {
  const { isRTL } = useTranslation();

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
    <div className={layoutClasses}>
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
