import { prisma } from '@/src/lib/db';
import { z } from 'zod';
import { slugify, normalizeText } from '@/src/lib/utils';

export const projectCreateSchema = z.object({
  ideaId: z.string().cuid(),
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export async function createProjectFromIdea(input: ProjectCreateInput) {
  const parsed = projectCreateSchema.parse(input);
  const title = normalizeText(parsed.name);
  const description = normalizeText(parsed.description) || null;
  const slugBase = slugify(title);
  const slug = await getUniqueSlug(slugBase);

  const project = await prisma.project.create({
    data: {
      ideaId: parsed.ideaId,
      name: title,
      slug,
      description,
      status: 'PLANNED',
    },
  });

  return project;
}

async function getUniqueSlug(base: string) {
  let candidate = base;
  let suffix = 1;

  while (await prisma.project.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
