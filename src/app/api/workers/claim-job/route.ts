import { NextResponse } from 'next/server';
import { claimJob } from '@/src/lib/jobs/job-service';

export async function POST(request: Request) {
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
