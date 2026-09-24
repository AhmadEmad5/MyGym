import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, isChunkError: false };

  public static getDerivedStateFromError(error: Error): State {
    const isChunkError = 
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    return { hasError: true, error, isChunkError: Boolean(isChunkError) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);

    const isChunkError = 
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    // Auto-reload once if a new deployment caused a stale chunk error
    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_auto_reload_time');
      const now = Date.now();
      if (!lastReload || (now - parseInt(lastReload, 10)) > 15000) {
        sessionStorage.setItem('chunk_auto_reload_time', now.toString());
        this.handleClearAndReload();
      }
    }
  }

  public handleClearAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
    this.handleClearAndReload();
  };

  public render() {
    if (this.state.hasError) {
      const { isChunkError, error } = this.state;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '1.5rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: `1px solid ${isChunkError ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '1.25rem',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: isChunkError ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isChunkError ? '#3b82f6' : '#ef4444',
              marginBottom: '1rem'
            }}>
              {isChunkError ? (
                <Sparkles style={{ width: '2.5rem', height: '2.5rem' }} />
              ) : (
                <AlertTriangle style={{ width: '2.5rem', height: '2.5rem' }} />
              )}
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {isChunkError ? 'New Update Available' : 'Something went wrong'}
            </h2>
            
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              {isChunkError 
                ? 'A fresh update of MyGym was deployed. Click below to load the latest version.'
                : 'An unexpected application error occurred. Your workouts and routines remain safely saved.'}
            </p>

            {error && !isChunkError && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#f87171',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                maxHeight: '100px'
              }}>
                {error.message}
              </div>
            )}

            <button
              onClick={this.handleClearAndReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                borderRadius: '0.75rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              {isChunkError ? 'Update & Reload' : 'Reload Application'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
