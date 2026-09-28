import { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Dumbbell,
  Home,
  RefreshCw,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

type Locale = 'ar' | 'en';

type Copy = {
  updateBadge: string;
  updateTitle: string;
  updateBody: string;
  updateCta: string;
  errorBadge: string;
  errorTitle: string;
  errorBody: string;
  errorHint: string;
  safeNote: string;
  retry: string;
  reset: string;
  home: string;
  supportId: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    updateBadge: 'Update available',
    updateTitle: 'A fresher FORMA is ready',
    updateBody:
      'We shipped a new version while this tab was open. Reload to pick up the latest build — your training data stays exactly where it is.',
    updateCta: 'Update and reload',
    errorBadge: 'Recovery screen',
    errorTitle: 'This screen hit a snag',
    errorBody:
      'Something in this view did not render correctly. Your workouts, routines, and logs are still saved and untouched.',
    errorHint: 'Try again first. If it keeps happening, reset the local cache and start from a clean build.',
    safeNote: 'Nothing was deleted',
    retry: 'Try again',
    reset: 'Reset cache & reload',
    home: 'Back to Today',
    supportId: 'Reference'
  },
  ar: {
    updateBadge: 'تحديث متاح',
    updateTitle: 'نسخة FORMA أحدث جاهزة',
    updateBody:
      'تم نشر إصدار جديد أثناء فتح هذه الصفحة. أعد التحميل للحصول على أحدث نسخة، وستبقى بيانات تدريبك كما هي.',
    updateCta: 'تحديث وإعادة تحميل',
    errorBadge: 'شاشة استرجاع',
    errorTitle: 'واجهت هذه الشاشة مشكلة',
    errorBody:
      'تعذّر عرض جزء من هذه الشاشة بشكل صحيح. تمارينك وجداولك وسجلاتك ما زالت محفوظة ولم تتأثر.',
    errorHint: 'جرّب أولاً. إذا تكررت المشكلة، امسح ذاكرة التخزين المؤقتة وابدأ من نسخة نظيفة.',
    safeNote: 'لم يتم حذف أي شيء',
    retry: 'إعادة المحاولة',
    reset: 'مسح الذاكرة وإعادة التحميل',
    home: 'العودة إلى اليوم',
    supportId: 'المرجع'
  }
};

const isChunkFailure = (error: Error | null) =>
  Boolean(
    error &&
      (error.message.includes('dynamically imported module') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Loading chunk') ||
        error.name === 'ChunkLoadError')
  );

