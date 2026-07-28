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

export async function generateGeminiText(prompt: string, maxOutputTokens = 400): Promise<string> {
  const { apiKey, model } = getConfig();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.7 },
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
