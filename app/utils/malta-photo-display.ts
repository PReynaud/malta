const DEFAULT_TZ = 'Europe/Paris';

/**
 * Formats a photo publication timestamp for French UI (Europe/Paris by default).
 * Invalid ISO values return the raw input so callers can decide how to display.
 */
export function formatMaltaPhotoPublishedAt(
  iso: string,
  timeZone: string = DEFAULT_TZ
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date);
}

/**
 * Returns the adjacent index in a circular photo list.
 * Empty lists always resolve to 0.
 */
export function adjacentPhotoIndex(
  current: number,
  length: number,
  delta: number
): number {
  if (length <= 0) {
    return 0;
  }

  return ((current + delta) % length + length) % length;
}
