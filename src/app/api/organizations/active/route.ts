import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { ACTIVE_ORGANIZATION_COOKIE } from '@/src/lib/organizations/organization-service';
import { prisma } from '@/src/lib/db';

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request); if (authError) return authError;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  const response = NextResponse.json({ organization });
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, organization.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return response;
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request); if (authError) return authError;
  const selected = request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const organization = selected ? await prisma.organization.findUnique({ where: { id: selected }, select: { id: true, name: true, slug: true } }) : await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, slug: true } });
  return NextResponse.json(organization);
}
