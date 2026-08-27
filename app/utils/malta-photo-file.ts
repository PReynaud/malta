export const MALTA_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const MALTA_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

export type MaltaPhotoMimeType = typeof MALTA_PHOTO_MIME_TYPES[number];

const EXTENSION_BY_MIME: Record<MaltaPhotoMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

function isMaltaPhotoMimeType(value: string): value is MaltaPhotoMimeType {
  return (MALTA_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

export function maltaPhotoExtension(file: File): string | null {
  if (!isMaltaPhotoMimeType(file.type)) {
    return null;
  }

  return EXTENSION_BY_MIME[file.type];
}

export function validateMaltaPhoto(file: File): string | null {
  if (!isMaltaPhotoMimeType(file.type)) {
    return 'Envoie une image JPEG, PNG, WebP ou GIF.';
  }

  if (file.size > MALTA_PHOTO_MAX_BYTES) {
    return 'La photo est trop lourde (max 5 Mo).';
  }

  return null;
}

export function maltaPhotoUploadError(file: File, sitterId: string | null): string | null {
  if (!sitterId) {
    return 'Choisis d\'abord qui tu es, puis envoie une photo.';
  }

  return validateMaltaPhoto(file);
}
