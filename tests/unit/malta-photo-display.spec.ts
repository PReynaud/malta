import { describe, expect, it } from 'vitest';
import {
  adjacentPhotoIndex,
  formatMaltaPhotoPublishedAt,
  maltaPhotoStaticUrl,
  swipeNavigationDelta
} from '../../app/utils/malta-photo-display';

describe('maltaPhotoStaticUrl', () => {
  it('maps a relative storage path to the same-origin static directory', () => {
    expect(maltaPhotoStaticUrl('sitter-id/file.jpg')).toBe(
      '/malta-photos/sitter-id/file.jpg'
    );
  });

  it('normalizes separators and safely encodes path segments', () => {
    expect(maltaPhotoStaticUrl('/sitter-id//Malta photo #1.jpg')).toBe(
      '/malta-photos/sitter-id/Malta%20photo%20%231.jpg'
    );
    expect(maltaPhotoStaticUrl('sitter-id\\file.jpg')).toBe(
      '/malta-photos/sitter-id/file.jpg'
    );
  });

  it('rejects empty and parent-traversal paths', () => {
    expect(() => maltaPhotoStaticUrl('')).toThrow(/storage path/i);
    expect(() => maltaPhotoStaticUrl('../file.jpg')).toThrow(/storage path/i);
  });
});

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

  it('returns null for invalid dates', () => {
    expect(formatMaltaPhotoPublishedAt('not-a-date')).toBeNull();
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

describe('swipeNavigationDelta', () => {
  it('returns next delta for a leftward swipe past threshold', () => {
    expect(swipeNavigationDelta(100, 50, 40, 55, 45)).toBe(1);
  });

  it('returns previous delta for a rightward swipe past threshold', () => {
    expect(swipeNavigationDelta(40, 50, 100, 55, 45)).toBe(-1);
  });

  it('ignores short or mostly vertical gestures', () => {
    expect(swipeNavigationDelta(100, 50, 70, 55, 45)).toBe(0);
    expect(swipeNavigationDelta(100, 50, 40, 120, 45)).toBe(0);
  });
});
