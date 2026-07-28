import { NextRequest, NextResponse } from 'next/server';
import { getIdea, updateIdeaBuildBrief } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';
import { buildBuildBriefPrompt, generateGeminiText, GeminiConfigError } from '@/src/lib/ai/gemini';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const idea = await getIdea(params.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  try {
    const prompt = buildBuildBriefPrompt({
      title: idea.title,
      rawCapture: idea.rawCapture,
      summary: idea.summary,
      workspace: idea.workspace,
    });

    const text = await generateGeminiText(prompt, 900);

    return NextResponse.json({ text });
  } catch (error) {
    const status = error instanceof GeminiConfigError ? 503 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to generate build brief' },
      { status },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const idea = await updateIdeaBuildBrief(params.id, body);
    return NextResponse.json(idea);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save build brief' },
      { status: 400 },
    );
  }
}
