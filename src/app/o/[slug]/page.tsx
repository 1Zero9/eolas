import { notFound } from 'next/navigation';
import { getOrganizationBySlug } from '@/src/lib/organizations/organization-service';
import { hasCaptureSession, CAPTURE_SESSION_COOKIE } from '@/src/lib/organizations/organization-service';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import OrganizationCapture from '@/src/app/o/[slug]/organization-capture';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const organization = await getOrganizationBySlug(params.slug);
  return { title: organization ? `${organization.name} · Eolas Capture` : 'Eolas Capture', manifest: `/o/${params.slug}/manifest.webmanifest` };
}

export default async function OrganizationCapturePage({ params }: { params: { slug: string } }) {
  const organization = await getOrganizationBySlug(params.slug);
  if (!organization || !organization.captureEnabled) notFound();
  const store = await cookies();
  return <OrganizationCapture organization={{ name: organization.name, slug: organization.slug }} initiallyUnlocked={hasCaptureSession(store.get(CAPTURE_SESSION_COOKIE)?.value, organization.id, organization.captureSessionVersion)} />;
}
