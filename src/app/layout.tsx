import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eolas',
  description: 'Capture and manage product ideas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
