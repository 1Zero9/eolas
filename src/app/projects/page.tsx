import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet. Promote an idea to create a project.</p>
      ) : (
        projects.map((project) => (
          <div key={project.id} className="card">
            <h2>{project.name}</h2>
            <p>Slug: {project.slug}</p>
            <p>Status: {project.status}</p>
            <p>{project.description}</p>
            <Link href={`/projects/${project.id}`}>Open project</Link>
          </div>
        ))
      )}
      <Link href="/">Back home</Link>
    </main>
  );
}
