import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { FeedbackMessage, feedbackEventName } from '../lib/feedback';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info
};

export function ToastViewport() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    const onFeedback = (event: Event) => {
      const message = (event as CustomEvent<FeedbackMessage>).detail;
      setMessages(current => [...current.slice(-3), message]);
      window.setTimeout(() => setMessages(current => current.filter(item => item.id !== message.id)), 5000);
    };
    window.addEventListener(feedbackEventName, onFeedback);
    return () => window.removeEventListener(feedbackEventName, onFeedback);
  }, []);

  if (!messages.length) return null;
  return <div className="toast-viewport" aria-live="polite" aria-atomic="true">
    {messages.map(item => {
      const Icon = icons[item.tone];
      return <div className={`toast toast-${item.tone}`} key={item.id} role={item.tone === 'error' ? 'alert' : 'status'}>
        <Icon size={19} aria-hidden="true" />
        <span>{item.message}</span>
        <button type="button" className="toast-dismiss" aria-label="Dismiss notification" onClick={() => setMessages(current => current.filter(message => message.id !== item.id))}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>;
    })}
  </div>;
}
