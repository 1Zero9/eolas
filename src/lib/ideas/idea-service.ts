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

export async function changeIdeaStatus(id: string, status: 'INBOX' | 'ANALYSING' | 'ASSESSED' | 'READY' | 'QUEUED' | 'BUILDING' | 'POC' | 'MVP' | 'PARKED' | 'REJECTED') {
  return prisma.idea.update({
    where: { id },
    data: { status },
  });
}
