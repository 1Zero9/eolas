import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegistration from '@/src/app/components/service-worker-registration';

export const metadata: Metadata = {
  title: 'Eolas',
  description: 'Capture and manage product ideas',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
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
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#0F766E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
