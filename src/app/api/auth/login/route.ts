import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { AUTH_COOKIE_NAME, createSessionToken, getExpectedAuthPassword } from '@/src/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;

    const expected = getExpectedAuthPassword();
    if (typeof password !== 'string' || password.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: message.includes('must be') ? 503 : 400 });
  }
}
