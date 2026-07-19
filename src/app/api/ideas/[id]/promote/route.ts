import { NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { createProjectFromIdea } from '@/src/lib/projects/project-service';
import { createJob } from '@/src/lib/jobs/job-service';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const project = await createProjectFromIdea({
    ideaId: idea.id,
    name: idea.title ?? `Project for ${idea.id}`,
    description: idea.summary ?? `Project promoted from idea ${idea.id}`,
  });

  await createJob({
    ideaId: idea.id,
    projectId: project.id,
    type: 'create_local_workspace',
    executionTarget: 'LOCAL_WORKER',
    payload: {
      projectId: project.id,
      projectName: project.name,
      slug: project.slug,
      files: [
        {
          path: 'README.md',
          content: `# ${project.name}\n\n${project.description ?? ''}`,
        },
        {
          path: 'docs/idea.md',
          content: `# Idea\n\n${idea.rawCapture}`,
        },
      ],
      initialiseGit: true,
    },
    requiresApproval: true,
  });

  return NextResponse.json({ project });
}
