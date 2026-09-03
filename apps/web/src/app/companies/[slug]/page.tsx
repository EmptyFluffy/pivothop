import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getCompany, companySlugs } from '../companies-data';
import { occTitle } from '../../jobs/jobs-data';
import { countryName } from '../../jobs/countries';
import { postedLabel, companyInitial, monoTint } from '../../jobs/JobCard';
import JobsList from '../../jobs/JobsList';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';

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
    description: `${c.count} live openings at ${c.name}${c.remoteN > 0 ? `, ${c.remoteN} fully remote` : ''}. What it hires for, where, the benefits its postings declare, and posted pay, computed nightly from the listings themselves.`,
    alternates: { canonical: `/companies/${slug}` },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) notFound();
  const [tbg, tfg] = monoTint(c.name);

  /* The answers are written for a person asking, not as data readouts
     (founder note, 2026-09-02): "Spotify has 34 open roles on our board right
     now", not "34 live jobs". Each one is a complete, warm sentence that still
     says exactly where the number comes from. */
  const top = c.occs[0];
  const field = c.fields[0]?.[0]?.toLowerCase() ?? null;
  const faq: { q: string; text: string; jsx: React.ReactNode }[] = [];
  if (c.about) {
    faq.push({
      q: `What does ${c.name} do?`,
      text: `${c.about.text} That description comes from Wikipedia. What we add is the live picture: right now ${c.name} has ${c.count.toLocaleString()} open roles on our board${field ? `, mostly in ${field}` : ''}.`,
      jsx: <>{c.about.text} That description comes from <a className="gl" href={c.about.url} target="_blank" rel="noopener noreferrer">Wikipedia</a>. What we add is the live picture: right now {c.name} has {c.count.toLocaleString()} open roles on our board{field ? <>, mostly in {field}</> : null}.</>,
    });
  } else if (c.blurb) {
    const short = c.blurb.text.length > 300 ? `${c.blurb.text.slice(0, c.blurb.text.lastIndexOf('.', 300) + 1 || 300)}` : c.blurb.text;
    faq.push({
      q: `What does ${c.name} do?`,
      text: `Here is how ${c.name} puts it in its own postings: "${short}" We quote rather than paraphrase, and right now it has ${c.count.toLocaleString()} open roles on our board.`,
      jsx: <>Here is how {c.name} puts it in its own postings: &ldquo;{short}&rdquo; We quote rather than paraphrase, and right now it has {c.count.toLocaleString()} open roles on our board.</>,
    });
  }
  faq.push({
    q: `How many open roles does ${c.name} have?`,
    text: `${c.name} has ${c.count.toLocaleString()} open roles on our board right now, and the list refreshes every night. The newest one went up ${postedLabel(c.newest)}. Most of them are ${occTitle(top[0]).toLowerCase()} roles (${top[1]}); the full breakdown by occupation is in the table above.`,
    jsx: <>{c.name} has {c.count.toLocaleString()} open roles on our board right now, and the list refreshes every night. The newest one went up {postedLabel(c.newest)}. Most of them are <Link className="gl" href={`/jobs/${top[0]}`}>{occTitle(top[0]).toLowerCase()}</Link> roles ({top[1]}); the full breakdown by occupation is in the table above.</>,
  });
  faq.push(c.remoteN > 0 ? {
    q: `Does ${c.name} hire remote?`,
    text: `Yes. ${c.remoteN.toLocaleString()} of ${c.name}'s ${c.count.toLocaleString()} open roles are fully remote right now, about ${Math.round((100 * c.remoteN) / c.count)}% of what it is hiring for. The rest name a city or say on-site, and every card above tells you which.`,
    jsx: <>Yes. {c.remoteN.toLocaleString()} of {c.name}&rsquo;s {c.count.toLocaleString()} open roles are fully remote right now, about {Math.round((100 * c.remoteN) / c.count)}% of what it is hiring for. The rest name a city or say on-site, and every card above tells you which.</>,
  } : {
    q: `Does ${c.name} hire remote?`,
    text: `Not at the moment. None of ${c.name}'s ${c.count.toLocaleString()} open roles are marked fully remote; they name a city or say on-site. That can change with the nightly refresh, so it is worth checking back.`,
    jsx: <>Not at the moment. None of {c.name}&rsquo;s {c.count.toLocaleString()} open roles are marked fully remote; they name a city or say on-site. That can change with the nightly refresh, so it is worth checking back.</>,
  });
  if (c.benefits.length >= 2) {
    const [b1, b2, b3] = c.benefits;
    const named = [b1, b2, b3].filter(Boolean).map(([t]) => t.toLowerCase());
    const list = named.length === 3 ? `${named[0]}, ${named[1]} and ${named[2]}` : named.join(' and ');
    faq.push({
      q: `What benefits does ${c.name} offer?`,
      text: `Its postings spell some out. Across ${c.name}'s current listings we found ${c.benefits.length >= 10 ? 'ten or more' : c.benefits.length} distinct benefits, and the ones it mentions most are ${list}. We only count a benefit when the posting text states it, so anything missing here is unstated rather than absent.`,
      jsx: <>Its postings spell some out. Across {c.name}&rsquo;s current listings we found {c.benefits.length >= 10 ? 'ten or more' : c.benefits.length} distinct benefits, and the ones it mentions most are {list}. We only count a benefit when the posting text states it, so anything missing here is unstated rather than absent.</>,
    });
  }
  if (c.band) faq.push({
    q: `What does ${c.name} pay?`,
    text: `${c.band.n.toLocaleString()} of ${c.name}'s open roles state a salary. Across those, the middle half of posted pay runs from $${c.band.p25}k to $${c.band.p75}k a year. We do not guess for postings that stay silent, so read this as what ${c.name} is publicly offering right now, not a company-wide average.`,
    jsx: <>{c.band.n.toLocaleString()} of {c.name}&rsquo;s open roles state a salary. Across those, the middle half of posted pay runs from ${c.band.p25}k to ${c.band.p75}k a year. We do not guess for postings that stay silent, so read this as what {c.name} is publicly offering right now, not a company-wide average.</>,
  });

  return (
    <PageShell v2 active="companies">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Companies', href: '/companies' }, { label: c.name }]} />
        <PageHead
          mark={c.logo
            ? <img src={c.logo} alt="" width={52} height={52} />
            : <i style={{ background: tbg, color: tfg }}>{companyInitial(c.name)}</i>}
          title={<>Jobs at {c.name}</>}
          meta={<>
            <span className="lbl">{c.count.toLocaleString()}</span> live roles
            {c.remoteN > 0 && <> &middot; <span className="lbl">{c.remoteN.toLocaleString()}</span> fully remote</>}
            {c.countries.length > 0 && <> &middot; hiring in {c.countries.slice(0, 3).map(([cc]) => countryName(cc)).join(', ')}</>}
            {c.fields.length > 0 && <> &middot; mostly {c.fields.map(([f]) => f.toLowerCase()).join(' and ')}</>}
            {' '}&middot; newest {postedLabel(c.newest)}
          </>}
        />

        {c.about && (
          <section className="rt-sec">
            <h2>What {c.name} does</h2>
            <p className="co-about">{c.about.text}</p>
            <span className="co-src lbl">
              Source: <a href={c.about.url} target="_blank" rel="noopener noreferrer">Wikipedia, &ldquo;{c.about.title}&rdquo;</a> (CC BY-SA). Not written by PivotHop.
            </span>
          </section>
        )}

        {c.blurb && (
          <section className="rt-sec">
            <h2>How it describes itself</h2>
            <blockquote className="co-blurb">{c.blurb.text}</blockquote>
            <p className="rt-note">
              Quoted from {c.name}&rsquo;s own postings: this opening paragraph appears in {c.blurb.n} of its live listings.
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

        <JobsList
          jobs={c.jobs}
          limit={10}
          total={c.count}
          heading="Latest openings"
          note={`${c.name}'s live postings on this board, freshest first. Apply at the source.`}
          allHref={`/jobs?q=${encodeURIComponent(c.name)}`}
          allLabel={`All ${c.count.toLocaleString()} ${c.name} roles, filterable`}
        />

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
              access and, as claimed profiles grow, to add what postings cannot say. The page keeps its data
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
