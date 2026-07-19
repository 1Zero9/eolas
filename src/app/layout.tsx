import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eolas',
  description: 'Capture and manage product ideas',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0F766E" />
      </head>
      <body>{children}</body>
    </html>
  );
}
