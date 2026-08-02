import { NextRequest, NextResponse } from 'next/server';
import { deleteIdeaNote } from '@/src/lib/ideas/idea-note-service';
import { requireAuth } from '@/src/lib/auth';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();
  if (!await getIdea(params.id, organization.id)) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  try {
    await deleteIdeaNote(params.id, params.noteId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete note' },
      { status: 400 },
    );
  }
}
