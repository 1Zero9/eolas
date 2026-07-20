import { NextRequest, NextResponse } from 'next/server';
import { deleteIdea, getIdea, updateIdea } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  return NextResponse.json(idea);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const idea = await updateIdea(params.id, body);
    return NextResponse.json(idea);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update idea' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    await deleteIdea(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete idea' },
      { status: 400 },
    );
  }
}
