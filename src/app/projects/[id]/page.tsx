import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import AssemblyPlanActions from '@/src/app/projects/[id]/plan-actions';
import StageActions from '@/src/app/projects/[id]/stage-actions';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  if (!(await isAuthenticatedRoute())) redirect('/login');
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { assemblyPlans: { orderBy: { createdAt: 'desc' } }, jobs: { orderBy: { createdAt: 'desc' }, take: 10, include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
  });
  if (!project) notFound();

  return (
    <main>
      <section className="card surface hero-card">
        <h1>{project.name}</h1>
        <p className="small-text">{project.description ?? 'Promoted from an Eolas idea.'}</p>
        <div className="meta-row"><span className="status-pill">{project.status}</span><span className="status-pill">{project.slug}</span></div>
      </section>
      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <h2>Assembly plans</h2>
        {project.assemblyPlans.length === 0 ? <p className="small-text">No assembly plan exists yet.</p> : project.assemblyPlans.map((plan) => (
          <AssemblyPlanActions key={plan.id} plan={{ id: plan.id, status: plan.status, planHash: plan.planHash, conflicts: plan.conflicts, reuseMetrics: plan.reuseMetrics, accelerators: plan.accelerators }} />
        ))}
      </section>
      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <h2>Execution</h2>
        {project.localPath ? <p className="small-text">Local workspace: <code>{project.localPath}</code></p> : <p className="small-text">No local workspace has been created.</p>}
        {project.jobs.map((job) => <p key={job.id} className="small-text"><code>{job.type}</code> — {job.status}{job.errorMessage ? `: ${job.errorMessage}` : ''}{job.events[0] ? ` · ${job.events[0].eventType}` : ''}</p>)}
        {project.localPath ? <StageActions projectId={project.id} githubUrl={project.githubUrl} /> : null}
      </section>
      <Link href="/projects" className="button-secondary" style={{ padding: '0.85rem 1.3rem', display: 'inline-block', marginTop: '1.5rem' }}>Back to projects</Link>
    </main>
  );
}
