import { z } from 'zod';
import { prisma } from '@/src/lib/db';
import { getAcceleratorsByIds } from '@/src/lib/accelerators/accelerator-service';
import { assemblePlanSnapshot, immutableHash, type PlannedFile, type PlanMetrics } from '@/src/lib/assembly/assembly-plan-utils';

export type { PlannedFile, PlanMetrics } from '@/src/lib/assembly/assembly-plan-utils';

const planRequestSchema = z.object({
  acceleratorIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(20).default([]),
});


export async function createAssemblyPlan(input: {
  projectId: string;
  idea: { rawCapture: string; buildBrief: string | null; summary: string | null };
  project: { name: string; slug: string; description: string | null };
  acceleratorIds: unknown;
}) {
  const { acceleratorIds } = planRequestSchema.parse({ acceleratorIds: input.acceleratorIds });
  const uniqueIds = [...new Set(acceleratorIds)];
  const accelerators = await getAcceleratorsByIds(uniqueIds);

  if (accelerators.length !== uniqueIds.length) {
    const found = new Set(accelerators.map((accelerator) => accelerator.slug));
    throw new Error(`Unknown accelerator: ${uniqueIds.find((id) => !found.has(id))}`);
  }

  const projectFiles = [
    { path: 'README.md', content: `# ${input.project.name}\n\n${input.project.description ?? ''}\n` },
    { path: 'docs/idea.md', content: `# Original idea\n\n${input.idea.rawCapture}\n` },
    { path: 'docs/build-brief.md', content: `# Build brief\n\n${input.idea.buildBrief ?? input.idea.summary ?? 'No build brief was generated before promotion.'}\n` },
  ];
  const snapshot = assemblePlanSnapshot(accelerators, projectFiles);
  const acceleratorRecords = accelerators.map((accelerator) => ({
    slug: accelerator.slug,
    name: accelerator.name,
    version: accelerator.version,
    dependencies: accelerator.dependencies,
    targetStacks: accelerator.targetStacks,
  }));
  const immutablePayload = { projectId: input.projectId, accelerators: acceleratorRecords, files: snapshot.files, metrics: snapshot.metrics, conflicts: snapshot.conflicts };

  const created = await prisma.assemblyPlan.create({
    data: {
      projectId: input.projectId,
      planHash: immutableHash(immutablePayload),
      accelerators: acceleratorRecords,
      files: snapshot.files,
      reuseMetrics: snapshot.metrics,
      conflicts: immutablePayload.conflicts,
    },
  });
  await prisma.assemblyPlan.updateMany({
    where: { projectId: input.projectId, status: 'DRAFT', id: { not: created.id } },
    data: { status: 'SUPERSEDED' },
  });
  return created;
}

export async function approveAssemblyPlan(id: string, approver: string) {
  const plan = await prisma.assemblyPlan.findUnique({ where: { id }, include: { project: true } });
  if (!plan) throw new Error('Assembly plan not found');
  if (plan.status !== 'DRAFT') throw new Error(`Only draft plans can be approved (current status: ${plan.status})`);
  if (Array.isArray(plan.conflicts) && plan.conflicts.length > 0) throw new Error('Resolve plan conflicts before approval');

  return prisma.$transaction(async (tx) => {
    const approved = await tx.assemblyPlan.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: approver },
    });
    const existingJob = await tx.job.findFirst({ where: { projectId: plan.projectId, type: 'create_local_workspace', status: { in: ['PENDING', 'QUEUED', 'RUNNING'] } } });
    if (!existingJob) {
      await tx.job.create({
        data: {
          ideaId: plan.project.ideaId,
          projectId: plan.projectId,
          organizationId: plan.project.organizationId,
          type: 'create_local_workspace',
          executionTarget: 'LOCAL_WORKER',
          requiresApproval: false,
          status: 'QUEUED',
          payload: { assemblyPlanId: plan.id, planHash: plan.planHash, projectId: plan.projectId, projectName: plan.project.name, slug: plan.project.slug, files: plan.files, initialiseGit: true },
          events: { create: { eventType: 'PLAN_APPROVED', message: `Assembly plan ${plan.id} approved; workspace job queued.`, metadata: { planHash: plan.planHash } } },
        },
      });
    }
    return approved;
  });
}
