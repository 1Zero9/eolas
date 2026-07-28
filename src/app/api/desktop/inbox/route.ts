import { NextRequest, NextResponse } from 'next/server';
import { listIdeas } from '@/src/lib/ideas/idea-service';
import { requireDesktopSecret } from '@/src/lib/desktop-auth';

export async function GET(request: NextRequest) {
  const authError = requireDesktopSecret(request);
  if (authError) return authError;

  const ideas = await listIdeas();

  const summary = ideas.slice(0, 25).map((idea) => ({
    id: idea.id,
    title: idea.title,
    rawCapture: idea.rawCapture,
    status: idea.status,
    source: idea.source,
    createdAt: idea.createdAt,
  }));

  return NextResponse.json({ ideas: summary });
}
