import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../../components/SiteChrome';
import { COUNTRY_NAMES, fmt } from '../salary-data';

export const metadata: Metadata = {
  title: 'The same job, priced across countries · PivotHop salaries',
  description:
    'What the same occupation pays in the United States, United Kingdom, Canada, and Australia, from live job postings, nominal and adjusted for cost of living. A cross-market salary comparison, not a listicle.',
  alternates: { canonical: '/salary/by-country' },
};

type Band = { p25?: number; p50?: number; p75?: number };
type Cell = { posted?: Band | null; blended?: Band | null; anchor?: Band | null; price_level?: number };
type SF = { slug: string; title: string; by_country?: Record<string, Cell> };

const CO = ['US', 'GB', 'CA', 'AU'] as const;
const median = (xs: number[]) => {
  const a = xs.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  const n = a.length;
  return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null;
};
const p50 = (c?: Cell | null) => (c ? c.blended?.p50 ?? c.posted?.p50 ?? c.anchor?.p50 ?? null : null);

function loadAll(): SF[] {
  const dir = path.join(process.cwd(), 'public', 'data', 'salaries');
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return []; }
  const out: SF[] = [];
  for (const f of files) {
    try { out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch { /* skip */ }
  }
  return out;
}

export default function ByCountryPage() {
  const all = loadAll();
  const perC: Record<string, { pays: number[]; plevels: number[]; bySlug: Record<string, number> }> = {};
  for (const c of CO) perC[c] = { pays: [], plevels: [], bySlug: {} };
  for (const f of all) {
    for (const c of CO) {
      const cell = f.by_country?.[c];
      const v = p50(cell);
      if (cell && v != null) {
        perC[c].bySlug[f.slug] = v;
        perC[c].pays.push(v);
        if (cell.price_level) perC[c].plevels.push(cell.price_level);
      }
    }
  }
  // Common basket: occupations priced in the US, UK, and Canada, so the country
  // medians compare like with like instead of whatever mix each market happens to carry.
  const basket = Object.keys(perC.US.bySlug).filter((s) => perC.GB.bySlug[s] != null && perC.CA.bySlug[s] != null);
  const countryRows = CO.map((c) => {
    const pl = median(perC[c].plevels) || 1;
    const nominal = median(basket.map((s) => perC[c].bySlug[s]).filter((v): v is number => v != null));
    return { c, pl, nominal, adjusted: nominal != null ? nominal / pl : null, n: perC[c].pays.length };
  }).filter((r) => r.nominal != null);
  const byNominal = [...countryRows].sort((a, b) => b.nominal! - a.nominal!);
  const byAdjusted = [...countryRows].sort((a, b) => b.adjusted! - a.adjusted!);

  const titleBy: Record<string, string> = {};
  all.forEach((f) => { titleBy[f.slug] = f.title; });
  const common = basket.filter((s) => perC.AU.bySlug[s] != null);
  const featured = ['software-engineer', 'data-scientist', 'product-manager', 'project-manager', 'accountant', 'marketing-manager', 'registered-nurse', 'graphic-designer', 'ux-designer', 'mechanical-engineer']
    .filter((s) => common.includes(s)).slice(0, 8);

  const top = byNominal[0];
  const topAdj = byAdjusted[0];

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/salary">Salaries</Link><span>/</span><span>By country</span>
        </nav>
        <h1 className="rt-h1">The same job, priced across countries</h1>
        <p className="rt-dek">
          What an occupation pays in the four markets our sources post in, the United States, United Kingdom, Canada, and
          Australia, from live job postings. Two numbers for each: the headline pay, and the same pay adjusted for cost of
          living, which is the one that tells you where a salary actually goes further. Pricing a specific remote offer
          against a location is <Link className="gl" href="/fairelephant">FairElephant</Link>&rsquo;s job.
        </p>

        <section className="rt-sec">
          <h2>Which market pays most</h2>
          <p className="rt-note">
            Median across a common basket of {basket.length} occupations priced in all three of the best-covered markets,
            so the comparison is like with like. Cost of living is a price-level index against the United States at 1.00;
            the adjusted column is pay divided by that index, in US-equivalent purchasing power.
          </p>
          <table className="post-table">
            <caption>Cross-market pay, common-basket median &middot; PivotHop, July 2026</caption>
            <thead><tr><th>Country</th><th className="num">Median pay</th><th className="num">Cost of living</th><th className="num">Adjusted</th><th className="num">Occupations</th></tr></thead>
            <tbody>
              {byNominal.map((r) => (
                <tr key={r.c}>
                  <td><strong>{COUNTRY_NAMES[r.c] || r.c}</strong></td>
                  <td className="num">{fmt(r.nominal)}</td>
                  <td className="num">{r.pl.toFixed(2)}</td>
                  <td className="num">{fmt(r.adjusted)}</td>
                  <td className="num">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {top && topAdj && (
            <p>
              {`${COUNTRY_NAMES[top.c]} posts the highest headline pay. `}
              {top.c === topAdj.c
                ? 'It stays on top once cost of living is taken out, but the gap to the rest narrows: a lower cost of living is exactly how a smaller nominal salary buys a comparable life.'
                : `${COUNTRY_NAMES[topAdj.c]} moves ahead once cost of living is taken out, which is the whole point of the adjusted column: the headline number is not the one you live on.`}
            </p>
          )}
        </section>

        {featured.length >= 3 && (
          <section className="rt-sec">
            <h2>The same job, four markets</h2>
            <p className="rt-note">Median posted pay for one occupation across the four markets. Click a role for its full distribution, seniority curve, and trend.</p>
            <table className="post-table">
              <caption>Median pay by occupation and market &middot; PivotHop, July 2026</caption>
              <thead><tr><th>Occupation</th>{CO.map((c) => <th key={c} className="num">{COUNTRY_NAMES[c]}</th>)}</tr></thead>
              <tbody>
                {featured.map((s) => (
                  <tr key={s}>
                    <td><Link href={`/salary/${s}`}>{titleBy[s]}</Link></td>
                    {CO.map((c) => <td key={c} className="num">{fmt(perC[c].bySlug[s] ?? null)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Weighing a remote offer?</h2>
            <p>A number in one country is not the same number in another. FairElephant prices a specific offer against location, cost of living, and remote-market rates.</p>
          </div>
          <Link className="rt-go" href="/fairelephant">Run the numbers &rarr;</Link>
        </section>

        <section className="rt-sec">
          <h2>Related</h2>
          <ul className="rt-rel">
            <li><Link href="/salary">All salaries by occupation</Link><span className="lbl">the full board</span></li>
            <li><Link href="/blog/remote-premium-illusion">The remote-pay premium, tested</Link><span className="lbl">what remote does to pay</span></li>
          </ul>
        </section>

        <p className="rt-method lbl">
          Method: medians are the middle of the posted blended band per occupation and country, from live job postings with
          stated pay in our July 2026 corpus. Coverage is limited to the markets our sources post in at volume, the United
          States, United Kingdom, Canada, and Australia; this is a cross-market comparison of those, not a global ranking.
          The country table uses a common basket of {basket.length} occupations priced in the US, UK, and Canada.
          Cost-of-living index from the same per-occupation price levels used across the salary board. Definitions in the{' '}
          <Link className="gl" href="/glossary">glossary</Link>.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'PivotHop cross-market salary comparison',
        description: 'Median posted pay per occupation across the United States, United Kingdom, Canada, and Australia, nominal and cost-of-living adjusted.',
        url: 'https://www.pivothop.com/salary/by-country',
        creator: { '@type': 'Organization', name: 'PivotHop' },
        isAccessibleForFree: true,
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Salaries', item: 'https://www.pivothop.com/salary' },
          { '@type': 'ListItem', position: 3, name: 'By country', item: 'https://www.pivothop.com/salary/by-country' },
        ],
      }) }} />
    </PageShell>
  );
}
