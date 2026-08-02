import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();

  const jobs = await prisma.job.findMany({
    where: { organizationId: organization.id }, orderBy: { createdAt: 'desc' },
    include: {
      idea: true,
      project: true,
    },
  });
  return NextResponse.json(jobs);
}
