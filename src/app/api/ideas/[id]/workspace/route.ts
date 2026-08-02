import { NextRequest, NextResponse } from 'next/server';
import { updateIdeaWorkspace } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();

  try {
    const body = await request.json();
    const idea = await updateIdeaWorkspace(params.id, organization.id, body);
    return NextResponse.json(idea);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save workspace' },
      { status: 400 },
    );
  }
}
