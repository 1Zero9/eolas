import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';

export default async function HomePage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Eolas</h1>
      <p>Capture ideas quickly and keep them in your inbox.</p>
      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
        <Link href="/capture" style={{ display: 'inline-block' }}>
          <button type="button">Capture an idea</button>
        </Link>
        <Link href="/ideas" style={{ display: 'inline-block' }}>
          <button type="button">View ideas</button>
        </Link>
        <Link href="/projects" style={{ display: 'inline-block' }}>
          <button type="button">View projects</button>
        </Link>
        <Link href="/jobs" style={{ display: 'inline-block' }}>
          <button type="button">View jobs</button>
        </Link>
      </div>
    </main>
  );
}
