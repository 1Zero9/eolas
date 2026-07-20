import { NextRequest, NextResponse } from 'next/server';
import { mergeIdeas } from '@/src/lib/ideas/idea-service';
import { requireAuth } from '@/src/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const sourceId = typeof body?.sourceId === 'string' ? body.sourceId : '';

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
    }

    const merged = await mergeIdeas(params.id, sourceId);
    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to merge ideas' },
      { status: 400 },
    );
  }
}
