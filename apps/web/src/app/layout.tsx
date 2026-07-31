import type { Metadata } from 'next';
import { Space_Mono, Instrument_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// Self-hosted at build time by next/font, which also generates a fallback with
// matched metrics (size-adjust / ascent-override). That is the CLS fix: the
// external Google stylesheet used display=swap, so every page rendered in a
// fallback face and reflowed when the real font landed ~1.4s in, shifting
// everything below the heading. Same two typefaces, nothing added.
// ADOPTED 2026-07-31, after the trial below ran on the live hero and nav.
// Instrument Sans (Rodrigo Fuenzalida) replaces Space Grotesk as the word face.
// Variable across weight AND width, which is the argument: the hero clamps
// 46->104px, and type sized right at 46 is a touch wide at 104. Space Grotesk
// cannot do that. Still two typefaces — Instrument Sans + Space Mono — so
// non-negotiable #7 holds; only the sans changed.
const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pivothop.com'),
  title: 'PivotHop — Career moves, measured.',
  description:
    'A career-navigation instrument. It reads live job postings and returns the routes your skills can actually reach, with the salary, the skill gap, and the honest odds attached.',
  // og:site_name is one of the signals Google uses for the brand name shown
  // above the result (so it reads "PivotHop", not "pivothop.com").
  openGraph: { type: 'website', siteName: 'PivotHop', url: 'https://www.pivothop.com', locale: 'en_US' },
};

// The other, stronger brand-name signal: WebSite structured data on the home
// page (name -> the site name in Search). Organization carries the brand + logo
// for the knowledge graph; the SearchAction advertises the board's ?q= search.
const SITE_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.pivothop.com/#website',
      url: 'https://www.pivothop.com/',
      name: 'PivotHop',
      publisher: { '@id': 'https://www.pivothop.com/#org' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://www.pivothop.com/jobs?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.pivothop.com/#org',
      name: 'PivotHop',
      url: 'https://www.pivothop.com/',
      logo: { '@type': 'ImageObject', url: 'https://www.pivothop.com/icon.svg' },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Favicons come from app/icon.svg (vector, for browser tabs + Google's
            SVG support) and app/favicon.ico (multi-size ICO fallback). Both are
            crawlable file URLs — a data: URI here was uncrawlable for Google. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_LD) }} />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
