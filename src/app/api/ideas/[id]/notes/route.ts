import { NextRequest, NextResponse } from 'next/server';
import { createIdeaNote, listIdeaNotes } from '@/src/lib/ideas/idea-note-service';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const notes = await listIdeaNotes(params.id);
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const note = await createIdeaNote(params.id, body);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save note' },
      { status: 400 },
    );
  }
}
