import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { setAcceleratorStatus } from '@/src/lib/accelerators/accelerator-service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const status = body?.status;

  if (status !== 'APPROVED' && status !== 'DISMISSED') {
    return NextResponse.json({ error: 'status must be APPROVED or DISMISSED' }, { status: 400 });
  }

  const accelerator = await setAcceleratorStatus(params.id, status);
  return NextResponse.json({ accelerator });
}
