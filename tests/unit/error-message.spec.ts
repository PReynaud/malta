import { describe, expect, it } from 'vitest';
import { getErrorMessage, isUnauthorizedError } from '../../app/utils/error-message';

describe('getErrorMessage', () => {
  it('returns the Error message', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('returns a string error as-is', () => {
    expect(getErrorMessage('nope', 'fallback')).toBe('nope');
  });

  it('returns a PostgREST object message', () => {
    expect(getErrorMessage({ message: 'Invalid JWT', code: 'PGRST301' }, 'fallback')).toBe('Invalid JWT');
  });

  it('returns the fallback for unknown values', () => {
    expect(getErrorMessage({ code: 1 }, 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
  });
});

describe('isUnauthorizedError', () => {
  it('detects HTTP 401 and PostgREST JWT failures', () => {
    expect(isUnauthorizedError({ status: 401 })).toBe(true);
    expect(isUnauthorizedError({ code: 'PGRST301' })).toBe(true);
    expect(isUnauthorizedError({ message: 'Invalid JWT' })).toBe(true);
    expect(isUnauthorizedError({ message: 'JWT expired' })).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError({ message: 'relation does not exist' })).toBe(false);
    expect(isUnauthorizedError(new Error('Impossible de charger l\'admin'))).toBe(false);
  });
});
