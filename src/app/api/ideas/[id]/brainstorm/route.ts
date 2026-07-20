import { NextRequest, NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { listIdeaNotes } from '@/src/lib/ideas/idea-note-service';
import { requireAuth } from '@/src/lib/auth';
import { buildBrainstormPrompt, generateGeminiText, GeminiConfigError } from '@/src/lib/ai/gemini';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  try {
    const notes = await listIdeaNotes(params.id);
    const prompt = buildBrainstormPrompt({
      title: idea.title,
      rawCapture: idea.rawCapture,
      summary: idea.summary,
      notes,
    });

    const text = await generateGeminiText(prompt);

    return NextResponse.json({ text });
  } catch (error) {
    const status = error instanceof GeminiConfigError ? 503 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to brainstorm idea' },
      { status },
    );
  }
}
