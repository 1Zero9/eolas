import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import InstallPrompt from '@/src/app/components/install-prompt';

export const dynamic = 'force-dynamic';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  let ideaCount = 0;
  let projectCount = 0;
  let jobCount = 0;
  let recentIdeas: Array<{ id: string; title: string | null; rawCapture: string; createdAt: Date }> = [];

  try {
    [ideaCount, projectCount, jobCount, recentIdeas] = await Promise.all([
      prisma.idea.count(),
      prisma.project.count(),
      prisma.job.count(),
      prisma.idea.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, title: true, rawCapture: true, createdAt: true },
      }),
    ]);
  } catch {
    // render with empty stats if the database is unavailable
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>{greeting()} 👋</h1>
        <p>
          Capture ideas the moment they land, iterate on them anywhere, then promote the best into
          local-first builds accelerated by pre-compiled elements.
        </p>
        <div className="button-grid">
          <Link href="/capture">
            <button type="button">+ Capture an idea</button>
          </Link>
          <Link href="/ideas">
            <button type="button" className="button-secondary">Open inbox</button>
          </Link>
        </div>
      </section>

      <InstallPrompt />

      <section className="stat-grid">
        <Link href="/ideas" className="stat-card">
          <div className="stat-value">{ideaCount}</div>
          <div className="stat-label">Ideas captured</div>
        </Link>
        <Link href="/projects" className="stat-card">
          <div className="stat-value">{projectCount}</div>
          <div className="stat-label">Projects</div>
        </Link>
        <Link href="/jobs" className="stat-card">
          <div className="stat-value">{jobCount}</div>
          <div className="stat-label">Jobs</div>
        </Link>
        <div className="stat-card stat-accent">
          <div className="stat-value">70%</div>
          <div className="stat-label">Accelerator target</div>
        </div>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <h2>Build pipeline</h2>
        <p className="small-text">
          Every idea travels the same path — from a quick note to a project scaffolded from
          pre-defined code accelerators.
        </p>
        <div className="pipeline">
          <div className="pipeline-step done">
            <h3>1 · Capture</h3>
            <p>Log the idea from any device, even offline.</p>
          </div>
          <div className="pipeline-step done">
            <h3>2 · Iterate</h3>
            <p>Refine it with notes and timeline history.</p>
          </div>
          <div className="pipeline-step next">
            <h3>3 · Promote</h3>
            <p>Approve it into a local-first project workspace.</p>
          </div>
          <div className="pipeline-step">
            <h3>4 · Accelerate</h3>
            <p>Auto-scaffold to ~70% using pre-compiled elements.</p>
          </div>
        </div>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h2>Recent ideas</h2>
          <Link href="/ideas" className="small-text" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            View all →
          </Link>
        </div>
        {recentIdeas.length === 0 ? (
          <p className="small-text">Nothing captured yet — your next idea starts the pipeline.</p>
        ) : (
          <div style={{ marginTop: '0.5rem' }}>
            {recentIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`} className="idea-row">
                <div style={{ minWidth: 0 }}>
                  <h3>{idea.title ?? 'Untitled idea'}</h3>
                  <p>{idea.rawCapture}</p>
                </div>
                <span className="small-text" style={{ whiteSpace: 'nowrap' }}>
                  {idea.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
