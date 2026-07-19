import { NextRequest, NextResponse } from 'next/server';
import { approveJob } from '@/src/lib/jobs/job-service';
import { requireAuth } from '@/src/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const approver = (body?.approver as string) || 'system';

  const job = await approveJob(params.id, approver);
  return NextResponse.json(job);
}
