import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const authenticated = await isAuthenticatedRoute();
  if (!authenticated) {
    redirect('/login');
  }

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      idea: true,
      project: true,
    },
  });

  return (
    <main>
      <section className="card surface hero-card">
        <h1>Jobs</h1>
        <p className="small-text">See queued work, approvals, and worker status in one place.</p>
      </section>

      {jobs.length === 0 ? (
        <section className="card surface" style={{ marginTop: '1.5rem' }}>
          <p>No jobs yet.</p>
        </section>
      ) : (
        <section className="card-grid" style={{ marginTop: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job.id} className="card surface">
              <h2>{job.type}</h2>
              <div className="meta-row" style={{ marginTop: '0.85rem' }}>
                <span className="status-pill">{job.status}</span>
                <span className="status-pill">Target: {job.executionTarget}</span>
                <span className="status-pill">Approval: {job.requiresApproval ? 'Required' : 'Not required'}</span>
              </div>
              {job.idea ? <p className="small-text">Idea: {job.idea.title ?? job.idea.rawCapture}</p> : null}
              {job.project ? <p className="small-text">Project: {job.project.name}</p> : null}
              <form action={`/api/jobs/${job.id}/approve`} method="post" style={{ marginTop: '1rem' }}>
                <input type="hidden" name="approver" value="admin" />
                <button type="submit" disabled={!job.requiresApproval || job.status !== 'PENDING'}>
                  Approve job
                </button>
              </form>
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
