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
      <h1>Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs yet.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="card">
            <h2>{job.type}</h2>
            <p>Status: {job.status}</p>
            <p>Target: {job.executionTarget}</p>
            <p>Approval: {job.requiresApproval ? 'Required' : 'Not required'}</p>
            {job.idea ? <p>Idea: {job.idea.title ?? job.idea.rawCapture}</p> : null}
            {job.project ? <p>Project: {job.project.name}</p> : null}
            <form action={`/api/jobs/${job.id}/approve`} method="post">
              <input type="hidden" name="approver" value="admin" />
              <button type="submit" disabled={!job.requiresApproval || job.status !== 'PENDING'}>
                Approve job
              </button>
            </form>
          </div>
        ))
      )}
      <Link href="/">Back home</Link>
    </main>
  );
}
