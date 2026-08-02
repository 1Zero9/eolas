'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DiscoveredAccelerator = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  files: unknown;
};

export default function DiscoveredAccelerators({
  accelerators,
}: {
  accelerators: DiscoveredAccelerator[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: 'APPROVED' | 'DISMISSED') {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/accelerators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to update accelerator');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update accelerator');
    } finally {
      setBusyId(null);
    }
  }

  if (accelerators.length === 0) return null;

  return (
    <section className="card surface" style={{ marginTop: '1.5rem' }}>
      <h2>Discovered — needs review</h2>
      <p className="small-text">
        Found by scanning your local project repos. These are staging candidates only — approving marks a
        candidate as reviewed, but it won&apos;t appear in the promote picker until its code is committed as a
        real <code>accelerators/&lt;slug&gt;/</code> folder in git. Dismiss if not useful.
      </p>

      {error ? (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          ⚠ {error}
        </div>
      ) : null}

      <div className="timeline" style={{ marginTop: '1rem' }}>
        {accelerators.map((accelerator) => {
          const files = Array.isArray(accelerator.files) ? (accelerator.files as { path: string; sha256?: string }[]) : [];

          return (
            <div key={accelerator.id} className="timeline-event">
              <div className="timeline-marker" />
              <div className="timeline-content">
                <h2>{accelerator.name}</h2>
                <p>{accelerator.description}</p>
                <p className="small-text" style={{ marginTop: '0.5rem' }}>
                  Files: {files.map((file) => file.path).join(', ')}
                </p>
                <div className="button-grid" style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={busyId === accelerator.id}
                    onClick={() => updateStatus(accelerator.id, 'APPROVED')}
                  >
                    {busyId === accelerator.id ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busyId === accelerator.id}
                    onClick={() => updateStatus(accelerator.id, 'DISMISSED')}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
