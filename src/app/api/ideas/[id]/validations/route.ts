import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { createValidation, listValidations } from '@/src/lib/ideas/validation-service';
import { getIdea } from '@/src/lib/ideas/idea-service';
import { requireActiveOrganization } from '@/src/lib/organizations/organization-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError; const organization = await requireActiveOrganization(); if (!await getIdea(params.id, organization.id)) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  return NextResponse.json(await listValidations(params.id));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError; const organization = await requireActiveOrganization(); if (!await getIdea(params.id, organization.id)) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  try { return NextResponse.json(await createValidation(params.id, await request.json()), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record validation' }, { status: 400 }); }
}
