'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/src/app/components/modal';

type IdeaSummary = { id: string; title: string | null; rawCapture: string };

export default function IdeaControls({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [otherIdeas, setOtherIdeas] = useState<IdeaSummary[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/ideas').then(async (response) => {
      if (!response.ok) return;
      const payload: IdeaSummary[] = await response.json();
      setOtherIdeas(payload.filter((idea) => idea.id !== ideaId));
    });
  }, [ideaId]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to delete idea');
      }
      router.push('/ideas');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete idea');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleMerge() {
    if (!mergeTargetId) return;
    setMerging(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: mergeTargetId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to merge ideas');
      }
      setConfirmMerge(false);
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to merge ideas');
    } finally {
      setMerging(false);
    }
  }

  const mergeTarget = otherIdeas.find((idea) => idea.id === mergeTargetId);

  return (
    <section className="card surface" style={{ marginTop: '1.5rem' }}>
      <h2>Idea controls</h2>
      <p className="small-text">Clean up your inbox or fold duplicate ideas together.</p>

      {error ? (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          ⚠ {error}
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          Merge another idea into this one
          <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
            <option value="">Select an idea…</option>
            {otherIdeas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title || idea.rawCapture.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>

        <div className="button-grid">
          <button
            type="button"
            className="button-secondary"
            disabled={!mergeTargetId}
            onClick={() => setConfirmMerge(true)}
          >
            Merge with…
          </button>
          <button type="button" className="button-danger" onClick={() => setConfirmDelete(true)}>
            Delete idea
          </button>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2>Delete this idea?</h2>
        <p>This removes the idea and all of its notes. This can't be undone.</p>
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
          <button type="button" className="button-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Modal open={confirmMerge} onClose={() => setConfirmMerge(false)}>
        <h2>Merge idea?</h2>
        <p>
          "{mergeTarget?.title || mergeTarget?.rawCapture.slice(0, 60)}" will be merged into this idea and
          removed. Its notes will move over.
        </p>
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={() => setConfirmMerge(false)}>
            Cancel
          </button>
          <button type="button" onClick={handleMerge} disabled={merging}>
            {merging ? 'Merging…' : 'Merge'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
