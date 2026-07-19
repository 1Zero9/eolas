import { NextResponse } from 'next/server';
import { createIdeaNote, listIdeaNotes } from '@/src/lib/ideas/idea-note-service';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const notes = await listIdeaNotes(params.id);
  return NextResponse.json(notes);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
