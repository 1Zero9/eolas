import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { rotateOrganizationPasscode } from '@/src/lib/organizations/organization-service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.capturePasscode !== 'string') return NextResponse.json({ error: 'A new capture passcode is required.' }, { status: 400 });
    await rotateOrganizationPasscode(params.id, body.capturePasscode);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to rotate capture passcode' }, { status: 400 });
  }
}
