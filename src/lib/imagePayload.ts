/**
 * Image payload helpers shared by the capture, upload and persistence paths.
 *
 * Meal photos used to be written into the Firestore document as a base64 data
 * URL. That is what pushed documents past the 1 MiB limit and flooded the
 * offline mirror in localStorage, so photos are uploaded to Cloud Storage and
 * the document only keeps the download URL. The device still has to shrink a
 * capture before anything leaves the browser, so the downscaling helpers live
 * here — free of any Firebase dependency so validation and tests can use them.
 */

export const MAX_MEAL_PHOTO_EDGE_PX = 800;
export const MEAL_PHOTO_JPEG_QUALITY = 0.72;

/**
 * A Firestore document is capped at 1 MiB, so an inline base64 photo can only
 * ever be a stopgap. `assertValidMeal` rejects anything larger and asks for a
 * Storage URL instead.
 */
export const MAX_INLINE_MEAL_IMAGE_BYTES = 200 * 1024;

const DATA_URL_PREFIX = 'data:';
const BASE64_PREFIX = ';base64,';

export function isInlineImagePayload(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(DATA_URL_PREFIX);
}

/** Decoded byte length of a base64 data URL, without decoding it. */
export function inlineImageBytes(dataUrl: string): number {
  const marker = dataUrl.indexOf(BASE64_PREFIX);
  if (marker < 0) return 0;
  const base64 = dataUrl.slice(marker + BASE64_PREFIX.length);
  if (!base64) return 0;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/** Scales `width`/`height` down so neither edge exceeds `maxDim`. */
export function fitWithinEdge(width: number, height: number, maxDim: number) {
  const safeWidth = Math.max(1, Math.round(width) || 1);
  const safeHeight = Math.max(1, Math.round(height) || 1);
  if (safeWidth > safeHeight && safeWidth > maxDim) {
    return { width: maxDim, height: Math.max(1, Math.round((safeHeight * maxDim) / safeWidth)) };
  }
  if (safeHeight > maxDim) {
    return { width: Math.max(1, Math.round((safeWidth * maxDim) / safeHeight)), height: maxDim };
  }
  return { width: safeWidth, height: safeHeight };
}

/**
 * Draws any canvas source (an `<img>`, a camera `<video>`) into a canvas that
 * is capped at `maxDim` on its longest edge and returns a JPEG data URL.
 * Returns null when the browser refuses to allocate a 2D context.
 */
export function downscaleToJpegDataUrl(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxDim: number = MAX_MEAL_PHOTO_EDGE_PX,
  quality: number = MEAL_PHOTO_JPEG_QUALITY
): string | null {
  if (typeof document === 'undefined') return null;
  const { width, height } = fitWithinEdge(sourceWidth, sourceHeight, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Converts a data URL into the Blob that `uploadBytes` expects. */
export function dataUrlToBlob(dataUrl: string, fallbackMimeType = 'image/jpeg'): Blob | null {
  if (typeof atob !== 'function' || typeof Blob !== 'function') return null;
  const marker = dataUrl.indexOf(BASE64_PREFIX);
  if (marker < 0) return null;
  const mimeType = dataUrl.slice(DATA_URL_PREFIX.length, marker) || fallbackMimeType;
  const base64 = dataUrl.slice(marker + BASE64_PREFIX.length);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  } catch {
    return null;
  }
}
