import { useMemo } from 'react';

interface InAppYouTubePlayerProps {
  exerciseName: string;
  initialVideoUrl?: string;
  targetMuscle?: string;
  compact?: boolean;
  autoPlay?: boolean;
}

/**
 * YouTube video thumbnail with play button.
 * Opens the video directly on YouTube when clicked.
 */
export function InAppYouTubePlayer({
  exerciseName,
  initialVideoUrl,
}: InAppYouTubePlayerProps) {

  const videoId = useMemo(() => {
    if (!initialVideoUrl) return null;
    const url = initialVideoUrl.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts) return shorts[1];

    const embed = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embed) return embed[1];

    const standard = url.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/);
    if (standard) return standard[1];

    return null;
  }, [initialVideoUrl]);

  if (!videoId) {
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' form tutorial')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '100%',
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          borderRadius: 12,
          color: '#6366f1',
          fontSize: '0.85rem',
          textDecoration: 'none',
          gap: '0.4rem',
        }}
      >
        🔍 Search "{exerciseName}" on YouTube
      </a>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <a
      href={youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
        position: 'relative',
        textDecoration: 'none',
      }}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={exerciseName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
      }} />

      {/* YouTube play button */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
      }}>
        <svg width="68" height="48" viewBox="0 0 68 48">
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            fill="#FF0000"
          />
          <path d="M45 24L27 14v20" fill="#fff" />
        </svg>
      </div>

      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 600,
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
      }}>
        ▶ {exerciseName}
      </div>
    </a>
  );
}
