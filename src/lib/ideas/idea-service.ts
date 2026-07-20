import { prisma } from '@/src/lib/db';
import { z } from 'zod';

export const ideaCreateSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal('')),
  rawCapture: z.string().trim().min(1, 'Idea text is required'),
  summary: z.string().trim().max(2000).optional().or(z.literal('')),
  source: z.enum(['WEB', 'MOBILE', 'VOICE', 'IMPORT', 'API']).default('MOBILE'),
});

export type IdeaCreateInput = z.infer<typeof ideaCreateSchema>;

export async function createIdea(input: IdeaCreateInput) {
  const parsed = ideaCreateSchema.parse(input);
  return prisma.idea.create({
    data: {
      title: parsed.title || null,
      rawCapture: parsed.rawCapture,
      summary: parsed.summary || null,
      source: parsed.source,
    },
  });
}

export async function listIdeas() {
  return prisma.idea.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIdea(id: string) {
  return prisma.idea.findUnique({ where: { id } });
}

export async function updateIdea(id: string, input: Partial<IdeaCreateInput>) {
  const parsed = ideaCreateSchema.partial().parse(input);
  return prisma.idea.update({
    where: { id },
    data: {
      title: parsed.title === '' ? null : parsed.title,
      rawCapture: parsed.rawCapture,
      summary: parsed.summary === '' ? null : parsed.summary,
      source: parsed.source,
    },
  });
}

export const ideaWorkspaceSchema = z.object({
  workspace: z.string().trim().max(20000).optional().or(z.literal('')),
});

export async function updateIdeaWorkspace(id: string, input: unknown) {
  const parsed = ideaWorkspaceSchema.parse(input);
  return prisma.idea.update({
    where: { id },
    data: { workspace: parsed.workspace || null },
  });
}

export async function changeIdeaStatus(id: string, status: 'INBOX' | 'ANALYSING' | 'ASSESSED' | 'READY' | 'QUEUED' | 'BUILDING' | 'POC' | 'MVP' | 'PARKED' | 'REJECTED') {
  return prisma.idea.update({
    where: { id },
    data: { status },
  });
}

export async function deleteIdea(id: string) {
  return prisma.idea.delete({ where: { id } });
}

export async function mergeIdeas(targetId: string, sourceId: string) {
  if (targetId === sourceId) {
    throw new Error('Cannot merge an idea with itself');
  }

  const [target, source] = await Promise.all([
    prisma.idea.findUnique({ where: { id: targetId } }),
    prisma.idea.findUnique({ where: { id: sourceId } }),
  ]);

  if (!target) throw new Error('Target idea not found');
  if (!source) throw new Error('Source idea not found');

  await prisma.$transaction([
    prisma.ideaNote.create({
      data: {
        ideaId: targetId,
        content: `🔀 Merged idea "${source.title || 'Untitled idea'}":\n\n${source.rawCapture}${source.summary ? `\n\nSummary: ${source.summary}` : ''}`,
      },
    }),
    prisma.ideaNote.updateMany({
      where: { ideaId: sourceId },
      data: { ideaId: targetId },
    }),
    prisma.idea.delete({ where: { id: sourceId } }),
  ]);

  return getIdea(targetId);
}
