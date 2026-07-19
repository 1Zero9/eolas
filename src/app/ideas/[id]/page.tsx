import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { getIdea } from '@/src/lib/ideas/idea-service';
import IdeaIterations from '@/src/app/ideas/[id]/components/idea-iterations';

export const dynamic = 'force-dynamic';

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  let idea = null as Awaited<ReturnType<typeof getIdea>>;

  try {
    idea = await getIdea(params.id);
  } catch {
    idea = null;
  }

  if (!idea) {
    return (
      <main>
        <p>Idea not found.</p>
        <Link href="/ideas">Back to ideas</Link>
      </main>
    );
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>{idea.title ?? 'Untitled idea'}</h1>
        <p className="small-text">Inspect the full idea, review previous notes, and take it further from here.</p>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <p>{idea.rawCapture}</p>
        {idea.summary ? <p className="small-text">{idea.summary}</p> : null}
        <div className="meta-row" style={{ marginTop: '1rem' }}>
          <span className="status-pill">{idea.status}</span>
          <span className="status-pill">Source: {idea.source}</span>
          <span className="status-pill">Created: {idea.createdAt.toLocaleString()}</span>
        </div>

        <div className="button-grid" style={{ marginTop: '1.5rem' }}>
          <form action={`/api/ideas/${idea.id}/analyse`} method="post">
            <button type="submit">Analyse idea</button>
          </form>
          <form action={`/api/ideas/${idea.id}/promote`} method="post">
            <button type="submit">Promote to project</button>
          </form>
        </div>
      </section>

      <IdeaIterations ideaId={idea.id} />

      <section style={{ marginTop: '1.5rem' }}>
        <Link href="/ideas" className="button-secondary" style={{ padding: '0.85rem 1.3rem', display: 'inline-block' }}>
          Back to ideas
        </Link>
      </section>
    </main>
  );
}
