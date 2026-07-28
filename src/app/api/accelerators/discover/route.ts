import { NextRequest, NextResponse } from 'next/server';
import { requireWorkerSecret } from '@/src/lib/worker-auth';
import {
  upsertDiscoveredAccelerators,
  type DiscoveredAcceleratorInput,
} from '@/src/lib/accelerators/accelerator-service';

export async function POST(request: NextRequest) {
  const authError = requireWorkerSecret(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const candidates = Array.isArray(body?.candidates) ? (body.candidates as DiscoveredAcceleratorInput[]) : [];

  const valid = candidates.filter(
    (candidate) =>
      candidate &&
      typeof candidate.name === 'string' &&
      typeof candidate.slug === 'string' &&
      typeof candidate.category === 'string' &&
      Array.isArray(candidate.files),
  );

  const created = await upsertDiscoveredAccelerators(valid);

  return NextResponse.json({ created: created.length, skipped: valid.length - created.length });
}
