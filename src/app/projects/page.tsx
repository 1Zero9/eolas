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
      <section className="card surface hero-card">
        <h1>Projects</h1>
        <p className="small-text">Track the workspaces you’ve promoted from ideas and see progress at a glance.</p>
      </section>

      {projects.length === 0 ? (
        <section className="card surface" style={{ marginTop: '1.5rem' }}>
          <p>No projects yet. Promote an idea to create a project.</p>
        </section>
      ) : (
        <section className="card-grid" style={{ marginTop: '1.5rem' }}>
          {projects.map((project) => (
            <div key={project.id} className="card surface">
              <h2>{project.name}</h2>
              <div className="meta-row" style={{ marginTop: '0.85rem' }}>
                <span className="status-pill">Slug: {project.slug}</span>
                <span className="status-pill">Status: {project.status}</span>
              </div>
              <p>{project.description}</p>
              <Link href={`/projects/${project.id}`} className="button-secondary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1rem' }}>
                Open project
              </Link>
            </div>
          ))}
        </section>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <Link href="/" className="button-secondary" style={{ padding: '0.85rem 1.3rem', display: 'inline-block' }}>
          Back home
        </Link>
      </section>
    </main>
  );
}
