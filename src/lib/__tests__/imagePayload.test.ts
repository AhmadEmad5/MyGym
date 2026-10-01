import { describe, it, expect } from 'vitest';
import {
  dataUrlToBlob,
  downscaleToJpegDataUrl,
  fitWithinEdge,
  inlineImageBytes,
  isInlineImagePayload,
  MAX_INLINE_MEAL_IMAGE_BYTES,
  MAX_MEAL_PHOTO_EDGE_PX,
  MEAL_PHOTO_JPEG_QUALITY,
} from '../imagePayload';

const dataUrl = (bytes: Uint8Array, mime = 'image/jpeg') => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${mime};base64,${btoa(binary)}`;
};

describe('fitWithinEdge', () => {
  it('caps a landscape capture on its long edge and keeps the aspect ratio', () => {
    // 4032x3024 is what a phone hands the camera path; this is the C7 payload
    // that used to be stored inline at native resolution.
    expect(fitWithinEdge(4032, 3024, MAX_MEAL_PHOTO_EDGE_PX)).toEqual({ width: 800, height: 600 });
  });

  it('caps a portrait capture on its long edge', () => {
    expect(fitWithinEdge(1080, 1920, MAX_MEAL_PHOTO_EDGE_PX)).toEqual({ width: 450, height: 800 });
  });

  it('leaves a small capture untouched instead of upscaling it', () => {
    expect(fitWithinEdge(320, 240, MAX_MEAL_PHOTO_EDGE_PX)).toEqual({ width: 320, height: 240 });
  });

  it('never collapses an edge to zero on a malformed source size', () => {
    expect(fitWithinEdge(0, 0, MAX_MEAL_PHOTO_EDGE_PX)).toEqual({ width: 1, height: 1 });
    expect(fitWithinEdge(4000, 1, MAX_MEAL_PHOTO_EDGE_PX)).toEqual({ width: 800, height: 1 });
  });
});

describe('inlineImageBytes', () => {
  it('reports the decoded size without decoding the payload', () => {
    const payload = new Uint8Array(1024);
    expect(inlineImageBytes(dataUrl(payload))).toBe(1024);
  });

  it('accounts for base64 padding', () => {
    expect(inlineImageBytes(dataUrl(new Uint8Array(1001)))).toBe(1001);
    expect(inlineImageBytes(dataUrl(new Uint8Array(1000)))).toBe(1000);
  });

  it('reports nothing for a non-base64 data URL', () => {
    expect(inlineImageBytes('data:image/svg+xml,<svg/>')).toBe(0);
  });

  it('agrees with the decoded blob length', async () => {
    const payload = new Uint8Array(4096).map((_, i) => i % 256);
    const url = dataUrl(payload);
    const blob = await dataUrlToBlob(url);
    expect(blob?.size).toBe(inlineImageBytes(url));
  });
});

describe('isInlineImagePayload', () => {
  it('only claims base64 data URLs', () => {
    expect(isInlineImagePayload('data:image/jpeg;base64,AAAA')).toBe(true);
    expect(isInlineImagePayload('https://firebasestorage.googleapis.com/photo.jpg?token=x')).toBe(false);
    expect(isInlineImagePayload(undefined)).toBe(false);
  });
});

describe('dataUrlToBlob', () => {
  it('preserves the JPEG content type the storage rules require', async () => {
    const blob = await dataUrlToBlob(dataUrl(new Uint8Array(64)));
    expect(blob?.type).toBe('image/jpeg');
    expect(blob?.size).toBe(64);
  });

  it('returns null for a data URL that carries no base64 payload', async () => {
    expect(await dataUrlToBlob('data:image/svg+xml,<svg/>')).toBeNull();
  });
});

describe('downscaleToJpegDataUrl', () => {
  it('bails out instead of throwing where there is no canvas', () => {
    // The suite runs in vitest's `node` environment; the guard keeps the
    // helper inert there instead of pretending a capture was encoded.
    expect(downscaleToJpegDataUrl({} as CanvasImageSource, 4032, 3024)).toBeNull();
  });

  it('re-encodes below the quality the upload path already used', () => {
    // Native-resolution q0.9 JPEG of a 4032x3024 frame lands around 4 MB;
    // the 800px/0.72 cap keeps the payload far below the 1 MB Storage limit.
    expect(MAX_MEAL_PHOTO_EDGE_PX).toBe(800);
    expect(MEAL_PHOTO_JPEG_QUALITY).toBeLessThan(0.9);
    expect(MAX_INLINE_MEAL_IMAGE_BYTES).toBe(200 * 1024);
  });
});
