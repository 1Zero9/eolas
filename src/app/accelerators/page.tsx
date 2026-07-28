import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import {
  listAccelerators,
  listDiscoveredAccelerators,
  getAcceleratorsByIds,
} from '@/src/lib/accelerators/accelerator-service';
import DiscoveredAccelerators from '@/src/app/accelerators/discovered-accelerators';

export const dynamic = 'force-dynamic';

export default async function AcceleratorsPage() {
  const authenticated = await isAuthenticatedRoute();

  if (!authenticated) {
    redirect('/login');
  }

  let accelerators = [] as Awaited<ReturnType<typeof getAcceleratorsByIds>>;
  let discovered = [] as Awaited<ReturnType<typeof listDiscoveredAccelerators>>;

  try {
    const summaries = await listAccelerators();
    accelerators = await getAcceleratorsByIds(summaries.map((accelerator) => accelerator.slug));
  } catch {
    accelerators = [];
  }

  try {
    discovered = await listDiscoveredAccelerators();
  } catch {
    discovered = [];
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>Accelerators</h1>
        <p className="small-text">
          Reusable, working code blocks pulled out of past builds — so the next idea doesn&apos;t start from zero.
          Pick these when you promote an idea to a project.
        </p>
      </section>

      <DiscoveredAccelerators accelerators={discovered} />

      {accelerators.length === 0 ? (
        <section className="card surface" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem' }}>
          <h2>Nothing here yet</h2>
          <p className="small-text" style={{ maxWidth: '28rem', margin: '0.75rem auto 0' }}>
            No accelerators have been registered yet.
          </p>
        </section>
      ) : (
        <section className="card surface" style={{ marginTop: '1.5rem' }}>
          <div className="timeline">
            {accelerators.map((accelerator) => (
              <div key={accelerator.id} className="timeline-event">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <h2>{accelerator.name}</h2>
                  <p>{accelerator.description}</p>
                  <div className="meta-row">
                    <span className="status-pill">{accelerator.category}</span>
                    {accelerator.capabilities.map((capability) => (
                      <span key={capability} className="status-pill">
                        {capability}
                      </span>
                    ))}
                  </div>
                  <p className="small-text" style={{ marginTop: '0.75rem' }}>
                    Files: {accelerator.files.map((file) => file.path).join(', ')}
                  </p>
                  <p className="small-text" style={{ marginTop: '0.25rem' }}>
                    Source: <code>accelerators/{accelerator.slug}/</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
