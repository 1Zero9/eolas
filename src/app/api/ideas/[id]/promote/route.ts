import { NextRequest, NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { createProjectFromIdea } from '@/src/lib/projects/project-service';
import { createAssemblyPlan } from '@/src/lib/assembly/assembly-plan-service';
import { requireAuth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { listValidations } from '@/src/lib/ideas/validation-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const [latestValidation] = await listValidations(idea.id);
  if (!latestValidation || latestValidation.decision !== 'BUILD') {
    return NextResponse.json({ error: 'Record a “Ready to build” validation decision before creating an assembly plan.' }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const acceleratorIds = Array.isArray(body?.acceleratorIds)
    ? body.acceleratorIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];

  try {
    const project = await prisma.project.findUnique({ where: { ideaId: idea.id } }) ?? await createProjectFromIdea({
      ideaId: idea.id,
      name: idea.title ?? `Project for ${idea.id}`,
      description: idea.summary ?? `Project promoted from idea ${idea.id}`,
    });
    const plan = await createAssemblyPlan({ projectId: project.id, idea, project, acceleratorIds });
    return NextResponse.json({ project, plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create assembly plan' }, { status: 400 });
  }
}
