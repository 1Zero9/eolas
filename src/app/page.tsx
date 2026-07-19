import Link from 'next/link';

export default function HomePage() {
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
      </div>
    </main>
  );
}
