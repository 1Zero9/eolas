const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new GeminiConfigError('GEMINI_API_KEY is not configured.');
  }

  return { apiKey, model };
}

export async function generateGeminiText(prompt: string): Promise<string> {
  const { apiKey, model } = getConfig();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error?.message || `Gemini request failed (${response.status})`;
    throw new GeminiRequestError(message);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') ?? '';

  if (!text.trim()) {
    throw new GeminiRequestError('Gemini returned an empty response.');
  }

  return text.trim();
}

export function buildBrainstormPrompt(idea: {
  title?: string | null;
  rawCapture: string;
  summary?: string | null;
  notes: Array<{ content: string }>;
}) {
  const notesBlock = idea.notes.length
    ? idea.notes.map((note, index) => `${index + 1}. ${note.content}`).join('\n')
    : 'No notes yet.';

  return [
    'You are a sharp, practical product brainstorming partner.',
    'Given the raw idea below, help develop it further.',
    '',
    `Title: ${idea.title || 'Untitled idea'}`,
    `Idea: ${idea.rawCapture}`,
    idea.summary ? `Summary: ${idea.summary}` : '',
    '',
    'Prior notes/iterations:',
    notesBlock,
    '',
    'Respond concisely in this structure:',
    '- Sharper problem statement (1-2 sentences)',
    '- 3-5 concrete feature/capability ideas',
    '- 2-3 open questions or risks to resolve',
    '- Recommended next step',
  ]
    .filter(Boolean)
    .join('\n');
}
