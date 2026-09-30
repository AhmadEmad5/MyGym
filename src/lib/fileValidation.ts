/**
 * Client-side file validation safeguards (OWASP File Upload Hardening)
 */

export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
];

export function validateClientFile(file: File, options: FileValidationOptions): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file was provided.' };
  }

  // Size boundary check
  if (file.size > options.maxSizeBytes) {
    const sizeMb = (options.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${sizeMb} MB.`
    };
  }

  // MIME type check
  const isAllowed = options.allowedMimeTypes.some((pattern) => {
    const normalized = pattern.trim().toLowerCase();
    if (normalized === '*/*') {
      return true;
    }
    if (normalized.endsWith('/*')) {
      const typePrefix = normalized.split('/')[0];
      return file.type.toLowerCase().startsWith(`${typePrefix}/`);
    }
    return file.type.toLowerCase() === normalized;
  });

  if (!isAllowed && file.type) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type}). Allowed formats: ${options.allowedMimeTypes.join(', ')}`
    };
  }

  return { valid: true };
}
