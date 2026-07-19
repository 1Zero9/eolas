"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CapturePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rawCapture, setRawCapture] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/check').then(async (response) => {
      if (!response.ok) {
        router.replace('/login');
      }
    });
  }, [router]);

  async function handleSubmit() {
    setError(null);
    setSavedId(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rawCapture,
          summary,
          source: 'MOBILE',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to save idea');
      }

      const saved = await response.json().catch(() => null);
      setSavedId(saved?.id ?? null);
      setTitle('');
      setRawCapture('');
      setSummary('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save idea');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>Capture idea</h1>
        <p className="small-text">Quick capture from mobile with a clear path to review.</p>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <label>
            Idea text
            <textarea
              value={rawCapture}
              onChange={(event) => setRawCapture(event.target.value)}
              placeholder="What are you thinking about?"
              rows={6}
              required
            />
          </label>

          <label>
            Optional title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short title"
            />
          </label>

          <label>
            Optional summary
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Add a quick summary"
              rows={3}
            />
          </label>

          {error ? <div className="alert alert-error" role="alert">⚠ {error}</div> : null}
          {savedId ? (
            <div className="alert alert-success" role="status">
              ✓ Idea captured. <Link href={`/ideas/${savedId}`}>Open it</Link> or keep going.
            </div>
          ) : null}

          <button type="submit" disabled={submitting || !rawCapture.trim()}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save idea'
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
