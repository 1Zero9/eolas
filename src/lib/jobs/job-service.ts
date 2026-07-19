import { prisma } from '@/src/lib/db';
import { z } from 'zod';

export const jobCreateSchema = z.object({
  ideaId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  type: z.string().min(1),
  executionTarget: z.enum(['CLOUD', 'LOCAL_WORKER', 'EXTERNAL_SERVICE']),
  payload: z.record(z.any()),
  requiresApproval: z.boolean().default(false),
});

export async function createJob(input: z.infer<typeof jobCreateSchema>) {
  const parsed = jobCreateSchema.parse(input);
  return prisma.job.create({
    data: {
      ideaId: parsed.ideaId,
      projectId: parsed.projectId,
      type: parsed.type,
      executionTarget: parsed.executionTarget,
      status: 'PENDING',
      payload: parsed.payload,
      requiresApproval: parsed.requiresApproval,
    },
  });
}

export async function approveJob(id: string, approver: string) {
  return prisma.job.update({
    where: { id },
    data: {
      status: 'QUEUED',
      approvedAt: new Date(),
      approvedBy: approver,
      requiresApproval: false,
    },
  });
}

export async function claimJob(workerName: string) {
  const worker = await prisma.worker.findUnique({
    where: { name: workerName },
  });

  if (!worker) {
    return null;
  }

  const job = await prisma.job.findFirst({
    where: {
      executionTarget: 'LOCAL_WORKER',
      status: 'QUEUED',
      requiresApproval: false,
    },
    orderBy: { priority: 'asc' },
  });

  if (!job) {
    return null;
  }

  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: 'RUNNING',
      lockedAt: new Date(),
      lockedBy: worker.id,
      workerId: worker.id,
      startedAt: new Date(),
    },
  });
}

export async function completeJob(jobId: string, result: any) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      result,
      errorMessage: null,
    },
  });
}

export async function failJob(jobId: string, errorMessage: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return null;
  }

  const attempts = job.attempts + 1;
  const shouldRetry = attempts < job.maxAttempts;

  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? 'QUEUED' : 'FAILED',
      attempts,
      errorMessage,
      lockedAt: null,
      lockedBy: null,
      workerId: null,
    },
  });
}
