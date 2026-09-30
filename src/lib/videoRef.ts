/**
 * Pure, Firebase-free YouTube reference parsing.
 *
 * Replaces the loose `extractVideoId` that used to live inside
 * `InAppYouTubePlayer.tsx`. That version searched for the substring
 * `youtube.com/embed/`, which `youtube-nocookie.com/embed/` does not contain,
 * so 22 of the 28 curated `videoUrl` literals resolved to no video at all.
 *
 * Every pattern below is anchored to the whole input and to an explicit host
 * list, so `vimeo.com`, `javascript:`, `data:`, the protocol-relative
 * `//host/...` form and look-alike hosts such as `youtube.com.evil.test` are
 * all rejected rather than partially matched.
 */

export type VideoRefSource = 'bare-id' | 'watch' | 'youtu-be' | 'embed' | 'nocookie-embed' | 'shorts';

export interface ParsedVideoRef {
  readonly id: string;
  readonly source: VideoRefSource;
  readonly watchUrl: string;
}

const ID = '([A-Za-z0-9_-]{11})';
const SCHEME = 'https?:\\/\\/';
const YOUTUBE = '(?:www\\.|m\\.)?youtube\\.com';
const NOCOOKIE = '(?:www\\.)?youtube-nocookie\\.com';
const TAIL = '(?:[?#].*)?$';

const PATTERNS: readonly { source: VideoRefSource; pattern: RegExp }[] = Object.freeze([
  { source: 'nocookie-embed', pattern: new RegExp(`^${SCHEME}${NOCOOKIE}/embed/${ID}${TAIL}`, 'i') },
  { source: 'embed', pattern: new RegExp(`^${SCHEME}${YOUTUBE}/embed/${ID}${TAIL}`, 'i') },
  { source: 'watch', pattern: new RegExp(`^${SCHEME}${YOUTUBE}/watch\\?(?:[^#]*&)?v=${ID}(?:[&#].*)?$`, 'i') },
  { source: 'shorts', pattern: new RegExp(`^${SCHEME}${YOUTUBE}/shorts/${ID}${TAIL}`, 'i') },
  { source: 'youtu-be', pattern: new RegExp(`^${SCHEME}youtu\\.be/${ID}${TAIL}`, 'i') },
  { source: 'bare-id', pattern: new RegExp(`^${ID}$`) },
]);

export function parseVideoRef(input: unknown): ParsedVideoRef | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const { source, pattern } of PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return {
        id: match[1],
        source,
        watchUrl: `https://www.youtube.com/watch?v=${match[1]}`,
      };
    }
  }

  return null;
}

/**
 * Always rebuilds a fresh privacy-mode embed URL from the id alone, so a
 * `youtube.com/shorts/...` literal and a `youtube-nocookie.com/embed/...`
 * literal end up on the same player. `origin` is only forwarded when it is an
 * `http(s)` origin: on Capacitor the WebView origin is `capacitor://localhost`,
 * and passing that to a third-party iframe leaks the scheme and is rejected
 * by the player.
 */
export function buildEmbedUrl(videoId: string, origin?: string): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    iv_load_policy: '3',
    autoplay: '0',
    enablejsapi: '0',
  });
  if (typeof origin === 'string' && origin.startsWith('http')) {
    params.set('origin', origin);
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function watchUrlFor(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** The iframe's accessible name, in the language the surface is rendered in. */
export function tutorialTitle(exerciseName: string, isRTL: boolean): string {
  const prefix = isRTL ? 'فيديو:' : 'Video:';
  const name = exerciseName.trim();
  return name ? `${prefix} ${name}` : prefix;
}