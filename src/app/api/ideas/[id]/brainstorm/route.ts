import { NextRequest, NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { listIdeaNotes } from '@/src/lib/ideas/idea-note-service';
import { prisma } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import { buildBrainstormPrompt, generateGeminiText, GeminiConfigError } from '@/src/lib/ai/gemini';

const AI_NOTE_PREFIX = '🤖 AI brainstorm\n\n';

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

    const note = await prisma.ideaNote.create({
      data: {
        ideaId: params.id,
        content: `${AI_NOTE_PREFIX}${text}`,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const status = error instanceof GeminiConfigError ? 503 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to brainstorm idea' },
      { status },
    );
  }
}
