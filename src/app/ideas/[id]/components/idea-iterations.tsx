'use client';

import { useEffect, useState } from 'react';

const AI_NOTE_PREFIX = '🤖 AI brainstorm\n\n';
const NOTE_MAX_LENGTH = 8000;

type Note = { id: string; content: string; createdAt: string };

export default function IdeaIterations({ ideaId }: { ideaId: string }) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [brainstorming, setBrainstorming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

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

  async function brainstormWithAI() {
    setBrainstorming(true);
    setError(null);
    setDraft(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/brainstorm`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to brainstorm idea');
      }

      setDraft(payload.text || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to brainstorm idea');
    } finally {
      setBrainstorming(false);
    }
  }

  async function saveDraftAsNote() {
    if (!draft || !draft.trim()) return;

    setSavingDraft(true);
    setError(null);

    try {
      const content = `${AI_NOTE_PREFIX}${draft}`.slice(0, NOTE_MAX_LENGTH);
      const response = await fetch(`/api/ideas/${ideaId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to save note');
      }

      const saved = await response.json();
      setNotes((prev) => [saved, ...prev]);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save note');
    } finally {
      setSavingDraft(false);
    }
  }

  async function deleteNote(noteId: string) {
    setDeletingId(noteId);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/notes/${noteId}`, { method: 'DELETE' });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to delete note');
      }

      setNotes((prev) => prev.filter((item) => item.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete note');
    } finally {
      setDeletingId(null);
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
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
            rows={5}
            placeholder="Add your next iteration or observation"
            className="mobile-input"
          />
          <span className="small-text" style={{ textAlign: 'right' }}>
            {note.length} / {NOTE_MAX_LENGTH}
          </span>
        </label>

        <div className="button-grid">
          <button type="button" onClick={addNote} disabled={saving || !note.trim()}>
            {saving ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Add note'
            )}
          </button>
          <button type="button" className="button-secondary" onClick={brainstormWithAI} disabled={brainstorming}>
            {brainstorming ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Thinking…
              </>
            ) : (
              '✨ Brainstorm with AI'
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          ⚠ {error}
        </div>
      ) : null}

      {draft !== null ? (
        <div className="card note-ai" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <div className="note-header">
            <span className="status-pill">✨ AI brainstorm — review before saving</span>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, NOTE_MAX_LENGTH))}
            rows={12}
            className="mobile-input"
            style={{ marginTop: '0.75rem' }}
          />
          <span className="small-text" style={{ display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>
            {draft.length} / {NOTE_MAX_LENGTH}
          </span>
          <div className="button-grid" style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={saveDraftAsNote} disabled={savingDraft || !draft.trim()}>
              {savingDraft ? 'Saving…' : 'Add as note'}
            </button>
            <button type="button" className="button-secondary" onClick={() => setDraft(null)}>
              Discard
            </button>
          </div>
        </div>
      ) : null}

      <div className="timeline" style={{ marginTop: '1.5rem' }}>
        {notes.length === 0 ? (
          <p className="small-text">No iterations yet. Capture your first thought.</p>
        ) : (
          notes.map((noteItem) => {
            const isAi = noteItem.content.startsWith(AI_NOTE_PREFIX.trim());
            const content = isAi
              ? noteItem.content.slice(AI_NOTE_PREFIX.trim().length).trim()
              : noteItem.content;

            return (
              <div key={noteItem.id} className="timeline-event">
                <div className="timeline-marker" />
                <div className={`timeline-content${isAi ? ' note-ai' : ''}`}>
                  <div className="note-header">
                    {isAi ? <span className="status-pill">✨ AI brainstorm</span> : <span />}
                    <button
                      type="button"
                      className="note-delete"
                      onClick={() => deleteNote(noteItem.id)}
                      disabled={deletingId === noteItem.id}
                    >
                      {deletingId === noteItem.id ? 'Removing…' : 'Delete'}
                    </button>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
                  <p className="small-text">{new Date(noteItem.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
