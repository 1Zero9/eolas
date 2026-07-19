import { NextResponse } from 'next/server';
import { getIdea, updateIdea } from '@/src/lib/ideas/idea-service';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  return NextResponse.json(idea);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
