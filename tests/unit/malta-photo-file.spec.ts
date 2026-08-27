import { describe, expect, it } from 'vitest';
import {
  MALTA_PHOTO_MAX_BYTES,
  maltaPhotoExtension,
  maltaPhotoUploadError,
  validateMaltaPhoto
} from '../../app/utils/malta-photo-file';

function makeFile(name: string, type: string, size = 12): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('malta-photo-file', () => {
  it('accepts jpeg, png, webp, and gif under 5 MiB', () => {
    expect(validateMaltaPhoto(makeFile('malta.jpg', 'image/jpeg'))).toBeNull();
    expect(validateMaltaPhoto(makeFile('malta.png', 'image/png'))).toBeNull();
    expect(validateMaltaPhoto(makeFile('malta.webp', 'image/webp'))).toBeNull();
    expect(validateMaltaPhoto(makeFile('malta.gif', 'image/gif'))).toBeNull();
    expect(maltaPhotoExtension(makeFile('malta.jpg', 'image/jpeg'))).toBe('jpg');
  });

  it('rejects unknown types and files over 5 MiB', () => {
    expect(validateMaltaPhoto(makeFile('notes.pdf', 'application/pdf'))).toBe(
      'Envoie une image JPEG, PNG, WebP ou GIF.'
    );
    expect(maltaPhotoExtension(makeFile('notes.pdf', 'application/pdf'))).toBeNull();

    const tooBig = makeFile('huge.jpg', 'image/jpeg', MALTA_PHOTO_MAX_BYTES + 1);
    expect(validateMaltaPhoto(tooBig)).toBe('La photo est trop lourde (max 5 Mo).');
  });

  it('blocks upload until a sitter is selected', () => {
    const file = makeFile('malta.jpg', 'image/jpeg');
    expect(maltaPhotoUploadError(file, null)).toBe(
      'Choisis d\'abord qui tu es, puis envoie une photo.'
    );
    expect(maltaPhotoUploadError(file, 'sitter-1')).toBeNull();
  });
});
