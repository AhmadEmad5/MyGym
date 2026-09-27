export type FeedbackTone = 'success' | 'error' | 'info' | 'warning';

export type FeedbackMessage = {
  id: string;
  message: string;
  tone: FeedbackTone;
};

const EVENT_NAME = 'mygym:feedback';

/** Dispatches non-blocking, accessible feedback without coupling domain code to React. */
export function notify(message: string, tone: FeedbackTone = 'info') {
  if (typeof window === 'undefined' || !message.trim()) return;
  window.dispatchEvent(new CustomEvent<FeedbackMessage>(EVENT_NAME, {
    detail: { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, tone }
  }));
}

export const feedbackEventName = EVENT_NAME;
