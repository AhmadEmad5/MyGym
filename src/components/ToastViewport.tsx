import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { FeedbackMessage, feedbackEventName } from '../lib/feedback';

const MAX_VISIBLE = 4;
const TOAST_LIFETIME_MS = 5200;

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info
};

export function ToastViewport() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setMessages([]);
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    const onFeedback = (event: Event) => {
      const message = (event as CustomEvent<FeedbackMessage>).detail;
      setMessages((current) => {
        const next = [...current.filter((item) => item.id !== message.id), message];
        return next.slice(-MAX_VISIBLE);
      });
      const previous = timersRef.current.get(message.id);
      if (previous) window.clearTimeout(previous);
      timersRef.current.set(message.id, window.setTimeout(() => dismiss(message.id), TOAST_LIFETIME_MS));
    };

    window.addEventListener(feedbackEventName, onFeedback);
    return () => {
      window.removeEventListener(feedbackEventName, onFeedback);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [dismiss]);

  useEffect(() => {
    if (messages.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const target = event.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      dismissAll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [messages.length, dismissAll]);

  if (!messages.length) return null;

  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label="Notifications"
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          dismissAll();
        }
      }}
    >
      {messages.map((item) => {
        const Icon = icons[item.tone];
        const isError = item.tone === 'error';
        return (
          <div
            key={item.id}
            className={`toast toast-${item.tone}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-atomic="true"
            tabIndex={-1}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{item.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {messages.length > 1 ? `${messages.length} notifications` : ''}
      </span>
    </div>
  );
}
