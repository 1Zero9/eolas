import { NextResponse } from 'next/server';
import { claimJob } from '@/src/lib/jobs/job-service';
import { requireWorkerSecret } from '@/src/lib/worker-auth';

export async function POST(request: Request) {
  const authError = requireWorkerSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const workerId = body?.workerId;

  if (!workerId) {
    return NextResponse.json({ error: 'Missing workerId' }, { status: 400 });
  }

  const job = await claimJob(workerId);
  if (!job) {
    return NextResponse.json({ ok: false, message: 'No job available' }, { status: 204 });
  }

  return NextResponse.json(job);
}
