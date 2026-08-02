import { NextRequest, NextResponse } from 'next/server';
import { approveJob } from '@/src/lib/jobs/job-service';
import { requireAuth } from '@/src/lib/auth';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';
import { prisma } from '@/src/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();
  const existing = await prisma.job.findFirst({ where: { id: params.id, organizationId: organization.id } });
  if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const approver = (body?.approver as string) || 'system';

  try { return NextResponse.json(await approveJob(params.id, approver)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to approve job' }, { status: 400 }); }
}
