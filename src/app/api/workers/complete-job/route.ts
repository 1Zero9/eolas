import { NextResponse } from 'next/server';
import { completeJob, failJob } from '@/src/lib/jobs/job-service';
import { prisma } from '@/src/lib/db';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobId = body?.jobId;
  const success = body?.success ?? true;
  const result = body?.result;
  const errorMessage = body?.errorMessage ?? 'Unknown failure';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  let job;

  if (success) {
    job = await completeJob(jobId, result ?? null);
  } else {
    job = await failJob(jobId, errorMessage);
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (success && job.type === 'create_local_workspace' && result?.localPath && job.projectId) {
    await prisma.project.update({
      where: { id: job.projectId },
      data: { localPath: result.localPath },
    });
  }

  return NextResponse.json({ ok: true, job });
}
