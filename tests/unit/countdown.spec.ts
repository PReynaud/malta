import { describe, expect, it } from 'vitest';
import {
  DEPARTURE_AT_MS,
  remainingTime,
  RETURN_AT_MS
} from '../../app/utils/countdown';

describe('countdown', () => {
  it('splits the remaining time into days hours minutes seconds', () => {
    const now = Date.parse('2026-09-10T12:00:00+02:00');
    const remaining = remainingTime(DEPARTURE_AT_MS, now);

    expect(remaining).toMatchObject({
      days: 3,
      hours: 12,
      minutes: 0,
      seconds: 0,
      done: false
    });
  });

  it('clamps to zero once the target is reached', () => {
    expect(remainingTime(RETURN_AT_MS, RETURN_AT_MS)).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      done: true
    });
    expect(remainingTime(RETURN_AT_MS, RETURN_AT_MS + 5000).done).toBe(true);
  });
});
