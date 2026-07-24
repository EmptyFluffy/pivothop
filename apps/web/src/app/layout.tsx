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
        {/* Favicons come from app/icon.svg (vector, for browser tabs + Google's
            SVG support) and app/favicon.ico (multi-size ICO fallback). Both are
            crawlable file URLs — a data: URI here was uncrawlable for Google. */}
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
