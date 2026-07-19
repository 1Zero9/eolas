"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CapturePage() {
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
      <h1>Capture idea</h1>
      <p>Quick capture from mobile with a clear path to review.</p>

      <form
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

        {error ? <p style={{ color: '#B91C1C' }}>{error}</p> : null}
        {success ? <p style={{ color: '#15803D' }}>Idea saved successfully.</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save idea'}
        </button>
      </form>
    </main>
  );
}
