'use client';

import { useState } from 'react';

const BUILD_BRIEF_MAX_LENGTH = 20000;

export default function IdeaBuildBrief({
  ideaId,
  initialBuildBrief,
}: {
  ideaId: string;
  initialBuildBrief: string | null;
}) {
  const [content, setContent] = useState(initialBuildBrief || '');
  const [savedContent, setSavedContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = content !== savedContent;

  async function saveBuildBrief(nextContent: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/build-brief`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildBrief: nextContent }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to save build brief');
      }

      setSavedContent(nextContent);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save build brief');
    } finally {
      setSaving(false);
    }
  }

  async function generateWithAI() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/build-brief`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to generate build brief');
      }

      const next = (payload.text || '').slice(0, BUILD_BRIEF_MAX_LENGTH);
      setContent(next);
      void saveBuildBrief(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate build brief');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="card surface" style={{ marginTop: '1.5rem' }}>
      <h2>Build brief</h2>
      <p className="small-text">
        A structured spec — problem, users, core features, tech approach — handed to whatever builds this idea next.
        Included as <code>docs/build-brief.md</code> when you promote to a project.
      </p>

      <div className="form-grid" style={{ marginTop: '1rem' }}>
        <label>
          Brief
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, BUILD_BRIEF_MAX_LENGTH))}
            rows={16}
            placeholder="Generate a brief with AI, or write your own here…"
            className="mobile-input"
          />
          <span className="small-text" style={{ textAlign: 'right' }}>
            {content.length} / {BUILD_BRIEF_MAX_LENGTH}
          </span>
        </label>

        <div className="button-grid">
          <button type="button" onClick={() => saveBuildBrief(content)} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : isDirty ? 'Save build brief' : savedAt ? 'Saved' : 'Save build brief'}
          </button>
          <button type="button" className="button-secondary" onClick={generateWithAI} disabled={generating}>
            {generating ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Generating…
              </>
            ) : content ? (
              '✨ Regenerate with AI'
            ) : (
              '✨ Generate with AI'
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          ⚠ {error}
        </div>
      ) : null}
    </section>
  );
}
