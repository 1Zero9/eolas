import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      idea: true,
      project: true,
    },
  });
  return NextResponse.json(jobs);
}
