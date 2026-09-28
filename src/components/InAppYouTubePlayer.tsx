import { useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface InAppYouTubePlayerProps {
  exerciseName: string;
  targetMuscle?: string;
  initialVideoUrl?: string;
  isArabic?: boolean;
}

type LoadState = 'loading' | 'ready' | 'error';

function extractVideoId(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,})/i,
    /(?:youtu\.be\/)([\w-]{6,})/i,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{6,})/i,
    /^(?:[\w-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

function buildEmbedUrl(videoId: string, origin?: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    'iv_load_policy': '3'
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function InAppYouTubePlayer({ exerciseName, targetMuscle, initialVideoUrl, isArabic }: InAppYouTubePlayerProps) {
  const { t, isRTL } = useTranslation();
  const rtl = isArabic ?? isRTL;
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [origin] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.location.origin.startsWith('http') ? window.location.origin : undefined;
  });

  const videoId = extractVideoId(initialVideoUrl);
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
  const playerTitle = rtl ? `فيديو: ${exerciseName}` : `Video: ${exerciseName}`;

  if (!videoId) {
    return (
      <div className="forma-state-panel" role="status" style={{ borderRadius: '14px', minHeight: '180px' }}>
        <AlertTriangle size={22} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
        <strong>{rtl ? 'لا يوجد فيديو لهذا التمرين' : 'No video for this exercise'}</strong>
        <span>
          {targetMuscle
            ? `${rtl ? 'العضلة المستهدفة' : 'Target muscle'}: ${targetMuscle}. `
            : ''}
          {rtl ? 'اقرأ الإرشادات النصية بالأسفل.' : 'Read the written coaching cues below instead.'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="in-app-youtube-wrapper"
      style={{ position: 'relative' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <iframe
          key={videoId}
          src={buildEmbedUrl(videoId, origin)}
          title={playerTitle}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setLoadState('ready')}
          onError={() => setLoadState('error')}
        />

        {loadState === 'loading' && (
          <div className="forma-3d-overlay" role="status" aria-live="polite">
            <div>
              <span aria-hidden="true" className="forma-ai-cursor" style={{ margin: '0 auto 0.6rem' }} />
              <strong>{rtl ? 'جارٍ تحميل الفيديو' : 'Loading video'}</strong>
              <span>{rtl ? 'قد يستغرق التحميل لحظات...' : 'This can take a moment…'}</span>
            </div>
          </div>
        )}

        {loadState === 'error' && (
          <div className="forma-3d-overlay" role="alert">
            <div>
              <AlertTriangle size={26} aria-hidden="true" style={{ margin: '0 auto 0.6rem', color: 'var(--danger)' }} />
              <strong>{rtl ? 'تعذر تحميل الفيديو' : 'The video could not load'}</strong>
              <span>{rtl ? 'تحقق من اتصالك أو افتح الفيديو على يوتيوب.' : 'Check your connection or open it directly on YouTube.'}</span>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBlockStart: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="forma-3d-chip"
                  onClick={() => setLoadState('loading')}
                >
                  {rtl ? 'إعادة المحاولة' : 'Try again'}
                </button>
                <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="forma-3d-chip" style={{ textDecoration: 'none' }}>
                  <ExternalLink size={13} aria-hidden="true" />
                  <span>{rtl ? 'فتح في يوتيوب' : 'Open on YouTube'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap',
          marginBlockStart: '0.6rem',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span>{playerTitle}</span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="forma-3d-chip" style={{ textDecoration: 'none' }}>
          <ExternalLink size={13} aria-hidden="true" />
          <span>{rtl ? 'فتح في يوتيوب' : 'Watch on YouTube'}</span>
        </a>
      </div>

      <span className="forma-sr-only">{t('close')}</span>
    </div>
  );
}

export default InAppYouTubePlayer;
