import { NextResponse } from 'next/server';
import { claimJob } from '@/src/lib/jobs/job-service';
import { requireWorkerSecret } from '@/src/lib/worker-auth';
import { prisma } from '@/src/lib/db';

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
    return new NextResponse(null, { status: 204 });
  }

  const assemblyPlanId = (job.payload as { assemblyPlanId?: unknown })?.assemblyPlanId;
  if (job.type === 'create_local_workspace' && typeof assemblyPlanId === 'string') {
    await prisma.assemblyPlan.updateMany({
      where: { id: assemblyPlanId, status: 'APPROVED' },
      data: { status: 'EXECUTING', executionStartedAt: new Date() },
    });
  }
  return NextResponse.json(job);
}
