'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IdeasIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.5 1 2.5h6c0-1 .4-1.9 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function Dock() {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="dock" aria-label="Primary">
      <Link href="/" className={isActive(pathname, '/') ? 'active' : undefined}>
        <HomeIcon />
        Home
      </Link>
      <Link href="/ideas" className={isActive(pathname, '/ideas') ? 'active' : undefined}>
        <IdeasIcon />
        Ideas
      </Link>
      <Link
        href="/capture"
        className={isActive(pathname, '/capture') ? 'dock-fab active' : 'dock-fab'}
        aria-label="Capture idea"
      >
        <PlusIcon />
      </Link>
      <Link href="/projects" className={isActive(pathname, '/projects') ? 'active' : undefined}>
        <ProjectsIcon />
        Projects
      </Link>
      <Link href="/jobs" className={isActive(pathname, '/jobs') ? 'active' : undefined}>
        <JobsIcon />
        Jobs
      </Link>
    </nav>
  );
}
