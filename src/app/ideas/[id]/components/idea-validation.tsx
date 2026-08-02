'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Validation = { id: string; decision: string; problemClarity: number; evidenceStrength: number; effortEstimate: number; riskiestAssumption: string; smallestTest: string; decisionRationale: string; evidenceLinks: unknown; createdAt: Date };
const initial = { decision: 'VALIDATE', problemClarity: 3, evidenceStrength: 1, effortEstimate: 3, riskiestAssumption: '', smallestTest: '', decisionRationale: '', evidenceLinks: '' };

export default function IdeaValidation({ ideaId, validations }: { ideaId: string; validations: Validation[] }) {
  const router = useRouter(); const [form, setForm] = useState(initial); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  function update(field: keyof typeof initial, value: string | number) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit() {
    setSaving(true); setError(null);
    try {
      const evidenceLinks = form.evidenceLinks.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
      const response = await fetch(`/api/ideas/${ideaId}/validations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, evidenceLinks, createdBy: 'owner' }) });
      const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || 'Unable to record decision');
      setForm(initial); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to record decision'); } finally { setSaving(false); }
  }
  return <section className="card surface" style={{ marginTop: '1.5rem' }}>
    <h2>Validation gate</h2><p className="small-text">Record the evidence, riskiest assumption, smallest test, and a deliberate decision. Entries are appended as decision history.</p>
    <div className="form-grid" style={{ marginTop: '1rem' }}>
      <label>Decision <select value={form.decision} onChange={(event) => update('decision', event.target.value)}><option value="VALIDATE">Validate first</option><option value="BUILD">Ready to build</option><option value="PARK">Park</option><option value="REJECT">Reject</option></select></label>
      <div className="button-grid">
        {(['problemClarity', 'evidenceStrength', 'effortEstimate'] as const).map((field) => <label key={field}>{field === 'problemClarity' ? 'Problem clarity' : field === 'evidenceStrength' ? 'Evidence strength' : 'Effort (5 = highest)'} <select value={form[field]} onChange={(event) => update(field, Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>)}
      </div>
      <label>Riskiest assumption<textarea value={form.riskiestAssumption} onChange={(event) => update('riskiestAssumption', event.target.value)} rows={3} /></label>
      <label>Smallest useful test<textarea value={form.smallestTest} onChange={(event) => update('smallestTest', event.target.value)} rows={3} /></label>
      <label>Decision rationale<textarea value={form.decisionRationale} onChange={(event) => update('decisionRationale', event.target.value)} rows={3} /></label>
      <label>Evidence links (optional; one per line)<textarea value={form.evidenceLinks} onChange={(event) => update('evidenceLinks', event.target.value)} rows={2} /></label>
      <button type="button" onClick={submit} disabled={saving}>{saving ? 'Recording…' : 'Record validation decision'}</button>
    </div>
    {error ? <p className="alert alert-error">{error}</p> : null}
    {validations.length ? <div style={{ marginTop: '1.5rem' }}>{validations.map((item) => <div key={item.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}><div className="meta-row"><span className="status-pill">{item.decision}</span><span className="small-text">{new Date(item.createdAt).toLocaleString()}</span></div><p className="small-text">Clarity {item.problemClarity}/5 · Evidence {item.evidenceStrength}/5 · Effort {item.effortEstimate}/5</p><p><strong>Risk:</strong> {item.riskiestAssumption}</p><p><strong>Test:</strong> {item.smallestTest}</p><p><strong>Why:</strong> {item.decisionRationale}</p></div>)}</div> : null}
  </section>;
}
