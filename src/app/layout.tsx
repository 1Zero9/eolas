import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import ServiceWorkerRegistration from '@/src/app/components/service-worker-registration';
import AppNav from '@/src/app/components/app-nav';
import Dock from '@/src/app/components/dock';

export const metadata: Metadata = {
  title: 'Eolas',
  description: 'Capture and manage product ideas',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#14532D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="brand">
              <img src="/icon-192.png" alt="Eolas logo" />
              EOLAS
            </Link>
            <AppNav />
          </div>
        </header>
        {children}
        <Dock />
      </body>
    </html>
  );
}
