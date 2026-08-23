import type { Metadata } from 'next';

/* The instrument's page is a client component (the graph mounts imperatively),
   so its metadata lives here: a tool-query title, not the brand hero — the
   whole point of giving the tool its own URL (free-tools SEO playbook). */
export const metadata: Metadata = {
  title: 'Career Change Instrument: map the careers your skills already reach',
  description:
    'Enter your role and skills; the instrument reads live job postings and returns every adjacent career you can actually reach — match percentage, salary band, skill gap, and the honest odds. Free, no account.',
  alternates: { canonical: '/instrument' },
};

export default function InstrumentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
