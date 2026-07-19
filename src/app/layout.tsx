import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegistration from '@/src/app/components/service-worker-registration';

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
        {children}
      </body>
    </html>
  );
}
