import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

const stages = new Set(['install_dependencies', 'run_build', 'git_commit', 'github_backup']);

function isGitHubRemote(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 500) return false;
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(value) || /^git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?$/.test(value);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError;
  const organization = await requireActiveOrganization();
  try {
    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    if (!stages.has(type)) return NextResponse.json({ error: 'Unsupported project stage' }, { status: 400 });
    const project = await prisma.project.findFirst({ where: { id: params.id, organizationId: organization.id }, include: { assemblyPlans: { where: { status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 1 } } });
    if (!project || !project.localPath || !project.assemblyPlans[0]) return NextResponse.json({ error: 'Complete an approved workspace plan before scheduling a build stage.' }, { status: 409 });
    const prerequisite = type === 'run_build' ? 'install_dependencies' : type === 'git_commit' ? 'run_build' : type === 'github_backup' ? 'git_commit' : null;
    if (prerequisite) {
      const passed = await prisma.job.findFirst({ where: { projectId: project.id, type: prerequisite, status: 'COMPLETED' } });
      if (!passed) return NextResponse.json({ error: `${prerequisite.replace('_', ' ')} must complete first.` }, { status: 409 });
    }
    const active = await prisma.job.findFirst({ where: { projectId: project.id, type, status: { in: ['PENDING', 'QUEUED', 'RUNNING'] } } });
    if (active) return NextResponse.json({ job: active });
    if (type === 'github_backup' && !isGitHubRemote(body?.githubUrl)) return NextResponse.json({ error: 'Provide an existing GitHub HTTPS or SSH repository URL.' }, { status: 400 });
    const plan = project.assemblyPlans[0];
    const job = await prisma.job.create({ data: { projectId: project.id, organizationId: project.organizationId, type, executionTarget: 'LOCAL_WORKER', status: 'PENDING', requiresApproval: true, payload: { projectId: project.id, slug: project.slug, localPath: project.localPath, assemblyPlanId: plan.id, planHash: plan.planHash, ...(type === 'github_backup' ? { githubUrl: body.githubUrl } : {}) }, events: { create: { eventType: 'CREATED', message: `${type.replaceAll('_', ' ')} requested and awaiting approval.`, metadata: { assemblyPlanId: plan.id } } } } });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to schedule stage' }, { status: 400 }); }
}
