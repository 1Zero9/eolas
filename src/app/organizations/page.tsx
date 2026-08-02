import { redirect } from 'next/navigation';
import { isAuthenticatedRoute } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { getActiveOrganization } from '@/src/lib/organizations/organization-service';
import OrganizationManager from '@/src/app/organizations/organization-manager';
export const dynamic = 'force-dynamic';
export default async function OrganizationsPage() { if (!(await isAuthenticatedRoute())) redirect('/login'); const [organizations, active] = await Promise.all([prisma.organization.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, slug: true, captureEnabled: true } }), getActiveOrganization()]); return <main><section className="card surface hero-card"><h1>Workspaces</h1><p className="small-text">Each workspace keeps captured ideas, decisions, projects, and jobs separate. Give people the capture URL and passcode, not the admin password.</p></section><OrganizationManager initialOrganizations={organizations} activeId={active?.id ?? null} /></main>; }
