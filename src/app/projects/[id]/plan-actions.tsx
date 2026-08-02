'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Plan = { id: string; status: string; planHash: string; conflicts: unknown; reuseMetrics: unknown; accelerators: unknown };

export default function AssemblyPlanActions({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metrics = (plan.reuseMetrics ?? {}) as { acceleratorReusePercent?: number; acceleratorLines?: number; totalLines?: number; acceleratorFiles?: number; totalFiles?: number };
  const conflicts = Array.isArray(plan.conflicts) ? plan.conflicts.filter((item): item is string => typeof item === 'string') : [];
  const accelerators = Array.isArray(plan.accelerators) ? plan.accelerators as { name?: string; slug?: string; version?: string }[] : [];
  async function approve() {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/assembly-plans/${plan.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approver: 'owner' }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not approve plan');
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not approve plan'); }
    finally { setBusy(false); }
  }
  return <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
    <div className="meta-row"><span className="status-pill">{plan.status}</span><span className="status-pill">Reuse {metrics.acceleratorReusePercent ?? 0}%</span></div>
    <p className="small-text">{metrics.acceleratorLines ?? 0}/{metrics.totalLines ?? 0} lines and {metrics.acceleratorFiles ?? 0}/{metrics.totalFiles ?? 0} files come from tested accelerator snapshots.</p>
    <p className="small-text">Accelerators: {accelerators.length ? accelerators.map((item) => `${item.name ?? item.slug} v${item.version}`).join(', ') : 'None selected'}</p>
    <p className="small-text">Immutable plan hash: <code>{plan.planHash}</code></p>
    {conflicts.length ? <p className="alert alert-error">Resolve: {conflicts.join('; ')}</p> : null}
    {plan.status === 'DRAFT' && !conflicts.length ? <button type="button" onClick={approve} disabled={busy}>{busy ? 'Approving…' : 'Approve exact plan and queue build'}</button> : null}
    {error ? <p className="alert alert-error">{error}</p> : null}
  </div>;
}
