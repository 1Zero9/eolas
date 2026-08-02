'use client';

import { useCallback, useEffect, useState } from 'react';
import InstallPrompt from '@/src/app/components/install-prompt';
import ThemeToggle from '@/src/app/components/theme-toggle';

type QueuedIdea = { title: string; rawCapture: string; queuedAt: string };

function queueKey(slug: string) { return `eolas-offline-captures:${slug}`; }

function readQueue(slug: string): QueuedIdea[] {
  try { return JSON.parse(localStorage.getItem(queueKey(slug)) || '[]'); } catch { return []; }
}

function writeQueue(slug: string, items: QueuedIdea[]) {
  localStorage.setItem(queueKey(slug), JSON.stringify(items));
}

export default function OrganizationCapture({ organization, initiallyUnlocked }: { organization: { name: string; slug: string }; initiallyUnlocked: boolean }) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [passcode, setPasscode] = useState('');
  const [idea, setIdea] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const flushQueue = useCallback(async () => {
    const queued = readQueue(organization.slug);
    if (!queued.length || !navigator.onLine) return;
    const remaining: QueuedIdea[] = [];
    for (const item of queued) {
      try {
        const response = await fetch(`/api/capture/${organization.slug}/ideas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
        if (!response.ok) remaining.push(item);
      } catch { remaining.push(item); }
    }
    writeQueue(organization.slug, remaining);
    setQueuedCount(remaining.length);
    if (!remaining.length && queued.length) setSaved(true);
  }, [organization.slug]);

  useEffect(() => {
    setQueuedCount(readQueue(organization.slug).length);
    void flushQueue();
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [flushQueue, organization.slug]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/capture/${organization.slug}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not unlock capture');
      setUnlocked(true); setPasscode(''); void flushQueue();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not unlock capture'); }
    finally { setBusy(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setSaved(false);
    const capture = { title: title.trim(), rawCapture: idea.trim() };
    try {
      if (!navigator.onLine) throw new TypeError('offline');
      const res = await fetch(`/api/capture/${organization.slug}/ideas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(capture) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save idea');
      setIdea(''); setTitle(''); setSaved(true);
    } catch (cause) {
      if (cause instanceof TypeError) {
        const items = [...readQueue(organization.slug), { ...capture, queuedAt: new Date().toISOString() }];
        writeQueue(organization.slug, items); setQueuedCount(items.length); setIdea(''); setTitle(''); setSaved(true);
      } else setError(cause instanceof Error ? cause.message : 'Could not save idea');
    } finally { setBusy(false); }
  }

  return <main className="capture-shell"><section className="capture-card"><div className="capture-topline"><span className="capture-kicker">{organization.name}</span><ThemeToggle /></div><h1>Capture an idea</h1><p>Share the thought while it is fresh. Your team can review and develop it later.</p>{!unlocked ? <form className="form-grid" onSubmit={unlock}><label>Organization passcode<input type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} autoFocus /></label><button disabled={busy || !passcode}>{busy ? 'Checking…' : 'Continue'}</button></form> : <form className="form-grid" onSubmit={save}><label>Your idea<textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="What should we know?" rows={7} required autoFocus /></label><label>Optional title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A short name for it" /></label><button disabled={busy || !idea.trim()}>{busy ? 'Saving…' : 'Save idea'}</button></form>}{error ? <p className="alert alert-error">{error}</p> : null}{saved ? <p className="alert alert-success">✓ {queuedCount ? 'Saved on this device and will send when you are online.' : 'Saved. Capture another whenever you are ready.'}</p> : null}{queuedCount ? <p className="small-text">{queuedCount} capture{queuedCount === 1 ? '' : 's'} saved locally and waiting for a connection.</p> : null}<InstallPrompt /></section></main>;
}
