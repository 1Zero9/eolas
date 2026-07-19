"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
  }

  return (
    <main>
      <section className="card surface hero-card">
        <h1>Sign in</h1>
        <p className="small-text">Access your Eolas workspace securely.</p>
      </section>

      <section className="card surface" style={{ marginTop: '1.5rem' }}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>
          {error ? <p style={{ color: '#B91C1C' }}>{error}</p> : null}
          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}
