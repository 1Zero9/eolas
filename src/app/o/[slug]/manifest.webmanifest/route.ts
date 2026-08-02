import { getOrganizationBySlug } from '@/src/lib/organizations/organization-service';

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const organization = await getOrganizationBySlug(params.slug);
  if (!organization || !organization.captureEnabled) return new Response('Not found', { status: 404 });
  return Response.json({
    name: `${organization.name} · Eolas Capture`, short_name: organization.name.slice(0, 12),
    description: `Private idea capture for ${organization.name}.`, start_url: `/o/${organization.slug}`,
    scope: `/o/${organization.slug}/`, display: 'standalone', background_color: '#030611', theme_color: '#030611',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
