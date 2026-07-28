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
