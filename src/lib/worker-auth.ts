import { NextResponse } from 'next/server';

export function requireWorkerSecret(request: Request) {
  const expected = process.env.EOLAS_WORKER_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'Worker authentication is not configured on the server' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-worker-secret');

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
