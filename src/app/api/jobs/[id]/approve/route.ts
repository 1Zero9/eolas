import { NextResponse } from 'next/server';
import { approveJob } from '@/src/lib/jobs/job-service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const approver = (body?.approver as string) || 'system';

  const job = await approveJob(params.id, approver);
  return NextResponse.json(job);
}
