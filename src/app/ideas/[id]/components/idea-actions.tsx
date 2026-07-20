'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Analysis = {
  generatedTitle: string | null;
  generatedSummary: string | null;
  recommendedNextAction: string | null;
};

export default function IdeaActions({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [analysing, setAnalysing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [promoted, setPromoted] = useState(false);

  async function handleAnalyse() {
    setAnalysing(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/analyse`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to analyse idea');
      }

      setAnalysis(payload);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyse idea');
    } finally {
      setAnalysing(false);
    }
  }

  async function handlePromote() {
    setPromoting(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}/promote`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to promote idea');
      }

      setPromoted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to promote idea');
    } finally {
      setPromoting(false);
    }
  }

  return (
    <>
      <div className="button-grid" style={{ marginTop: '1.5rem' }}>
        <button type="button" onClick={handleAnalyse} disabled={analysing}>
          {analysing ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Analysing…
            </>
          ) : (
            'Analyse idea'
          )}
        </button>
        <button type="button" className="button-secondary" onClick={handlePromote} disabled={promoting}>
          {promoting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Promoting…
            </>
          ) : (
            'Promote to project'
          )}
        </button>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          ⚠ {error}
        </div>
      ) : null}

      {analysis ? (
        <div className="alert alert-success" role="status" style={{ marginTop: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong>✓ {analysis.generatedTitle || 'Analysis complete'}</strong>
          {analysis.generatedSummary ? <p style={{ margin: '0.4rem 0 0' }}>{analysis.generatedSummary}</p> : null}
          {analysis.recommendedNextAction ? (
            <p className="small-text" style={{ margin: '0.4rem 0 0' }}>
              Next: {analysis.recommendedNextAction}
            </p>
          ) : null}
        </div>
      ) : null}

      {promoted ? (
        <div className="alert alert-success" role="status" style={{ marginTop: '1rem' }}>
          ✓ Promoted to project. A build job has been queued for your worker.
        </div>
      ) : null}
    </>
  );
}
