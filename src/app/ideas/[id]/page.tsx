import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { getIdea } from '@/src/lib/ideas/idea-service';

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  const idea = await getIdea(params.id);

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
      <h1>{idea.title ?? 'Untitled idea'}</h1>
      <p>{idea.rawCapture}</p>
      <p>Status: {idea.status}</p>
      <p>Source: {idea.source}</p>
      <p>Created: {idea.createdAt.toLocaleString()}</p>
      <form action={`/api/ideas/${idea.id}/analyse`} method="post">
        <button type="submit">Analyse idea</button>
      </form>
      <Link href="/ideas">Back to ideas</Link>
    </main>
  );
}
