import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const AUTH_COOKIE_NAME = 'eolas-session';

export function getExpectedAuthPassword() {
  const password = process.env.AUTH_PASSWORD;
  if (!password || password === 'eolas' || password === 'change-me') {
    throw new Error('AUTH_PASSWORD must be set to a strong, non-default value.');
  }
  return password;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret === 'change-me') throw new Error('AUTH_SESSION_SECRET must be configured.');
  return secret;
}

export function createSessionToken(now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload = `v1.${issuedAt}`;
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isAuthenticatedCookie(cookieValue: string | undefined, now = Date.now()) {
  if (!cookieValue) return false;
  const [version, timestamp, signature] = cookieValue.split('.');
  if (version !== 'v1' || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  if (issuedAt > Math.floor(now / 1000) + 60 || issuedAt < Math.floor(now / 1000) - maxAgeSeconds) return false;
  try {
    const expected = crypto.createHmac('sha256', getSessionSecret()).update(`v1.${timestamp}`).digest('base64url');
    return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isAuthenticatedRequest(request: NextRequest) {
  return isAuthenticatedCookie(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export async function isAuthenticatedRoute() {
  const cookieStore = await cookies();
  return isAuthenticatedCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function requireAuth(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
