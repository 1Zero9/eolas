import { afterEach, describe, expect, it } from 'vitest';
import { createCaptureSession, hasCaptureSession } from '@/src/lib/organizations/organization-service';

const original = process.env.AUTH_SESSION_SECRET;
afterEach(() => { if (original === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = original; });

describe('organization capture sessions', () => {
  it('accepts a signed session only for its organization', () => {
    process.env.AUTH_SESSION_SECRET = 'organization-test-secret-value-that-is-long-enough';
    const session = createCaptureSession('org-a');
    expect(hasCaptureSession(session, 'org-a')).toBe(true);
    expect(hasCaptureSession(session, 'org-b')).toBe(false);
  });

  it('rejects tampered capture sessions', () => {
    process.env.AUTH_SESSION_SECRET = 'organization-test-secret-value-that-is-long-enough';
    const session = createCaptureSession('org-a');
    expect(hasCaptureSession(`${session}x`, 'org-a')).toBe(false);
  });
});
