import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eolas project',
  description: 'Built from an approved Eolas assembly plan.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
