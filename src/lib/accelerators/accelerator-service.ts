import { prisma } from '@/src/lib/db';

export type AcceleratorFile = { path: string; content: string };

export async function listAccelerators() {
  return prisma.accelerator.findMany({
    where: { status: 'APPROVED' },
    orderBy: { name: 'asc' },
  });
}

export async function getAcceleratorsByIds(ids: string[]) {
  if (!ids.length) return [];
  return prisma.accelerator.findMany({
    where: { id: { in: ids }, status: 'APPROVED' },
  });
}

export async function getAccelerator(id: string) {
  return prisma.accelerator.findUnique({ where: { id } });
}

export async function listDiscoveredAccelerators() {
  return prisma.accelerator.findMany({
    where: { status: 'DISCOVERED' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listRecentAccelerators(limit = 25) {
  return prisma.accelerator.findMany({
    where: { status: { in: ['APPROVED', 'DISCOVERED'] } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export type DiscoveredAcceleratorInput = {
  name: string;
  slug: string;
  description?: string;
  category: string;
  capabilities?: string[];
  files: AcceleratorFile[];
};

export async function upsertDiscoveredAccelerators(candidates: DiscoveredAcceleratorInput[]) {
  const results = [];

  for (const candidate of candidates) {
    const existing = await prisma.accelerator.findUnique({ where: { slug: candidate.slug } });

    if (existing) {
      continue;
    }

    const created = await prisma.accelerator.create({
      data: {
        name: candidate.name,
        slug: candidate.slug,
        description: candidate.description,
        category: candidate.category,
        capabilities: candidate.capabilities || [],
        files: candidate.files,
        status: 'DISCOVERED',
      },
    });

    results.push(created);
  }

  return results;
}

export async function setAcceleratorStatus(id: string, status: 'APPROVED' | 'DISMISSED') {
  return prisma.accelerator.update({ where: { id }, data: { status } });
}
