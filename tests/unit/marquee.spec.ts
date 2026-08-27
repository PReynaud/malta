import { describe, expect, it } from 'vitest';
import { needsMarqueeLoop } from '../../app/utils/marquee';

describe('needsMarqueeLoop', () => {
  it('stays still when a single photo fits in the frame', () => {
    expect(needsMarqueeLoop(192, 630)).toBe(false);
  });

  it('loops only when the photos overflow the frame', () => {
    expect(needsMarqueeLoop(800, 630)).toBe(true);
  });

  it('never loops when the user prefers reduced motion', () => {
    expect(needsMarqueeLoop(800, 630, true)).toBe(false);
  });
});
