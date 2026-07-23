import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { coverableSlugs, getSalaryDef, getSalary, getHistory, usBand, chartData, fmt, COUNTRY_NAMES, US_STATE_NAMES } from '../salary-data';
import SalaryChart from '../SalaryChart';
import SalaryFacts, { type CountryDatum } from '../SalaryFacts';

export function generateStaticParams() {
  return coverableSlugs().map((occ) => ({ occ }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  const f = getSalaryDef(occ) ? getSalary(occ) : null;
  if (!f) return {};
  const b = usBand(f);
  return {
    title: `${f.title} salary (2026): what ${f.title.toLowerCase()}s actually make — PivotHop`,
    description: `${f.title} pay from ${f.observations.toLocaleString()} live job postings and official US BLS OEWS data: median ${fmt(b?.p50)}, typical range ${fmt(b?.p25)} to ${fmt(b?.p75)}, with a per-country switcher, the wage trend over recent years, and how it splits by seniority.`,
    alternates: { canonical: `/salary/${occ}` },
  };
}

const LEVELS = [['entry', 'Entry'], ['mid', 'Mid'], ['senior', 'Senior'], ['lead', 'Lead'], ['principal', 'Principal']] as const;

export default async function SalaryPage({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  const def = getSalaryDef(occ);
  if (!def) notFound();
  const f = getSalary(occ);
  if (!f) notFound();
  const us = f.by_country?.US;
  const b = usBand(f);
  const anchor = us?.anchor;
  const history = getHistory(occ);
  const cd = chartData(occ, f);
  // Trend is OEWS-to-OEWS (like for like); comparing the official line to the
  // posted live point would conflate a methodology gap with real wage growth.
  const trend = history.length >= 2 ? Math.round(((history[history.length - 1].p50 - history[0].p50) / history[0].p50) * 100) : null;

  const countries = Object.entries(f.by_country || {})
    .map(([code, v]) => ({ code, band: v.blended || v.posted || v.anchor }))
    .filter((x) => x.band);
  const seniority = LEVELS.map(([k, label]) => ({ label, band: f.seniority?.[k] })).filter((x) => x.band && x.band.p50);
  const states = Object.entries(us?.states || {}).map(([code, v]) => ({ code, band: v.blended })).filter((x) => x.band?.p50).sort((a, b2) => (b2.band!.p50) - (a.band!.p50)).slice(0, 6);
  // Per-country facts for the country switcher: US first (richest data), then by pay.
  const countryData: CountryDatum[] = Object.entries(f.by_country || {})
    .map(([code, v]) => {
      const band = v.blended || v.posted || v.anchor;
      if (!band?.p50) return null;
      return {
        code, name: COUNTRY_NAMES[code] || code,
        p25: band.p25, p50: band.p50, p75: band.p75,
        priceLevel: v.price_level ?? null,
        isUS: code === 'US',
        oews: code === 'US' ? (us?.anchor?.p50 ?? null) : null,
        employed: code === 'US' ? (us?.anchor?.emp ?? null) : null,
      };
    })
    .filter((x): x is CountryDatum => x != null)
    .sort((a, b2) => (a.isUS ? -1 : b2.isUS ? 1 : b2.p50 - a.p50));

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/salary">Salaries</Link><span>/</span><span>{f.title}</span>
        </nav>
        <h1 className="rt-h1">{f.title} salary</h1>
        <p className="rt-dek">
          {`What a ${f.title.toLowerCase()} actually earns, from ${f.observations.toLocaleString()} live job postings blended with the official US `}
          <a className="gl" href="/glossary#oews">OEWS</a>
          {` (Occupational Employment and Wage Statistics) wage anchor. Pick a market for its median and range, then read the seniority split, the trend, and the country comparison below. Updated ${f.updated}.`}
        </p>

        <SalaryFacts
          countries={countryData}
          usMedian={b?.p50 ?? null}
          unemployment={f.unemployment ?? null}
          trendPct={trend}
          trendFrom={history[0]?.year ?? null}
        />
        {countryData.length > 1 && (
          <p className="rt-note sal-cty-note">
            {`Switch the market above to see ${f.title.toLowerCase()} pay in the ${countryData.length} countries our sources cover, each with its own cost of living. The trend, seniority, and state detail below are United States data, where the official record runs deepest.`}
          </p>
        )}

        <section className="sal-chartwrap">
          <div className="sal-chart-head">
            <span className="lbl">United States pay over time &middot; 25th&ndash;75th band &middot; official OEWS with the live 2026 read</span>
          </div>
          {history.length >= 2
            ? <SalaryChart data={cd} />
            : <div className="sal-chart-pending lbl">Trend chart loads once the OEWS annual history is ingested. Current bands are shown below.</div>}
        </section>

        <section className="rt-sec">
          <h2>What the number means</h2>
          {def.editorial}
        </section>

        {seniority.length >= 2 && (
          <section className="rt-sec">
            <h2>By seniority</h2>
            <p className="rt-note">Posted-median pay by seniority signal in the title, from our corpus. Noisy at the edges where sample sizes are small.</p>
            <ul className="sal-bars">
              {seniority.map((s) => {
                const max = Math.max(...seniority.map((x) => x.band!.p50));
                return (
                  <li key={s.label}>
                    <span className="sl">{s.label}</span>
                    <span className="sbar"><span className="sfill" style={{ width: `${Math.round((s.band!.p50 / max) * 100)}%` }} /></span>
                    <span className="sv">{fmt(s.band!.p50)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {countries.length >= 2 && (
          <section className="rt-sec">
            <h2>By country</h2>
            <ul className="rt-rel sal-countries">
              {countries.map((c) => (
                <li key={c.code}><span>{COUNTRY_NAMES[c.code] || c.code}</span><span className="lbl">{fmt(c.band!.p25)} &ndash; {fmt(c.band!.p75)} &middot; median {fmt(c.band!.p50)}</span></li>
              ))}
            </ul>
          </section>
        )}

        {states.length >= 3 && (
          <section className="rt-sec">
            <h2>Top-paying US states</h2>
            <p className="rt-note">OEWS median by state, highest first.</p>
            <ul className="rt-rel sal-countries">
              {states.map((s) => (
                <li key={s.code}><span>{US_STATE_NAMES[s.code] || s.code}</span><span className="lbl">median {fmt(s.band!.p50)}</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Is your offer fair?</h2>
            <p>Run a specific number through FairElephant, which weighs it against this data, your location, and remote market rates.</p>
          </div>
          <Link className="rt-go" href={`/fairelephant?role=${occ}`}>Check an offer &rarr;</Link>
        </section>

        {def.routes.length > 0 && (
          <section className="rt-sec">
            <h2>Move into or out of {f.title.toLowerCase()}</h2>
            <ul className="rt-rel">
              {def.routes.map((r) => (
                <li key={r}><Link href={`/routes/${r}`}>{r.split('-to-').map((s) => s.replace(/-/g, ' ')).join(' → ')}</Link><span className="lbl">measured route</span></li>
              ))}
            </ul>
          </section>
        )}

        {def.also.length > 0 && (
          <section className="rt-sec">
            <h2>Related salaries</h2>
            <ul className="rt-rel">
              {def.also.map((s) => { const sf = getSalary(s); return sf ? <li key={s}><Link href={`/salary/${s}`}>{sf.title} salary</Link><span className="lbl">{fmt(usBand(sf)?.p50)} median</span></li> : null; })}
            </ul>
          </section>
        )}

        {def.faq.length > 0 && (
          <div className="post-faq rt-faq">
            <h2>Quick answers</h2>
            {def.faq.map((q) => (<details key={q.q}><summary>{q.q}</summary><p>{q.a}</p></details>))}
          </div>
        )}

        <div className="post-foot">
          <Link href="/salary" className="lbl">&larr; All salaries</Link>
          <Link href="/" className="lbl acc">Run your own numbers &rarr;</Link>
        </div>

        <p className="rt-method lbl">
          {`Method: bands are the 25th, 50th, and 75th percentiles of live US postings with stated pay, shrunk toward the official OEWS anchor by sample size (the “blended” figure). Trend is the OEWS annual median for `}
          <a className="gl" href="/glossary#soc">SOC</a>
          {` (Standard Occupational Classification) code ${f.soc}.`}
          {f.unemployment ? (
            <>{` Unemployment is the 2025 `}<a className="gl" href="/glossary#bls">BLS</a>{` (Bureau of Labor Statistics) `}<a className="gl" href="/glossary#cps">CPS</a>{` (Current Population Survey) annual-average rate for “${f.unemployment.label}.”`}</>
          ) : ''}
          {` Live corpus ${f.observations.toLocaleString()} observations, ${f.updated}. Definitions in the `}
          <Link className="gl" href="/glossary">glossary</Link>.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Occupation',
        name: f.title,
        occupationalCategory: f.soc,
        description: `Pay and career data for ${f.title.toLowerCase()}s in the United States, from live postings and BLS OEWS.`,
        estimatedSalary: [{
          '@type': 'MonetaryAmountDistribution', name: 'base', currency: 'USD',
          median: b?.p50, percentile25: b?.p25, percentile75: b?.p75, duration: 'P1Y',
        }],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: def.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Salaries', item: 'https://www.pivothop.com/salary' },
          { '@type': 'ListItem', position: 3, name: `${f.title} salary`, item: `https://www.pivothop.com/salary/${occ}` },
        ],
      }) }} />
    </PageShell>
  );
}
