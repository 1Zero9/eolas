import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

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
