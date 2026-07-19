'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileCapturePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rawCapture, setRawCapture] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
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

      setSuccess(true);
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
      <section className="card surface">
        <h1>Mobile capture</h1>
        <p className="small-text">Quickly log ideas, iterations, and travel thoughts while you're on the go.</p>
      </section>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <label>
          Idea text
          <textarea
            value={rawCapture}
            onChange={(event) => setRawCapture(event.target.value)}
            placeholder="What are you thinking about?"
            rows={6}
            required
            className="mobile-input"
          />
        </label>

        <label>
          Optional title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short title"
            className="mobile-input"
          />
        </label>

        <label>
          Optional summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Add a quick summary"
            rows={4}
            className="mobile-input"
          />
        </label>

        {error ? <p style={{ color: '#fda4af' }}>{error}</p> : null}
        {success ? <p style={{ color: '#86efac' }}>Idea saved successfully.</p> : null}

        <button type="button" onClick={handleSubmit} disabled={submitting || !rawCapture.trim()}>
          {submitting ? 'Saving…' : 'Save idea'}
        </button>
      </section>
    </main>
  );
}
