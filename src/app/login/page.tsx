"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Invalid password');
        return;
      }

      router.push('/');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: '26rem', paddingTop: '4rem' }}>
      <section className="card surface" style={{ textAlign: 'center' }}>
        <img
          src="/icon-192.png"
          alt="Eolas logo"
          width={72}
          height={72}
          style={{ margin: '0 auto 0.75rem', display: 'block' }}
        />
        <h1 style={{ letterSpacing: '0.2em' }}>EOLAS</h1>
        <p className="small-text" style={{ marginTop: '0.5rem' }}>
          Ideas · Iteration · Acceleration
        </p>
        <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: '1.5rem', textAlign: 'left' }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoFocus
            />
          </label>
          {error ? <div className="alert alert-error" role="alert">⚠ {error}</div> : null}
          <button type="submit" disabled={submitting || !password}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
