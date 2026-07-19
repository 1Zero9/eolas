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
      </section>

      {ideas.length === 0 ? (
        <section className="card surface" style={{ marginTop: '1.5rem' }}>
          <p>No ideas yet. Capture one from the mobile view.</p>
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
                  <p className="small-text">
                    Status: {idea.status} · Source: {idea.source}
                  </p>
                  <Link href={`/ideas/${idea.id}`}>Open idea</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
