'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const primaryLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/accelerators', label: 'Library' },
];

const groups = [
  { label: 'Delivery', links: [{ href: '/projects', label: 'Projects' }, { href: '/jobs', label: 'Jobs & approvals' }] },
  { label: 'Workspace', links: [{ href: '/organizations', label: 'Workspaces & capture' }] },
];

function isActive(pathname: string, href: string) { return href === '/' ? pathname === '/' : pathname.startsWith(href); }

export default function AppNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/login')) return null;

  return <nav className="app-nav" aria-label="Admin navigation">
    <div className="app-nav-primary">{primaryLinks.map((link) => <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? 'active' : undefined}>{link.label}</Link>)}</div>
    <div className="app-nav-groups">{groups.map((group) => {
      const active = group.links.some((link) => isActive(pathname, link.href));
      return <details key={group.label} name="app-nav-group" className={`app-nav-group${active ? ' active' : ''}`}>
        <summary>{group.label}<span aria-hidden="true">⌄</span></summary>
        <div className="app-nav-menu">{group.links.map((link) => <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? 'active' : undefined}>{link.label}</Link>)}</div>
      </details>;
    })}</div>
  </nav>;
}
