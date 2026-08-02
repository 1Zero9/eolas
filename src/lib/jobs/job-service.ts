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
      events: { create: { eventType: 'CREATED', message: parsed.requiresApproval ? 'Job created and awaiting approval.' : 'Job created and queued.' } },
    },
  });
}

export async function approveJob(id: string, approver: string) {
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new Error('Job not found');
  if (existing.type === 'create_local_workspace') {
    const payload = existing.payload as { assemblyPlanId?: unknown; planHash?: unknown };
    if (typeof payload.assemblyPlanId !== 'string' || typeof payload.planHash !== 'string') {
      throw new Error('Legacy workspace jobs cannot be approved. Create and approve a new assembly plan from the project instead.');
    }
  }
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id },
      data: { status: 'QUEUED', approvedAt: new Date(), approvedBy: approver, requiresApproval: false },
    });
    await tx.jobEvent.create({ data: { jobId: id, eventType: 'APPROVED', message: `Approved by ${approver}.` } });
    return job;
  });
}

export async function claimJob(workerName: string) {
  const worker = await prisma.worker.findUnique({
    where: { name: workerName },
  });

  if (!worker) {
    return null;
  }

  const candidates = await prisma.job.findMany({
    where: {
      executionTarget: 'LOCAL_WORKER',
      status: 'QUEUED',
      requiresApproval: false,
    },
    orderBy: { priority: 'asc' },
    take: 5,
  });

  for (const candidate of candidates) {
    const claim = await prisma.job.updateMany({
      where: { id: candidate.id, status: 'QUEUED' },
      data: {
        status: 'RUNNING',
        lockedAt: new Date(),
        lockedBy: worker.id,
        workerId: worker.id,
        startedAt: new Date(),
      },
    });

    if (claim.count === 1) {
      await prisma.jobEvent.create({ data: { jobId: candidate.id, eventType: 'CLAIMED', message: `Claimed by worker ${worker.name}.`, metadata: { workerId: worker.id } } });
      return prisma.job.findUnique({ where: { id: candidate.id } });
    }
  }

  return null;
}

export async function completeJob(jobId: string, result: any) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.update({ where: { id: jobId }, data: { status: 'COMPLETED', completedAt: new Date(), result, errorMessage: null } });
    await tx.jobEvent.create({ data: { jobId, eventType: 'COMPLETED', message: 'Worker reported successful completion.', metadata: result ?? undefined } });
    return job;
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.job.update({ where: { id: jobId }, data: { status: shouldRetry ? 'QUEUED' : 'FAILED', attempts, errorMessage, lockedAt: null, lockedBy: null, workerId: null } });
    await tx.jobEvent.create({ data: { jobId, eventType: shouldRetry ? 'RETRY_QUEUED' : 'FAILED', message: errorMessage, metadata: { attempts } } });
    return updated;
  });
}
