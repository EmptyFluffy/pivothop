import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pivothop.com'),
  title: 'PivotHop — Career moves, measured.',
  description:
    'A career-navigation instrument. It reads live job postings and returns the routes your skills can actually reach, with the salary, the skill gap, and the honest odds attached.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href={
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -12 139 124"><g fill="%23002FA6"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z"/><path fill-rule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z"/><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z"/><circle cx="10" cy="89.5" r="10"/></g></svg>'
          }
        />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
