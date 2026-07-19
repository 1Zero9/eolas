import Link from 'next/link';
import { listIdeas } from '@/src/lib/ideas/idea-service';

export default async function IdeasPage() {
  const ideas = await listIdeas();

  return (
    <main>
      <h1>Ideas inbox</h1>
      {ideas.length === 0 ? (
        <p>No ideas yet. Capture one from the mobile view.</p>
      ) : (
        ideas.map((idea) => (
          <div key={idea.id} className="card">
            <h2>{idea.title ?? 'Untitled idea'}</h2>
            <p>{idea.rawCapture}</p>
            <p>
              Status: {idea.status} · Source: {idea.source}
            </p>
            <Link href={`/ideas/${idea.id}`}>Open idea</Link>
          </div>
        ))
      )}
    </main>
  );
}