const readLocale = (): Locale =>
  typeof document !== 'undefined' && document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, isChunkError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isChunkError: isChunkFailure(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    if (isChunkFailure(error)) this.maybeAutoReload();
  }

  private maybeAutoReload() {
    try {
      const lastReload = sessionStorage.getItem('chunk_auto_reload_time');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('chunk_auto_reload_time', now.toString());
        this.reload();
      }
    } catch {
      this.reload();
    }
  }

  public reload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
    window.location.reload();
  };

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  public handleGoHome = () => {
    this.handleRetry();
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/today');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  private buildReference(): string | null {
    const error = this.state.error;
    if (!error) return null;
    const name = (error.name || 'Error').replace(/[^a-z0-9]/gi, '');
    const hint = error.message.replace(/\s+/g, ' ').trim().slice(0, 40);
    return `${name}-${hint || 'unknown'}`.slice(0, 56);
  }

  public render() {
    if (!this.state.hasError) return this.props.children;

    const { isChunkError } = this.state;
    const locale = readLocale();
    const copy = COPY[locale];
    const tone = isChunkError ? 'is-info' : 'is-danger';
    const toneRing = isChunkError
      ? 'border-[color-mix(in_srgb,var(--accent-cyan)_38%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] text-[var(--accent-cyan)]'
      : 'border-[color-mix(in_srgb,var(--accent-rose)_42%,transparent)] bg-[color-mix(in_srgb,var(--accent-rose)_14%,transparent)] text-[var(--accent-rose)]';
    const reference = this.buildReference();

    return (
      <div
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[var(--surface-canvas)] px-4 py-[max(1.5rem,env(safe-area-inset-top,0px))] text-[var(--text-primary)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -start-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_16%,transparent)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -end-24 h-[26rem] w-[26rem] rounded-full bg-[color-mix(in_srgb,var(--accent-purple)_14%,transparent)] blur-3xl"
        />

        <div className="relative w-full max-w-[42rem] overflow-hidden rounded-[1.75rem] border border-[var(--border-card)] bg-[var(--surface-card)] shadow-[var(--shadow-modal)]">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--accent-cyan),var(--accent-purple))] text-[var(--text-inverted)]">
                <Dumbbell size={16} aria-hidden="true" />
              </span>
              <span className="text-[0.95rem] font-black tracking-[0.14em] text-[var(--text-primary)]">FORMA</span>
              <span className="rounded-full border border-[var(--border-card)] px-2 py-0.5 text-[0.6rem] font-extrabold tracking-[0.16em] text-[var(--text-muted)]">
                PRO
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent-emerald)_34%,transparent)] bg-[color-mix(in_srgb,var(--accent-emerald)_12%,transparent)] px-2.5 py-1 text-[0.7rem] font-bold text-[var(--accent-emerald)]">
              <CheckCircle2 size={12} aria-hidden="true" />
              {copy.safeNote}
            </span>
          </header>

          <main className="flex flex-col items-center gap-3 px-6 py-9 text-center sm:px-10 sm:py-11">
            <span
              role="status"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.7rem] font-extrabold tracking-[0.1em] uppercase ${toneRing}`}
            >
              {isChunkError ? <Sparkles size={13} aria-hidden="true" /> : <AlertTriangle size={13} aria-hidden="true" />}
              {isChunkError ? copy.updateBadge : copy.errorBadge}
            </span>

            <div className={`grid h-16 w-16 place-items-center rounded-[1.25rem] border ${toneRing}`}>
              {isChunkError ? <CloudOff size={30} aria-hidden="true" /> : <AlertTriangle size={30} aria-hidden="true" />}
            </div>

            <h1 className="m-0 text-[clamp(1.5rem,4.5vw,2rem)] font-black tracking-[-0.03em] text-[var(--text-primary)]">
              {isChunkError ? copy.updateTitle : copy.errorTitle}
            </h1>
            <p className="m-0 max-w-[34rem] text-[0.92rem] leading-relaxed text-[var(--text-secondary)]">
              {isChunkError ? copy.updateBody : copy.errorBody}
            </p>

            {!isChunkError && (
              <p className="m-0 flex max-w-[34rem] items-start gap-2 rounded-[0.9rem] border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3.5 py-2.5 text-start text-[0.8rem] leading-relaxed text-[var(--text-muted)]">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--accent-emerald)]" aria-hidden="true" />
                <span>{copy.errorHint}</span>
              </p>
            )}

            <div className="mt-2 flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={isChunkError ? this.reload : this.handleRetry}
                autoFocus
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-cyan),var(--accent-purple))] px-6 text-[0.9rem] font-extrabold text-[var(--text-inverted)] transition-transform hover:-translate-y-0.5"
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>{isChunkError ? copy.updateCta : copy.retry}</span>
              </button>

              {!isChunkError && (
                <button
                  type="button"
                  onClick={this.reload}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--surface-input)] px-5 text-[0.88rem] font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-card-hover)]"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  <span>{copy.reset}</span>
                </button>
              )}

              <button
                type="button"
                onClick={this.handleGoHome}
                className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[0.88rem] font-bold ${tone} transition-colors hover:bg-[var(--surface-card-hover)]`}
              >
                <Home size={16} aria-hidden="true" />
                <span>{copy.home}</span>
              </button>
            </div>

            {reference && (
              <p className="m-0 mt-1 flex items-center gap-2 text-[0.7rem] text-[var(--text-muted)]">
                <span className="uppercase tracking-[0.14em]">{copy.supportId}</span>
                <code className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-input)] px-2 py-0.5 font-mono text-[0.68rem] text-[var(--text-secondary)]">
                  {reference}
                </code>
              </p>
            )}
          </main>
        </div>
      </div>
    );
  }
}
