'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/projects', label: 'Projects' },
  { href: '/jobs', label: 'Jobs' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function AppNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="app-nav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={isActive(pathname, link.href) ? 'active' : undefined}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/capture"
        className={pathname.startsWith('/capture') ? 'nav-cta active' : 'nav-cta'}
      >
        + Capture
      </Link>
    </nav>
  );
}
