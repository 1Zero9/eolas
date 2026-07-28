import { NextRequest, NextResponse } from 'next/server';
import { listIdeas } from '@/src/lib/ideas/idea-service';
import { listRecentAccelerators } from '@/src/lib/accelerators/accelerator-service';
import { requireDesktopSecret } from '@/src/lib/desktop-auth';

export async function GET(request: NextRequest) {
  const authError = requireDesktopSecret(request);
  if (authError) return authError;

  const [ideas, accelerators] = await Promise.all([listIdeas(), listRecentAccelerators(25)]);

  const ideaSummary = ideas.slice(0, 25).map((idea) => ({
    id: idea.id,
    title: idea.title,
    rawCapture: idea.rawCapture,
    status: idea.status,
    source: idea.source,
    createdAt: idea.createdAt,
  }));

  const acceleratorSummary = accelerators.map((accelerator) => ({
    id: accelerator.id,
    name: accelerator.name,
    description: accelerator.description,
    category: accelerator.category,
    status: accelerator.status,
    createdAt: accelerator.createdAt,
  }));

  return NextResponse.json({ ideas: ideaSummary, accelerators: acceleratorSummary });
}
