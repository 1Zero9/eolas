import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const name = body?.name;
  const hostname = body?.hostname;
  const platform = body?.platform;
  const allowedProjectRoot = body?.allowedProjectRoot;
  const capabilities = body?.capabilities ?? [];

  if (!name || !platform || !allowedProjectRoot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const worker = await prisma.worker.upsert({
    where: { name },
    update: {
      hostname,
      platform,
      allowedProjectRoot,
      capabilities,
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
    create: {
      name,
      hostname,
      platform,
      allowedProjectRoot,
      capabilities,
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json(worker);
}
