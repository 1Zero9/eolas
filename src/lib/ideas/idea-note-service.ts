import { prisma } from '@/src/lib/db';
import { z } from 'zod';

export const ideaNoteCreateSchema = z.object({
  content: z.string().trim().min(1, 'Note content is required').max(8000),
});

export async function createIdeaNote(ideaId: string, input: unknown) {
  const parsed = ideaNoteCreateSchema.parse(input);

  return prisma.ideaNote.create({
    data: {
      ideaId,
      content: parsed.content,
    },
  });
}

export async function listIdeaNotes(ideaId: string) {
  return prisma.ideaNote.findMany({
    where: { ideaId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteIdeaNote(ideaId: string, noteId: string) {
  const note = await prisma.ideaNote.findUnique({ where: { id: noteId } });

  if (!note || note.ideaId !== ideaId) {
    throw new Error('Note not found');
  }

  return prisma.ideaNote.delete({ where: { id: noteId } });
}
