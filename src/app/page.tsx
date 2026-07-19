import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import InstallPrompt from '@/src/app/components/install-prompt';

export default async function HomePage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  return (
    <main>
      <section className="card surface">
        <h1>Eolas</h1>
        <p>Capture ideas quickly, keep them in your inbox, and promote them into local-first projects with confidence.</p>
      </section>

      <InstallPrompt />

      <section className="button-grid">
        <Link href="/capture">
          <button type="button">Capture an idea</button>
        </Link>
        <Link href="/mobile">
          <button type="button">Mobile capture</button>
        </Link>
        <Link href="/ideas">
          <button type="button">View ideas</button>
        </Link>
        <Link href="/projects">
          <button type="button">View projects</button>
        </Link>
        <Link href="/jobs">
          <button type="button">View jobs</button>
        </Link>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <h2>Quick actions</h2>
        <p className="small-text">Jump straight into idea capture or review your latest thoughts.</p>
        <div className="button-grid" style={{ marginTop: '1rem' }}>
          <Link href="/mobile">
            <button type="button">Travel capture</button>
          </Link>
          <Link href="/ideas">
            <button type="button">Recent ideas</button>
          </Link>
        </div>
      </section>
    </main>
  );
}
