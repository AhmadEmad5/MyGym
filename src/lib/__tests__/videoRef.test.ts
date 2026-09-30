import { describe, expect, it } from 'vitest';
import { EXERCISE_DATABASE } from '../exerciseDatabase';
import { buildEmbedUrl, parseVideoRef, tutorialTitle, watchUrlFor } from '../videoRef';

const ID = '_FkbD0FhgVE';

describe('parseVideoRef accepted forms (Y-01, Y-02)', () => {
  it('Y-01 accepts a bare 11 character id', () => {
    expect(parseVideoRef(ID)).toEqual({
      id: ID,
      source: 'bare-id',
      watchUrl: `https://www.youtube.com/watch?v=${ID}`,
    });
  });

  it('Y-02 accepts youtube.com/watch?v=', () => {
    expect(parseVideoRef(`https://www.youtube.com/watch?v=${ID}`)).toMatchObject({ id: ID, source: 'watch' });
    expect(parseVideoRef(`http://youtube.com/watch?v=${ID}`)).toMatchObject({ id: ID, source: 'watch' });
    expect(parseVideoRef(`https://m.youtube.com/watch?v=${ID}`)).toMatchObject({ id: ID, source: 'watch' });
    expect(parseVideoRef(`https://www.youtube.com/watch?feature=share&v=${ID}`)).toMatchObject({ id: ID, source: 'watch' });
    expect(parseVideoRef(`https://www.youtube.com/watch?v=${ID}&t=42s`)).toMatchObject({ id: ID, source: 'watch' });
  });

  it('Y-02 accepts youtu.be/', () => {
    expect(parseVideoRef(`https://youtu.be/${ID}`)).toMatchObject({ id: ID, source: 'youtu-be' });
    expect(parseVideoRef(`https://youtu.be/${ID}?t=30`)).toMatchObject({ id: ID, source: 'youtu-be' });
  });

  it('Y-02 accepts www.youtube.com/embed/', () => {
    expect(parseVideoRef(`https://www.youtube.com/embed/${ID}`)).toMatchObject({ id: ID, source: 'embed' });
  });

  it('Y-02 accepts youtube-nocookie.com/embed/, the host the old parser missed', () => {
    expect(parseVideoRef(`https://www.youtube-nocookie.com/embed/${ID}`)).toMatchObject({
      id: ID,
      source: 'nocookie-embed',
    });
  });

  it('Y-02 accepts youtube.com/shorts/', () => {
    expect(parseVideoRef(`https://www.youtube.com/shorts/${ID}`)).toMatchObject({ id: ID, source: 'shorts' });
  });

  it('Y-02 trims surrounding whitespace', () => {
    expect(parseVideoRef(`   https://www.youtube.com/shorts/${ID}  `)).toMatchObject({ id: ID });
  });
});

describe('parseVideoRef rejections (Y-03)', () => {
  const rejected: readonly string[] = [
    'https://vimeo.com/123456789',
    'https://www.youtube.com.evil.test/embed/_FkbD0FhgVE',
    'javascript:alert(1)',
    'javascript:void(0)//www.youtube.com/embed/_FkbD0FhgVE',
    'data:text/html,<h1>x</h1>',
    '//www.youtube.com/embed/_FkbD0FhgVE',
    '//evil.test/embed/_FkbD0FhgVE',
    'https://youtube.com/embed/short',
    'https://www.youtube.com/embed/_FkbD0FhgVEEXTRA',
    'https://notyoutube.com/embed/_FkbD0FhgVE',
    'https://www.youtube.com/live/_FkbD0FhgVE',
    'https://www.youtube.com/embed/',
    'ftp://www.youtube.com/embed/_FkbD0FhgVE',
    'https://www.youtube.com/watch?v=',
    'not a url at all',
    '',
    '   ',
  ];

  it.each(rejected)('Y-03 rejects %j', (input) => {
    expect(parseVideoRef(input)).toBeNull();
  });

  it('Y-03 rejects non-string input', () => {
    expect(parseVideoRef(undefined)).toBeNull();
    expect(parseVideoRef(null)).toBeNull();
    expect(parseVideoRef(42)).toBeNull();
    expect(parseVideoRef({})).toBeNull();
    expect(parseVideoRef(['https://youtu.be/_FkbD0FhgVE'])).toBeNull();
  });
});

