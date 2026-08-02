'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppNav from '@/src/app/components/app-nav';
import Dock from '@/src/app/components/dock';
import ThemeToggle from '@/src/app/components/theme-toggle';
import WorkspaceSwitcher from '@/src/app/components/workspace-switcher';
export default function AppShell({ children }: { children: React.ReactNode }) { const pathname = usePathname(); const capture = pathname.startsWith('/o/'); if (capture) return <>{children}</>; return <><header className="app-header"><div className="app-header-inner"><Link href="/" className="brand"><img src="/icon-192.png" alt="Eolas logo" />EOLAS <span>Admin</span></Link><WorkspaceSwitcher /><AppNav /><ThemeToggle /></div></header>{children}<Dock /></>; }
