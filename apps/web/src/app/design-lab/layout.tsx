import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './v2.css';

/* The V2 design lab (docs/redesign-v2). Never production: even a mistaken
   merge cannot expose it, because the layout 404s on the production
   environment. Previews additionally carry Vercel's X-Robots-Tag noindex. */

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--v2-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--v2-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'PivotHop · V2 design lab',
  robots: { index: false, follow: false },
};

export default function DesignLabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <div className={`v2 ${sans.variable} ${mono.variable}`}>{children}</div>;
}