describe('buildEmbedUrl (Y-07)', () => {
  it('Y-07 always emits a fresh youtube-nocookie embed URL', () => {
    expect(buildEmbedUrl(ID)).toBe(
      'https://www.youtube-nocookie.com/embed/_FkbD0FhgVE?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&autoplay=0&enablejsapi=0',
    );
  });

  it('Y-07 rebuilds a nocookie embed even when the ref came from another host', () => {
    const shorts = parseVideoRef(`https://www.youtube.com/shorts/${ID}`);
    expect(shorts).not.toBeNull();
    expect(buildEmbedUrl(shorts!.id)).toContain('https://www.youtube-nocookie.com/embed/');
    expect(buildEmbedUrl(shorts!.id)).not.toContain('/shorts/');
  });

  it('Y-07 forwards origin only for an http(s) origin', () => {
    expect(buildEmbedUrl(ID, 'http://localhost:1420')).toContain('origin=http%3A%2F%2Flocalhost%3A1420');
    expect(buildEmbedUrl(ID, 'https://app.example.test')).toContain('origin=https%3A%2F%2Fapp.example.test');
    expect(buildEmbedUrl(ID, 'capacitor://localhost')).not.toContain('origin=');
    expect(buildEmbedUrl(ID, 'file://')).not.toContain('origin=');
    expect(buildEmbedUrl(ID, undefined)).not.toContain('origin=');
  });

  it('Y-07 keeps the privacy and inline flags the player needs', () => {
    const url = new URL(buildEmbedUrl(ID, 'http://localhost:1420'));
    expect(url.searchParams.get('rel')).toBe('0');
    expect(url.searchParams.get('modestbranding')).toBe('1');
    expect(url.searchParams.get('playsinline')).toBe('1');
    expect(url.searchParams.get('iv_load_policy')).toBe('3');
    expect(url.searchParams.get('autoplay')).toBe('0');
    expect(url.searchParams.get('enablejsapi')).toBe('0');
  });
});

describe('tutorialTitle (Y-11)', () => {
  it('Y-11 renders all four RTL/LTR combinations', () => {
    expect(tutorialTitle('Barbell Back Squat', false)).toBe('Video: Barbell Back Squat');
    expect(tutorialTitle('Barbell Back Squat', true)).toBe('فيديو: Barbell Back Squat');
    expect(tutorialTitle('', false)).toBe('Video:');
    expect(tutorialTitle('', true)).toBe('فيديو:');
    expect(tutorialTitle('   ', false)).toBe('Video:');
    expect(tutorialTitle('  Barbell Back Squat  ', true)).toBe('فيديو: Barbell Back Squat');
  });
});

describe('the 28 curated videoUrl literals (Y-20)', () => {
  const curated = Object.entries(EXERCISE_DATABASE).filter(
    (entry): entry is [string, (typeof EXERCISE_DATABASE)[string] & { videoUrl: string }] =>
      typeof entry[1].videoUrl === 'string',
  );

  it('Y-20 there are exactly 28 curated videoUrl literals', () => {
    expect(curated).toHaveLength(28);
  });

  it('Y-20 all 28 parse to a valid id', () => {
    const parsed = curated.map(([key, tutorial]) => {
      const ref = parseVideoRef(tutorial.videoUrl);
      expect(ref, `videoUrl for ${key} did not parse: ${tutorial.videoUrl}`).not.toBeNull();
      expect(ref!.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      return ref!;
    });
    expect(parsed).toHaveLength(28);
  });

  it('Y-20 26 unique ids, because two duplicate pairs are data not bugs', () => {
    const ids = curated.map(([, tutorial]) => parseVideoRef(tutorial.videoUrl)!.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(26);

    const seen = new Map<string, string[]>();
    for (const [key, tutorial] of curated) {
      const id = parseVideoRef(tutorial.videoUrl)!.id;
      seen.set(id, [...(seen.get(id) ?? []), key]);
    }
    const duplicated = [...seen.entries()].filter(([, keys]) => keys.length > 1);
    expect(duplicated).toHaveLength(2);
    expect(duplicated.every(([, keys]) => keys.length === 2)).toBe(true);
  });

  it('Y-20 22 nocookie embeds and 6 shorts, the split the old parser lost', () => {
    const bySource = curated.reduce<Record<string, number>>((acc, [, tutorial]) => {
      const source = parseVideoRef(tutorial.videoUrl)!.source;
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {});
    expect(bySource).toEqual({ 'nocookie-embed': 22, shorts: 6 });
  });

  it('Y-20 every curated ref emits a youtube-nocookie embed src', () => {
    for (const [key, tutorial] of curated) {
      const id = parseVideoRef(tutorial.videoUrl)!.id;
      const src = buildEmbedUrl(id);
      expect(src.startsWith('https://www.youtube-nocookie.com/embed/'), key).toBe(true);
    }
  });
});

describe('watchUrlFor', () => {
  it('builds a canonical watch link from an id', () => {
    expect(watchUrlFor(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });
});