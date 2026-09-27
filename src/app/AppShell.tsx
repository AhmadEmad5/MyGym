import type { ReactNode } from 'react';
import { ModernNavigationBar } from '../components/ModernNavigationBar';

interface AppShellProps {
  children: ReactNode;
  isInSession: boolean;
  hasActiveSession: boolean;
  isAdminRoute?: boolean;
}

export function AppShell({ children, isInSession, hasActiveSession, isAdminRoute }: AppShellProps) {
  if (isAdminRoute) {
    return <div className="admin-app-layout">{children}</div>;
  }

  return (
    <div className={`app-layout ${isInSession ? 'in-workout-session' : ''} ${hasActiveSession ? 'has-live-bar' : ''}`}>
      {!isInSession && <ModernNavigationBar />}
      <main className={`main-content ${isInSession ? 'in-workout-session-main' : ''}`}>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
