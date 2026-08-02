import { NextRequest, NextResponse } from 'next/server';
import { createIdea, ideaCreateSchema } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();

  try {
    const body = await request.json();
    const parsed = ideaCreateSchema.parse(body);
    const idea = await createIdea(organization.id, parsed);
    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save idea' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();

  const ideas = await import('@/src/lib/ideas/idea-service').then((mod) => mod.listIdeas(organization.id));
  return NextResponse.json(ideas);
}
