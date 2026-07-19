import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      idea: true,
      project: true,
    },
  });
  return NextResponse.json(jobs);
}
