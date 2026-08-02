import { NextRequest, NextResponse } from 'next/server';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { prisma } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/auth';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const organization = await requireActiveOrganization();

  const idea = await getIdea(params.id, organization.id);

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const analysis = await prisma.ideaAnalysis.create({
    data: {
      ideaId: idea.id,
      status: 'COMPLETED',
      generatedTitle: idea.title ?? 'Idea analysis',
      generatedSummary: `Structured analysis for: ${idea.rawCapture}`,
      problemStatement: 'Problem statement pending deeper review.',
      intendedUsers: ['Early adopters'],
      categories: ['productivity'],
      suggestedCapabilities: ['capture', 'review'],
      clarificationQuestions: ['What is the primary user need?'],
      recommendedNextAction: 'Promote to project once approved.',
      confidence: 0.76,
      rawResponse: {
        source: 'local-stub',
        note: 'Initial analysis stub for V0.1',
      },
    },
  });

  await prisma.idea.update({
    where: { id: idea.id },
    data: { status: 'ASSESSED' },
  });

  return NextResponse.json(analysis, { status: 201 });
}
