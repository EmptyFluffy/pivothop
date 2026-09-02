import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getCompany, companySlugs } from '../companies-data';
import { occTitle } from '../../jobs/jobs-data';
import { countryName } from '../../jobs/countries';
import { salaryLabel, postedLabel, companyInitial, monoTint } from '../../jobs/JobCard';

/* A company page computed entirely from its live postings: what it is hiring
   for, where, what it declares in benefits, what it posts in pay. Nothing is
   self-reported and nothing is written by hand — the FAQ answers are the
   page's own figures (the Himalayas company-record pattern, done honestly). */

export function generateStaticParams() {
  return companySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) return {};
  const sal = c.band ? ` ($${c.band.p25}k–$${c.band.p75}k posted)` : '';
  return {
    title: `Jobs at ${c.name}: ${c.count} open roles${sal}`,
    description: `${c.count} live openings at ${c.name}${c.remoteN > 0 ? `, ${c.remoteN} fully remote` : ''}. What it hires for, where, the benefits its postings declare, and posted pay — computed nightly from the listings themselves.`,
    alternates: { canonical: `/companies/${slug}` },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) notFound();
  const [tbg, tfg] = monoTint(c.name);

  const faq: { q: string; text: string; jsx: React.ReactNode }[] = [];
  if (c.blurb) {
    const short = c.blurb.text.length > 300 ? `${c.blurb.text.slice(0, c.blurb.text.lastIndexOf('.', 300) + 1 || 300)}` : c.blurb.text;
    faq.push({
      q: `What does ${c.name} do?`,
      text: `In its own words, from ${c.blurb.n} of its live postings: "${short}"`,
      jsx: <>In its own words, from {c.blurb.n} of its live postings: &ldquo;{short}&rdquo;</>,
    });
  }
  faq.push(
    {
      q: `How many open roles does ${c.name} have?`,
      text: `${c.count.toLocaleString()} live openings on this board, refreshed nightly; the newest was posted ${postedLabel(c.newest)}. The largest group is ${occTitle(c.occs[0][0])} (${c.occs[0][1]}).`,
      jsx: <>{c.count.toLocaleString()} live openings on this board, refreshed nightly; the newest was posted {postedLabel(c.newest)}. The largest group is <Link className="gl" href={`/jobs/${c.occs[0][0]}`}>{occTitle(c.occs[0][0])}</Link> ({c.occs[0][1]}).</>,
    },
  );
  if (c.remoteN > 0) faq.push({
    q: `Does ${c.name} hire remote?`,
    text: `${c.remoteN.toLocaleString()} of its ${c.count.toLocaleString()} live roles are fully remote (${Math.round((100 * c.remoteN) / c.count)}%).`,
    jsx: <>{c.remoteN.toLocaleString()} of its {c.count.toLocaleString()} live roles are fully remote ({Math.round((100 * c.remoteN) / c.count)}%).</>,
  });
  if (c.benefits.length >= 2) faq.push({
    q: `What benefits does ${c.name} declare?`,
    text: `Its current postings state ${c.benefits.length >= 10 ? '10 or more' : c.benefits.length} distinct benefits; the most-declared are ${c.benefits.slice(0, 3).map(([t, n]) => `${t} (${n} postings)`).join(', ')}. Counted only where the posting text states the benefit.`,
    jsx: <>Its current postings state {c.benefits.length >= 10 ? '10 or more' : c.benefits.length} distinct benefits; the most-declared are {c.benefits.slice(0, 3).map(([t, n]) => `${t} (${n} postings)`).join(', ')}. Counted only where the posting text states the benefit.</>,
  });
  if (c.band) faq.push({
    q: `What does ${c.name} pay?`,
    text: `${c.band.n.toLocaleString()} of its live postings state a salary; the posted middle band runs $${c.band.p25}k–$${c.band.p75}k a year. Nothing is inferred from postings that stay silent.`,
    jsx: <>{c.band.n.toLocaleString()} of its live postings state a salary; the posted middle band runs ${c.band.p25}k–${c.band.p75}k a year. Nothing is inferred from postings that stay silent.</>,
  });

  return (
    <PageShell v2 active="jobs">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">PivotHop</Link><span>/</span>
          <Link href="/companies">Companies</Link><span>/</span>
          <span>{c.name}</span>
        </nav>
        <header className="rt-head co-head">
          <span className="co-logo" aria-hidden="true">
            {c.logo
              ? <img src={c.logo} alt="" width={52} height={52} />
              : <i style={{ background: tbg, color: tfg }}>{companyInitial(c.name)}</i>}
          </span>
          <div>
            <h1 className="rt-h1">Jobs at {c.name}</h1>
            <p className="jb-vmeta">
              <span className="lbl">{c.count.toLocaleString()}</span> live roles
              {c.remoteN > 0 && <> &middot; <span className="lbl">{c.remoteN.toLocaleString()}</span> fully remote</>}
              {c.countries.length > 0 && <> &middot; hiring in {c.countries.slice(0, 3).map(([cc]) => countryName(cc)).join(', ')}</>}
              {c.fields.length > 0 && <> &middot; mostly {c.fields.map(([f]) => f.toLowerCase()).join(' and ')}</>}
              {' '}&middot; newest {postedLabel(c.newest)}
            </p>
          </div>
        </header>

        {c.blurb && (
          <section className="rt-sec">
            <h2>In its own words</h2>
            <blockquote className="co-blurb">{c.blurb.text}</blockquote>
            <p className="rt-note occ-tbl-note">
              How {c.name} describes itself — the same paragraph appears in {c.blurb.n} of its live postings.
              Quoted, not written by us.
            </p>
          </section>
        )}

        <section className="rt-sec">
          <h2>What it is hiring for</h2>
          <div className="occ-tblwrap">
            <table className="occ-tbl">
              <thead><tr><th>Occupation</th><th>Live roles</th></tr></thead>
              <tbody>
                {c.occs.map(([occ, n]) => (
                  <tr key={occ}>
                    <td><Link className="gl" href={`/jobs/${occ}`}>{occTitle(occ)}</Link></td>
                    <td className="n">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rt-sec">
          <h2>Latest openings</h2>
          <ul className="rt-rel">
            {c.jobs.slice(0, 10).map((j) => (
              <li key={`${j.occ}-${j.id}`}>
                <Link href={`/jobs/${j.occ}/${j.id}`}>{j.title}</Link>
                <span className="lbl">{[j.location || (j.remote ? 'Remote' : ''), salaryLabel(j.smin, j.smax), postedLabel(j.posted)].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
          {c.count > 10 && (
            <p className="rt-note">All {c.count.toLocaleString()} roles, filterable: <Link className="gl" href={`/jobs?q=${encodeURIComponent(c.name)}`}>{c.name} on the board</Link>.</p>
          )}
        </section>

        {c.benefits.length >= 2 && (
          <section className="rt-sec">
            <h2>Benefits its postings declare</h2>
            <p className="rt-note">Mined from the posting text itself; the count is how many of its live postings state each benefit. Absence means unstated, not absent.</p>
            <ul className="rt-rel">
              {c.benefits.map(([t, n]) => (
                <li key={t}><span>{t}</span><span className="lbl">{n} postings</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Is this your company?</h2>
            <p>
              This profile is computed from your public postings. Claim it to post roles free during early
              access and, as claimed profiles grow, to add what postings cannot say — the page keeps its data
              honest either way.
            </p>
          </div>
          <Link className="rt-go" href={`/employers?company=${encodeURIComponent(c.name)}&src=claim`}>Claim this profile &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Computed nightly from {c.name}&rsquo;s live postings on re-displayable sources. Nothing on this page
          is self-reported by the company, and PivotHop is not affiliated with it; each opening links out to
          apply at the original posting.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.pivothop.com/companies' },
          { '@type': 'ListItem', position: 3, name: `Jobs at ${c.name}`, item: `https://www.pivothop.com/companies/${c.slug}` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
      }) }} />
    </PageShell>
  );
}
