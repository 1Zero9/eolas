import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { approveAssemblyPlan } from '@/src/lib/assembly/assembly-plan-service';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';
import { prisma } from '@/src/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();
  const plan = await prisma.assemblyPlan.findFirst({ where: { id: params.id, project: { organizationId: organization.id } } });
  if (!plan) return NextResponse.json({ error: 'Assembly plan not found' }, { status: 404 });
  try {
    const body = await request.json().catch(() => ({}));
    const plan = await approveAssemblyPlan(params.id, typeof body.approver === 'string' ? body.approver : 'owner');
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to approve assembly plan' }, { status: 400 });
  }
}
