import { NextRequest, NextResponse } from 'next/server';
import { approveJob } from '@/src/lib/jobs/job-service';
import { requireAuth } from '@/src/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const approver = (body?.approver as string) || 'system';

  try { return NextResponse.json(await approveJob(params.id, approver)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to approve job' }, { status: 400 }); }
}
