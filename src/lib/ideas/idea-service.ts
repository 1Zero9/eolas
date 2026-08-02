import { prisma } from '@/src/lib/db';
import { z } from 'zod';

export const ideaCreateSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal('')),
  rawCapture: z.string().trim().min(1, 'Idea text is required'),
  summary: z.string().trim().max(2000).optional().or(z.literal('')),
  source: z.enum(['WEB', 'MOBILE', 'VOICE', 'IMPORT', 'API']).default('MOBILE'),
});

export type IdeaCreateInput = z.infer<typeof ideaCreateSchema>;

export async function createIdea(organizationId: string, input: IdeaCreateInput) {
  const parsed = ideaCreateSchema.parse(input);
  return prisma.idea.create({
    data: {
      organizationId,
      title: parsed.title || null,
      rawCapture: parsed.rawCapture,
      summary: parsed.summary || null,
      source: parsed.source,
    },
  });
}

export async function listIdeas(organizationId: string) {
  return prisma.idea.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIdea(id: string, organizationId: string) {
  return prisma.idea.findFirst({ where: { id, organizationId } });
}

async function requireIdea(id: string, organizationId: string) {
  const idea = await getIdea(id, organizationId);
  if (!idea) throw new Error('Idea not found');
  return idea;
}

export async function updateIdea(id: string, organizationId: string, input: Partial<IdeaCreateInput>) {
  const parsed = ideaCreateSchema.partial().parse(input);
  await requireIdea(id, organizationId);
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

export async function updateIdeaWorkspace(id: string, organizationId: string, input: unknown) {
  const parsed = ideaWorkspaceSchema.parse(input);
  await requireIdea(id, organizationId);
  return prisma.idea.update({
    where: { id },
    data: { workspace: parsed.workspace || null },
  });
}

export const ideaBuildBriefSchema = z.object({
  buildBrief: z.string().trim().max(20000).optional().or(z.literal('')),
});

export async function updateIdeaBuildBrief(id: string, organizationId: string, input: unknown) {
  const parsed = ideaBuildBriefSchema.parse(input);
  await requireIdea(id, organizationId);
  return prisma.idea.update({
    where: { id },
    data: { buildBrief: parsed.buildBrief || null },
  });
}

export async function changeIdeaStatus(id: string, organizationId: string, status: 'INBOX' | 'ANALYSING' | 'ASSESSED' | 'READY' | 'QUEUED' | 'BUILDING' | 'POC' | 'MVP' | 'PARKED' | 'REJECTED') {
  await requireIdea(id, organizationId);
  return prisma.idea.update({
    where: { id },
    data: { status },
  });
}

export async function deleteIdea(id: string, organizationId: string) {
  await requireIdea(id, organizationId);
  return prisma.idea.delete({ where: { id } });
}

export async function mergeIdeas(targetId: string, sourceId: string, organizationId: string) {
  if (targetId === sourceId) {
    throw new Error('Cannot merge an idea with itself');
  }

  const [target, source] = await Promise.all([
    getIdea(targetId, organizationId),
    getIdea(sourceId, organizationId),
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

  return getIdea(targetId, organizationId);
}
