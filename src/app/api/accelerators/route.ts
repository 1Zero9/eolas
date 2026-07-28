import { NextRequest, NextResponse } from 'next/server';
import { listAccelerators } from '@/src/lib/accelerators/accelerator-service';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const accelerators = await listAccelerators();
  return NextResponse.json(accelerators);
}
