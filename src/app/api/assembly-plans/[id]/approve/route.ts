import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { approveAssemblyPlan } from '@/src/lib/assembly/assembly-plan-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const plan = await approveAssemblyPlan(params.id, typeof body.approver === 'string' ? body.approver : 'owner');
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to approve assembly plan' }, { status: 400 });
  }
}
