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
        <h1>Good morning 👋</h1>
        <p>Capture ideas quickly, keep them in your inbox, and promote them into local-first projects with confidence.</p>
        <div className="button-grid">
          <Link href="/capture">
            <button type="button">+ Capture an idea</button>
          </Link>
          <Link href="/mobile">
            <button type="button" className="button-secondary">Mobile capture</button>
          </Link>
        </div>
      </section>

      <InstallPrompt />

      <section className="card-grid">
        <div className="card">
          <h2>Ideas inbox</h2>
          <p className="small-text">Review and iterate on your captured thoughts.</p>
          <div className="button-grid">
            <Link href="/ideas">
              <button type="button" className="button-secondary">View ideas</button>
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Projects</h2>
          <p className="small-text">Ideas promoted into local-first workspaces.</p>
          <div className="button-grid">
            <Link href="/projects">
              <button type="button" className="button-secondary">View projects</button>
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Jobs</h2>
          <p className="small-text">Track build pipeline and worker activity.</p>
          <div className="button-grid">
            <Link href="/jobs">
              <button type="button" className="button-secondary">View jobs</button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
