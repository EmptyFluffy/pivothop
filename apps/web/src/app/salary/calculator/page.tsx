import type { Metadata } from 'next';
import Link from 'next/link';
import './calc.css';
import { PageShell } from '../../components/SiteChrome';
import { CalcClient } from './CalcClient';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';

/* The remote salary calculator — FairElephant, renamed and moved into the
   salary silo (research 2026-08-22: "remote salary calculator" is the winnable
   gap phrase; the /salary/[occ] pages become its internal-link mesh; the
   converter/PPP queries are captured on this page as sections, not doorways).
   /fairelephant 301s here. The deadpan H1 survives the rename. */

export const metadata: Metadata = {
  title: 'Remote Salary Calculator: fair pay by occupation and country',
  description:
    'What a remote role should pay, computed: live postings, BLS OEWS wage statistics, and World Bank purchasing power, across 158 occupations and 60+ countries. Test an offer, no sign-up.',
  alternates: { canonical: '/salary/calculator' },
};

const FAQ = [
  { q: 'How does the remote salary calculator work?', a: 'Pick your occupation, the country you live in, and the country the employer hires from. The calculator reads live postings with stated pay, anchors them to official BLS OEWS wage percentiles, and converts between countries with World Bank ICP purchasing-power data. It returns the remote market median, the local market rate, the purchasing-power par, and a fairness score for any number you test. No sign-up.' },
  { q: 'Is this a salary converter between countries?', a: 'Yes, that is one of the lenses. The purchasing-power par converts a salary between two countries at what money actually buys (World Bank ICP price levels), not at the exchange rate. Unlike a plain PPP calculator it is occupation-aware: the conversion starts from real posted pay for your occupation, not from a generic country ratio.' },
  { q: 'What is a PPP salary calculation?', a: 'Purchasing-power parity adjusts pay for what it buys locally. A salary of $60,000 in a country with a price level of 0.5 buys what $120,000 buys in the United States. The calculator uses the World Bank ICP price-level index and states the round it comes from.' },
  { q: 'Where does the salary data come from?', a: 'Three named sources: live job postings with stated pay (refreshed nightly, sample sizes shown per number), US BLS OEWS occupational wage percentiles, and World Bank ICP price levels. Every figure on the page carries its source; nothing is self-reported or estimated without saying so.' },
  { q: 'Should a remote salary be adjusted for where I live?', a: 'That is a negotiation position, not a law of nature, and the calculator shows every reading honestly: the remote market median (location-blind), the local market rate, the purchasing-power par, and the midpoint employers and candidates often land between. The spread between the lenses is the negotiation range.' },
];

export default function SalaryCalculator() {
  return (
    <PageShell v2 active="salaries">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Salaries', href: '/salary' }, { label: 'Calculator' }]} />
        <PageHead kicker={<>Remote salary calculator</>} title={<>Fair pay, computed.</>} lede={<>What a remote role should pay, read four ways: live postings, official wage statistics, and World Bank
          purchasing power, across 158 occupations. Test an offer against the measured bands. No sign-up, and the
          method is on the page.</>} />
      </div>

      <div className="fe-root">
        <CalcClient />

        <section className="method" id="method">
          <div className="h-cap">Method</div>
          <div className="mgrid">
            <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 5h2v2h-2zM4 3h14v2H4zM2 5h2v14H2zm2 14h16v2H4zm12-4h6v2h-6zm0-4h6v2h-6zm-2 0h2v6h-2z" /></svg></span></div><h4>Market salary</h4><p>Percentile bands from live postings with stated pay, trimmed and floored at 30 observations per cell.</p></div>
            <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 2h14v2H5zm0 18h14v2H5zM3 4h2v16H3zm16 0h2v16h-2zM7 6h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm-1 4h4v2h-4zm5-4h2v2h-2z" /></svg></span></div><h4>Official anchor</h4><p>BLS OEWS wage percentiles by occupation and US state. Posting bands are shrunk toward the anchor by sample size.</p></div>
            <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h12v2H6zm0 18h12v2H6zM4 4h2v2H4zm5 0h2v2H9zm0 14h2v2H9zm4 0h2v2h-2zM7 6h2v12H7zm8 0h2v12h-2zm-2-2h2v2h-2zm7 0h-2v2h2zM2 6h2v12H2zm20 0h-2v12h2zM4 18h2v2H4zm16 0h-2v2h2z" /></svg></span></div><h4>Purchasing power</h4><p>World Bank ICP price levels convert pay between countries at what money actually buys.</p></div>
            <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 20h16v2H4zm16-10h2v10h-2zM2 10h2v10H2zm2-2h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM8 14h2v6H8zm2-2h4v2h-4zm4 2h2v6h-2z" /></svg></span></div><h4>Remote market rate</h4><p>What comparable fully-remote roles pay, tracked across live postings daily.</p></div>
          </div>
        </section>

        <section className="manif">
          <span className="lbl">Why this exists</span>
          <h3>The number is identical. <span className="em">The answer isn&rsquo;t.</span></h3>
          <p>Open models, one transparent score. If an offer can&rsquo;t survive the math, it wasn&rsquo;t fair. No black box. No vibes.</p>
        </section>
      </div>

      <div className="rtp">
        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {FAQ.map((f) => (
            <details key={f.q} name="calcfaq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
        <p className="rt-method lbl">
          The full distributions behind these numbers live on the <Link className="gl" href="/salary">salary pages</Link>,
          per occupation and <Link className="gl" href="/salary/by-country">by country</Link>. This tool ran as
          FairElephant until 2026; the math is unchanged.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Remote Salary Calculator',
            url: 'https://www.pivothop.com/salary/calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description: 'Computes fair remote pay by occupation and country from live postings, BLS OEWS statistics, and World Bank purchasing power.',
          },
          {
            '@type': 'FAQPage',
            mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
              { '@type': 'ListItem', position: 2, name: 'Salaries', item: 'https://www.pivothop.com/salary' },
              { '@type': 'ListItem', position: 3, name: 'Calculator', item: 'https://www.pivothop.com/salary/calculator' },
            ],
          },
        ],
      }) }} />
    </PageShell>
  );
}
