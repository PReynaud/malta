const DEFAULT_TZ = 'Europe/Paris';

/**
 * Formats a photo publication timestamp for French UI (Europe/Paris by default).
 * Invalid ISO values return null so callers can hide the caption line.
 */
export function formatMaltaPhotoPublishedAt(
  iso: string,
  timeZone: string = DEFAULT_TZ
): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
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

/**
 * Resolves a horizontal swipe into a navigation delta.
 * Returns 0 when the gesture is too short or mostly vertical.
 * Positive delta = next (older); negative = previous (newer).
 */
export function swipeNavigationDelta(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thresholdPx: number
): number {
  const dx = endX - startX;
  const dy = endY - startY;

  if (Math.abs(dx) < thresholdPx || Math.abs(dx) <= Math.abs(dy)) {
    return 0;
  }

  return dx < 0 ? 1 : -1;
}
