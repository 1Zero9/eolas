import { NextRequest, NextResponse } from 'next/server';
import { CAPTURE_SESSION_COOKIE, createCaptureSession, getOrganizationBySlug, verifyOrganizationPasscode } from '@/src/lib/organizations/organization-service';

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const organization = await getOrganizationBySlug(params.slug);
  if (!organization || !organization.captureEnabled) return NextResponse.json({ error: 'Capture is unavailable for this organization.' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.passcode !== 'string' || !(await verifyOrganizationPasscode(organization.id, body.passcode))) return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401 });
  const response = NextResponse.json({ ok: true, organization: { name: organization.name, slug: organization.slug } });
  response.cookies.set(CAPTURE_SESSION_COOKIE, createCaptureSession(organization.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 });
  return response;
}
