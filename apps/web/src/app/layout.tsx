import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono, Instrument_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// Self-hosted at build time by next/font, which also generates a fallback with
// matched metrics (size-adjust / ascent-override). That is the CLS fix: the
// external Google stylesheet used display=swap, so every page rendered in a
// fallback face and reflowed when the real font landed ~1.4s in, shifting
// everything below the heading. Same two typefaces, nothing added.
const sans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
// TRIAL, 2026-07-31 — not adopted. Instrument Sans (Rodrigo Fuenzalida for the
// Instrument agency) is the closest free relative to ABC Diatype, which is what
// Creative Boom runs. Wired to --font-display and used ONLY by the hero and nav
// so the two faces can be compared on a live page with real Space Mono beneath
// them, which is the only way this gets decided.
//
// Variable across weight AND width. The width axis is the actual argument: the
// hero clamps 46->104px, and type sized right at 46 is usually a touch wide at
// 104. Space Grotesk cannot do that.
//
// To revert: delete this block, drop --font-display from the html className, and
// remove the two --font-display references in globals.css. Nothing else depends
// on it.
const display = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
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
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
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
