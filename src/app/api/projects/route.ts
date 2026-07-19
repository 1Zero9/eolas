import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(projects);
}
