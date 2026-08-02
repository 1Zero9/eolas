import { NextRequest, NextResponse } from 'next/server';
import { createIdeaNote, listIdeaNotes } from '@/src/lib/ideas/idea-note-service';
import { requireAuth } from '@/src/lib/auth';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();
  if (!await getIdea(params.id, organization.id)) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  const notes = await listIdeaNotes(params.id);
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();
  if (!await getIdea(params.id, organization.id)) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

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
