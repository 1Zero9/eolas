import { NextRequest, NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { createProjectFromIdea } from '@/src/lib/projects/project-service';
import { createJob } from '@/src/lib/jobs/job-service';
import { getAcceleratorsByIds } from '@/src/lib/accelerators/accelerator-service';
import { requireAuth } from '@/src/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const acceleratorIds = Array.isArray(body?.acceleratorIds)
    ? body.acceleratorIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];

  const accelerators = await getAcceleratorsByIds(acceleratorIds);

  const project = await createProjectFromIdea({
    ideaId: idea.id,
    name: idea.title ?? `Project for ${idea.id}`,
    description: idea.summary ?? `Project promoted from idea ${idea.id}`,
  });

  const ideaFiles = [
    {
      path: 'README.md',
      content: `# ${project.name}\n\n${project.description ?? ''}`,
    },
    {
      path: 'docs/idea.md',
      content: `# Idea\n\n${idea.rawCapture}`,
    },
    {
      path: 'docs/build-brief.md',
      content: idea.buildBrief
        ? `# Build brief\n\n${idea.buildBrief}`
        : `# Build brief\n\nNo build brief was generated for this idea before promotion.\n\n## Idea\n\n${idea.rawCapture}${idea.summary ? `\n\n## Summary\n\n${idea.summary}` : ''}`,
    },
  ];

  const files = new Map<string, string>();
  for (const accelerator of accelerators) {
    for (const file of accelerator.files) {
      files.set(file.path, file.content);
    }
  }
  for (const file of ideaFiles) {
    files.set(file.path, file.content);
  }

  await createJob({
    ideaId: idea.id,
    projectId: project.id,
    type: 'create_local_workspace',
    executionTarget: 'LOCAL_WORKER',
    payload: {
      projectId: project.id,
      projectName: project.name,
      slug: project.slug,
      files: Array.from(files.entries()).map(([path, content]) => ({ path, content })),
      accelerators: accelerators.map((accelerator) => ({ id: accelerator.id, name: accelerator.name })),
      initialiseGit: true,
    },
    requiresApproval: true,
  });

  return NextResponse.json({ project });
}
