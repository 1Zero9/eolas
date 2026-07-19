import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'eolas-session';

export function getExpectedAuthPassword() {
  return process.env.AUTH_PASSWORD ?? 'eolas';
}

export function isAuthenticatedCookie(cookieValue: string | undefined) {
  return cookieValue === 'true';
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
