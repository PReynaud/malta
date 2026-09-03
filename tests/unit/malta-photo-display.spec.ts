import { describe, expect, it } from 'vitest';
import {
  adjacentPhotoIndex,
  formatMaltaPhotoPublishedAt
} from '../../app/utils/malta-photo-display';

describe('formatMaltaPhotoPublishedAt', () => {
  it('formats a known ISO timestamp in French Europe/Paris local time', () => {
    // 15:22 UTC → 17:22 in Paris during CEST (UTC+2)
    const formatted = formatMaltaPhotoPublishedAt('2026-09-03T15:22:00.000Z');

    expect(formatted).toMatch(/3 septembre 2026/);
    expect(formatted).toMatch(/17:22/);
  });

  it('accepts an explicit timeZone override', () => {
    const formatted = formatMaltaPhotoPublishedAt('2026-09-03T15:22:00.000Z', 'UTC');

    expect(formatted).toMatch(/3 septembre 2026/);
    expect(formatted).toMatch(/15:22/);
  });

  it('returns the raw input for invalid dates', () => {
    expect(formatMaltaPhotoPublishedAt('not-a-date')).toBe('not-a-date');
  });
});

describe('adjacentPhotoIndex', () => {
  it('moves forward and backward within the list', () => {
    expect(adjacentPhotoIndex(1, 3, 1)).toBe(2);
    expect(adjacentPhotoIndex(1, 3, -1)).toBe(0);
  });

  it('wraps at both ends', () => {
    expect(adjacentPhotoIndex(2, 3, 1)).toBe(0);
    expect(adjacentPhotoIndex(0, 3, -1)).toBe(2);
  });

  it('is a no-op for a single photo', () => {
    expect(adjacentPhotoIndex(0, 1, 1)).toBe(0);
    expect(adjacentPhotoIndex(0, 1, -1)).toBe(0);
  });

  it('returns 0 when the list is empty', () => {
    expect(adjacentPhotoIndex(0, 0, 1)).toBe(0);
  });
});
