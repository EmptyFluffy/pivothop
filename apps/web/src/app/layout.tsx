import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { PostHogInit } from './components/PostHogInit';
import './globals.css';

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_LD) }} />
      </head>
      <body>{children}<Analytics /><PostHogInit /></body>
    </html>
  );
}
