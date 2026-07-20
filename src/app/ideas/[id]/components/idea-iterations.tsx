'use client';

import { useMemo, useRef, useState } from 'react';

const WORKSPACE_MAX_LENGTH = 20000;
const SUGGESTION_MAX_LENGTH = 4000;

type LegacyNote = { content: string };

function seedFromLegacyNotes(notes: LegacyNote[]) {
  if (!notes.length) return '';
  const chronological = [...notes].reverse();
  return chronological
    .map((note) => note.content.replace(/^🤖 AI brainstorm\n\n/, '').trim())
    .filter(Boolean)
    .join('\n\n');
}

export default function IdeaWorkspace({
  ideaId,
  initialWorkspace,
  initialNotes,
}: {
  ideaId: string;
  initialWorkspace: string | null;
  initialNotes: LegacyNote[];
}) {
  const [content, setContent] = useState(
    () => initialWorkspace || seedFromLegacyNotes(initialNotes),
  );
  const [savedContent, setSavedContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [brainstorming, setBrainstorming] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const isDirty = content !== savedContent;

  async function saveWorkspace(nextContent: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/workspace`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: nextContent }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to save workspace');
      }

      setSavedContent(nextContent);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workspace');
    } finally {
      setSaving(false);
    }
  }

  async function brainstormWithAI() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBrainstorming(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/brainstorm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: content }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to brainstorm idea');
      }

      setSuggestion((payload.text || '').slice(0, SUGGESTION_MAX_LENGTH));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to brainstorm idea');
    } finally {
      setBrainstorming(false);
      busyRef.current = false;
    }
  }

  function insertSuggestion() {
    if (!suggestion || !suggestion.trim()) return;
    const merged = (content ? `${content}\n\n${suggestion.trim()}` : suggestion.trim()).slice(
      0,
      WORKSPACE_MAX_LENGTH,
    );
    setContent(merged);
    setSuggestion(null);
    void saveWorkspace(merged);
  }

  const savedLabel = useMemo(() => {
    if (!savedAt) return null;
    return 'Saved';
  }, [savedAt]);

  return (
    <section className="card surface" style={{ marginTop: '1.5rem' }}>
      <h2>Idea workspace</h2>
      <p className="small-text">
        The incubator for this idea — capture, explore and refine your thinking here before it moves anywhere.
      </p>

      <div className="form-grid" style={{ marginTop: '1rem' }}>
        <label>
          Working notes
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, WORKSPACE_MAX_LENGTH))}
            rows={14}
            placeholder="Explore the idea here — problem framing, features, risks, next steps…"
            className="mobile-input"
          />
          <span className="small-text" style={{ textAlign: 'right' }}>
            {content.length} / {WORKSPACE_MAX_LENGTH}
          </span>
        </label>

        <div className="button-grid">
          <button type="button" onClick={() => saveWorkspace(content)} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : isDirty ? 'Save workspace' : savedLabel || 'Save workspace'}
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

      {suggestion !== null ? (
        <div className="card note-ai" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <div className="note-header">
            <span className="status-pill">✨ AI suggestion — review before adding</span>
          </div>
          <textarea
            value={suggestion}
            onChange={(event) => setSuggestion(event.target.value.slice(0, SUGGESTION_MAX_LENGTH))}
            rows={6}
            className="mobile-input"
            style={{ marginTop: '0.75rem' }}
          />
          <div className="button-grid" style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={insertSuggestion} disabled={!suggestion.trim() || saving}>
              Add to workspace
            </button>
            <button type="button" className="button-secondary" onClick={() => setSuggestion(null)}>
              Discard
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
