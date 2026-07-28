import { NextResponse } from 'next/server';

export function requireDesktopSecret(request: Request) {
  const expected = process.env.EOLAS_DESKTOP_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'Desktop app authentication is not configured on the server' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-desktop-secret');

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
