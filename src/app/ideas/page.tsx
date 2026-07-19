import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { listIdeas } from '@/src/lib/ideas/idea-service';

export const dynamic = 'force-dynamic';

export default async function IdeasPage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  let ideas = [] as Awaited<ReturnType<typeof listIdeas>>;

  try {
    ideas = await listIdeas();
  } catch {
    ideas = [];
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>Ideas inbox</h1>
        <p className="small-text">Review your captured thoughts, refine them, and move the best into the workspace.</p>
        <div className="button-grid">
          <Link href="/capture">
            <button type="button">+ Capture an idea</button>
          </Link>
        </div>
      </section>

      {ideas.length === 0 ? (
        <section className="card surface" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h2>Nothing here yet</h2>
          <p className="small-text" style={{ maxWidth: '28rem', margin: '0.75rem auto 0' }}>
            Your inbox fills as you capture. Every idea logged here can be iterated, promoted, and
            accelerated into a build.
          </p>
        </section>
      ) : (
        <section className="card surface" style={{ marginTop: '1.5rem' }}>
          <div className="timeline">
            {ideas.map((idea) => (
              <div key={idea.id} className="timeline-event">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <h2>{idea.title ?? 'Untitled idea'}</h2>
                  <p>{idea.rawCapture}</p>
                  <div className="meta-row">
                    <span className="status-pill">{idea.status}</span>
                    <span className="status-pill">{idea.source}</span>
                  </div>
                  <div className="button-grid" style={{ marginTop: '1rem' }}>
                    <Link href={`/ideas/${idea.id}`}>
                      <button type="button" className="button-secondary">Open idea →</button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
