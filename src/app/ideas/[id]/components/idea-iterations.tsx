'use client';

import { useEffect, useState } from 'react';

export default function IdeaIterations({ ideaId }: { ideaId: string }) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; content: string; createdAt: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch(`/api/ideas/${ideaId}/notes`).then(async (response) => {
      if (!response.ok) {
        setError('Unable to load notes');
        return;
      }
      const payload = await response.json();
      setNotes(payload || []);
    });
  }, [ideaId]);

  async function addNote() {
    if (!note.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to save note');
      }

      const saved = await response.json();
      setNotes((prev) => [saved, ...prev]);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save note');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card surface" style={{ marginTop: '1.5rem' }}>
      <h2>History & iterations</h2>
      <p className="small-text">Log travel thoughts, refinements, and follow-up updates as a timeline.</p>

      <div className="form-grid" style={{ marginTop: '1rem' }}>
        <label>
          Add your next iteration or observation
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            placeholder="Add your next iteration or observation"
            className="mobile-input"
          />
        </label>

        <div className="button-grid">
          <button type="button" onClick={addNote} disabled={saving || !note.trim()}>
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#B91C1C', marginTop: '1rem' }}>{error}</p> : null}

      <div className="timeline" style={{ marginTop: '1.5rem' }}>
        {notes.length === 0 ? (
          <p className="small-text">No iterations yet. Capture your first thought.</p>
        ) : (
          notes.map((noteItem) => (
            <div key={noteItem.id} className="timeline-event">
              <div className="timeline-marker" />
              <div className="timeline-content">
                <p>{noteItem.content}</p>
                <p className="small-text">{new Date(noteItem.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
