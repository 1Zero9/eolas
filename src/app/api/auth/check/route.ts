import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/src/lib/auth';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const authenticated = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .some((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
