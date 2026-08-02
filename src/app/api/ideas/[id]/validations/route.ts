import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';
import { createValidation, listValidations } from '@/src/lib/ideas/validation-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError;
  return NextResponse.json(await listValidations(params.id));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request); if (authError) return authError;
  try { return NextResponse.json(await createValidation(params.id, await request.json()), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record validation' }, { status: 400 }); }
}
