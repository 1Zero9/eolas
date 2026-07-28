import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getExpectedAuthPassword } from '@/src/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;

    if (password !== getExpectedAuthPassword()) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
