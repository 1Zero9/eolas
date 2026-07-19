import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
