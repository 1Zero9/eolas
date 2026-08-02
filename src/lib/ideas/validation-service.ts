import { z } from 'zod';
import { prisma } from '@/src/lib/db';

export const validationCreateSchema = z.object({
  decision: z.enum(['VALIDATE', 'BUILD', 'PARK', 'REJECT']),
  problemClarity: z.number().int().min(1).max(5),
  evidenceStrength: z.number().int().min(1).max(5),
  effortEstimate: z.number().int().min(1).max(5),
  riskiestAssumption: z.string().trim().min(5).max(3000),
  smallestTest: z.string().trim().min(5).max(3000),
  decisionRationale: z.string().trim().min(5).max(3000),
  evidenceLinks: z.array(z.string().url()).max(10).default([]),
  createdBy: z.string().trim().min(1).max(100).default('owner'),
});

export async function createValidation(ideaId: string, input: unknown) {
  const data = validationCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const validation = await tx.ideaValidation.create({ data: { ideaId, ...data } });
    const status = data.decision === 'BUILD' ? 'READY' : data.decision === 'PARK' ? 'PARKED' : data.decision === 'REJECT' ? 'REJECTED' : 'ASSESSED';
    await tx.idea.update({ where: { id: ideaId }, data: { status } });
    return validation;
  });
}

export async function listValidations(ideaId: string) {
  return prisma.ideaValidation.findMany({ where: { ideaId }, orderBy: { createdAt: 'desc' } });
}
