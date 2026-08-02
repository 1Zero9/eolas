import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationBySlug, hasCaptureSession, CAPTURE_SESSION_COOKIE } from '@/src/lib/organizations/organization-service';
import { createIdea, ideaCreateSchema } from '@/src/lib/ideas/idea-service';

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const organization = await getOrganizationBySlug(params.slug);
  if (!organization || !organization.captureEnabled) return NextResponse.json({ error: 'Capture is unavailable for this organization.' }, { status: 404 });
  if (!hasCaptureSession(request.cookies.get(CAPTURE_SESSION_COOKIE)?.value, organization.id, organization.captureSessionVersion)) return NextResponse.json({ error: 'Enter the organization passcode to capture ideas.' }, { status: 401 });
  try {
    const body = await request.json();
    const idea = await createIdea(organization.id, ideaCreateSchema.parse({ ...body, source: 'WEB' }));
    return NextResponse.json({ id: idea.id, createdAt: idea.createdAt }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save idea' }, { status: 400 }); }
}
