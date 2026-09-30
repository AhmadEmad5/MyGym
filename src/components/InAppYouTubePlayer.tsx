import { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { buildEmbedUrl, parseVideoRef, tutorialTitle } from '../lib/videoRef';
import { useReducedMotion } from './performance/useReducedMotion';

interface InAppYouTubePlayerProps {
  exerciseName: string;
  targetMuscle?: string;
  initialVideoUrl?: string;
  isArabic?: boolean;
  /** Written coaching cues, rendered outside and below the player as the guaranteed text alternative. */
  steps?: string[];
}

type LoadState = 'loading' | 'ready' | 'error';

/**
 * A cross-origin iframe does not reliably fire `onError`, so the error UI can
 * never depend on it alone. This budget is what makes a blocked or dead load
 * actually reach the error state.
 */
const LOAD_TIMEOUT_MS = 6000;

const ALLOW =
  'accelerometer; clipboard-write; encrypted-media; picture-in-picture; web-share';

export function InAppYouTubePlayer({
  exerciseName,
  targetMuscle,
  initialVideoUrl,
  isArabic,
  steps,
}: InAppYouTubePlayerProps) {
  const { t, isRTL } = useTranslation();
  const reducedMotion = useReducedMotion();
  const rtl = isArabic ?? isRTL;
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [attempt, setAttempt] = useState(0);
  const [origin] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.location.origin.startsWith('http') ? window.location.origin : undefined;
  });

  const videoId = parseVideoRef(initialVideoUrl)?.id ?? '';
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
  const playerTitle = tutorialTitle(exerciseName, rtl);
  const cues = steps;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!videoId || loadState !== 'loading') return;
    timerRef.current = setTimeout(() => setLoadState('error'), LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [videoId, loadState, attempt]);

  useEffect(() => {
    if (videoId) setLoadState('loading');
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="forma-tutorial-surface forma-state-panel" role="status" data-load-state="absent" style={{ borderRadius: '14px', minHeight: '180px' }}>
        <AlertTriangle size={22} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
        <strong>{t('tutorialNoVideoTitle')}</strong>
        <span>
          {targetMuscle
            ? `${t('tutorialTargetMuscle')}: ${targetMuscle}. `
            : ''}
          {t('tutorialReadCuesInstead')}
        </span>
      </div>
    );
  }

  return (
    <div
      className={reducedMotion ? 'forma-tutorial-surface in-app-youtube-wrapper is-static' : 'forma-tutorial-surface in-app-youtube-wrapper'}
      data-load-state={loadState}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
    >
      <div className="forma-tutorial-frame">
        <iframe
          key={`${videoId}-${attempt}`}
          className="forma-tutorial-iframe"
          src={buildEmbedUrl(videoId, origin)}
          title={playerTitle}
          allow={ALLOW}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setLoadState('ready')}
          onError={() => setLoadState('error')}
        />

        {loadState === 'loading' && (
          <div className="forma-3d-overlay" role="status" aria-live="polite">
            <div>
              <span aria-hidden="true" className="forma-ai-cursor" style={{ margin: '0 auto 0.6rem' }} />
              <strong>{t('tutorialLoadingTitle')}</strong>
              <span>{t('tutorialLoadingBody')}</span>
            </div>
          </div>
        )}

        {loadState === 'error' && (
          <div className="forma-3d-overlay" role="alert">
            <div>
              <AlertTriangle size={26} aria-hidden="true" style={{ margin: '0 auto 0.6rem', color: 'var(--color-danger-ink)' }} />
              <strong>{t('tutorialErrorTitle')}</strong>
              <span>{t('tutorialErrorBody')}</span>
              <div className="forma-tutorial-actions">
                <button
                  type="button"
                  className="forma-3d-chip"
                  onClick={() => { setLoadState('loading'); setAttempt(prev => prev + 1); }}
                >
                  {t('tutorialRetry')}
                </button>
                <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="forma-3d-chip">
                  <ExternalLink size={13} aria-hidden="true" />
                  <span>{t('tutorialOpenOnYouTube')}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="forma-tutorial-meta">
        <span>{playerTitle}</span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="forma-3d-chip">
          <ExternalLink size={13} aria-hidden="true" />
          <span>{t('tutorialWatchOnYouTube')}</span>
        </a>
      </div>

      {cues && cues.length > 0 && (
        <div className="forma-tutorial-cues" data-revealed="true">
          <h4 className="forma-tutorial-cues-title">{t('tutorialCuesTitle')}</h4>
          <ol className="forma-tutorial-cues-list">
            {cues.map((cue, index) => (
              <li key={index} className="forma-tutorial-cues-item">{cue}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default InAppYouTubePlayer;
