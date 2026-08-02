import { afterEach, describe, expect, it } from 'vitest';
import { createSessionToken, isAuthenticatedCookie } from '@/src/lib/auth';

const original = process.env.AUTH_SESSION_SECRET;

afterEach(() => {
  if (original === undefined) delete process.env.AUTH_SESSION_SECRET;
  else process.env.AUTH_SESSION_SECRET = original;
});

describe('signed sessions', () => {
  it('accepts a valid signed token and rejects a forged one', () => {
    process.env.AUTH_SESSION_SECRET = 'a-test-only-secret';
    const now = Date.UTC(2026, 0, 1);
    expect(isAuthenticatedCookie(createSessionToken(now), now)).toBe(true);
    expect(isAuthenticatedCookie('true', now)).toBe(false);
    expect(isAuthenticatedCookie('v1.1767225600.forged', now)).toBe(false);
  });

  it('rejects an expired token', () => {
    process.env.AUTH_SESSION_SECRET = 'a-test-only-secret';
    const now = Date.UTC(2026, 0, 10);
    expect(isAuthenticatedCookie(createSessionToken(now - 8 * 24 * 60 * 60 * 1000), now)).toBe(false);
  });
});
