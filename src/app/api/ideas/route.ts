import { NextRequest, NextResponse } from 'next/server';
import { createIdea, ideaCreateSchema } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = ideaCreateSchema.parse(body);
    const idea = await createIdea(parsed);
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

  const ideas = await import('@/src/lib/ideas/idea-service').then((mod) => mod.listIdeas());
  return NextResponse.json(ideas);
}
