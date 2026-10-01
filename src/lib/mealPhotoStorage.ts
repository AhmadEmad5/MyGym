/**
 * Meal photo uploads to Cloud Storage.
 *
 * A meal photo no longer travels inside the Firestore document as base64: it is
 * uploaded here and only the download URL is persisted. The 1 MB ceiling and
 * the `image/*` content type are mirrored in `storage.rules`, so a value that
 * would be rejected by the rules never leaves the device.
 */

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { app, auth, storage as sharedStorage } from './firebase';
import { dataUrlToBlob, inlineImageBytes } from './imagePayload';

export const MEAL_PHOTO_FILE_NAME = 'photo.jpg';
export const MEAL_PHOTO_MIME = 'image/jpeg';
export const MEAL_PHOTO_MAX_BYTES = 1024 * 1024;

export type MealPhotoUploadFailure = 'not-signed-in' | 'unavailable' | 'encode' | 'too-large' | 'upload';

export class MealPhotoUploadError extends Error {
  readonly reason: MealPhotoUploadFailure;

  constructor(reason: MealPhotoUploadFailure, message: string) {
    super(message);
    this.name = 'MealPhotoUploadError';
    this.reason = reason;
  }
}

/**
 * Owner-scoped path that mirrors the Firestore document it belongs to
 * (`users/{uid}/meals/{mealId}`), so the `isOwner(userId)` check in
 * `storage.rules` resolves and no athlete can guess another's photo.
 */
export function mealPhotoPath(userId: string, mealId: string): string {
  return `users/${userId}/meals/${mealId}/${MEAL_PHOTO_FILE_NAME}`;
}

function resolveStorage(): FirebaseStorage | null {
  if (sharedStorage) return sharedStorage;
  if (!app) return null;
  try {
    return getStorage(app);
  } catch {
    // No bucket configured — the caller falls back to logging the meal without
    // a photo rather than failing the whole save.
    return null;
  }
}

/**
 * Uploads a downscaled JPEG data URL and returns its download URL.
 * Throws `MealPhotoUploadError` when the upload cannot be attempted or fails.
 */
export async function uploadMealPhoto(dataUrl: string, mealId: string): Promise<string> {
  const userId = auth?.currentUser?.uid;
  if (!userId) {
    throw new MealPhotoUploadError('not-signed-in', 'Signing in is required to attach a meal photo.');
  }

  const storage = resolveStorage();
  if (!storage) {
    throw new MealPhotoUploadError('unavailable', 'Cloud Storage is not configured for this client.');
  }

  if (inlineImageBytes(dataUrl) > MEAL_PHOTO_MAX_BYTES) {
    throw new MealPhotoUploadError('too-large', 'The capture is over the 1 MB upload limit.');
  }

  const blob = dataUrlToBlob(dataUrl, MEAL_PHOTO_MIME);
  if (!blob) {
    throw new MealPhotoUploadError('encode', 'The captured photo could not be encoded for upload.');
  }
  if (blob.size > MEAL_PHOTO_MAX_BYTES) {
    throw new MealPhotoUploadError('too-large', `The capture is ${(blob.size / 1048576).toFixed(1)} MB, over the 1 MB limit.`);
  }

  try {
    const objectRef = ref(storage, mealPhotoPath(userId, mealId));
    await uploadBytes(objectRef, blob, {
      contentType: MEAL_PHOTO_MIME,
      cacheControl: 'private, max-age=3600'
    });
    return await getDownloadURL(objectRef);
  } catch (err) {
    throw new MealPhotoUploadError('upload', (err as { message?: string })?.message || 'The photo upload failed.');
  }
}
