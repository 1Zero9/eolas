'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function JobApproval({ jobId }: { jobId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function approve() { setBusy(true); setError(null); try { const res = await fetch(`/api/jobs/${jobId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approver: 'owner' }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Unable to approve'); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to approve'); } finally { setBusy(false); } }
  return <>{error ? <p className="alert alert-error">{error}</p> : null}<button type="button" onClick={approve} disabled={busy}>{busy ? 'Approving…' : 'Approve job'}</button></>;
}
