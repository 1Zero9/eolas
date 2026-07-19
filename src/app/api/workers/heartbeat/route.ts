import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requireWorkerSecret } from '@/src/lib/worker-auth';

export async function POST(request: Request) {
  const authError = requireWorkerSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const name = body?.name;

  if (!name) {
    return NextResponse.json({ error: 'Missing worker name' }, { status: 400 });
  }

  const worker = await prisma.worker.updateMany({
    where: { name },
    data: { status: 'ONLINE', lastSeenAt: new Date() },
  });

  if (worker.count === 0) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
