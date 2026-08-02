import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { createOrganization } from '@/src/lib/organizations/organization-service';
import { prisma } from '@/src/lib/db';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request); if (authError) return authError;
  return NextResponse.json(await prisma.organization.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, slug: true, captureEnabled: true, createdAt: true } }));
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request); if (authError) return authError;
  try { return NextResponse.json(await createOrganization(await request.json()), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create organization' }, { status: 400 }); }
}
