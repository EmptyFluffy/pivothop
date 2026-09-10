import Link from 'next/link';
import { swissStats, langCategory, cityHub, cityOccCategories, LANG_NAMES, type Category } from './categories-data';
import { occTitle } from './jobs-data';

/* The Swiss block (2026-09-10). Rendered on every category page scoped to
   Switzerland: the country page, field-in-Switzerland, occupation-in-
   Switzerland, remote-in-Switzerland. Three things the conversational
   queries ask and the page did not answer: workload (Swiss postings put
   "80-100%" in the title), the language the posting asks for, and where in
   the country. Every figure is this page's own matched postings. Server-only. */

const pct = (n: number, of: number) => (of > 0 ? Math.round((n * 100) / of) : 0);

export function swissFaq(cat: Category): { q: string; text: string; jsx: React.ReactNode }[] {
  const s = swissStats(cat);
  if (!s || s.n < 6) return [];
  const what = cat.destOcc ? `${occTitle(cat.destOcc).toLowerCase()} roles` : cat.kind === 'country' ? 'roles' : `${cat.searchTitle.replace(/ in .*$/, '')} roles`;
  const out: { q: string; text: string; jsx: React.ReactNode }[] = [];

  // a language page already answers the language question in its own words
  if (s.gated >= 5 && cat.kind !== 'lang-country') {
    const [topCode, topN] = s.langs[0];
    const top = LANG_NAMES[topCode] ?? topCode;
    const others = s.langs.slice(1, 3).filter(([c]) => LANG_NAMES[c]).map(([c, n]) => `${LANG_NAMES[c]} in ${n}`).join(', ');
    const text = `${s.gated} of the ${s.n} ${what} here state a language requirement in the posting, and ${top} is the one asked for most (${topN} postings${others ? `; ${others}` : ''}). The other ${s.n - s.gated} say nothing explicit, which in Switzerland usually means the local language of the canton is assumed. A posting written in English is not counted as requiring English; only the stated requirement is.`;
    const links = s.langs.slice(0, 3).map(([c]) => langCategory(c, 'CH')).filter((x): x is Category => !!x);
    out.push({
      q: `Do I need ${top} for ${what} in Switzerland?`,
      text,
      jsx: <>{text}{links.length > 0 && <>{' '}The language pages: {links.map((l, i) => <span key={l.slug}>{i > 0 ? ', ' : ''}<Link className="gl" href={`/jobs/${l.slug}`}>{l.title.toLowerCase()}</Link></span>)}.</>}</>,
    });
  }

  if (s.workloadStated >= 5) {
    const ranges = s.ranges.map(([r, n]) => `${r} (${n})`).join(', ');
    const text = `Swiss postings state the workload in the title as a percentage of a full week, and ${s.workloadStated} of the ${s.n} ${what} here do. ${s.partTimeOk} of those open the door below 100 percent, ${s.fullOnly} are full time only. The commonest stated ranges: ${ranges}. A range like 80 to 100 percent means the employer will take four days a week; it is a real option to negotiate, not a formality.`;
    out.push({ q: `Are part-time ${what} common in Switzerland?`, text, jsx: <>{text}</> });
  }

  if (s.cities.length >= 2) {
    const cityLink = (city: string) => {
      const occ = cat.destOcc ? cityOccCategories(city, 'CH').find((c) => c.destOcc === cat.destOcc) : null;
      const hub = cityHub(city, 'CH');
      return occ ? `/jobs/${occ.slug}` : hub ? `/jobs/${hub.slug}` : null;
    };
    const text = `By the location named in the posting: ${s.cities.map(([c, n]) => `${c} (${n})`).join(', ')}.${s.remoteN > 0 ? ` ${s.remoteN} of the ${s.n} are fully remote.` : ''} Cantons differ in language and in permit practice, so the city is worth checking before the salary.`;
    out.push({
      q: `Where in Switzerland are the ${what}?`,
      text,
      jsx: <>By the location named in the posting: {s.cities.map(([c, n], i) => { const h = cityLink(c); return <span key={c}>{i > 0 ? ', ' : ''}{h ? <Link className="gl" href={h}>{c}</Link> : c} ({n})</span>; })}.{s.remoteN > 0 ? <> {s.remoteN} of the {s.n} are fully remote.</> : null} Cantons differ in language and in permit practice, so the city is worth checking before the salary.</>,
    });
  }
  return out;
}

export function SwissBlock({ cat }: { cat: Category }) {
  const s = swissStats(cat);
  if (!s || s.n < 6) return null;
  const langLinks = s.langs.slice(0, 4).map(([c, n]) => ({ code: c, n, name: LANG_NAMES[c] ?? c, page: langCategory(c, 'CH') })).filter((l) => LANG_NAMES[l.code]);
  return (
    <section className="rt-sec occ-facts">
      <h2>Working in Switzerland, from these {s.n.toLocaleString()} postings</h2>
      <p className="rt-note">Workload, language and place, read from the postings themselves. Swiss employers write the workload into the title and name the language they need; both are counted here, nothing is inferred.</p>
      <div className="cg-band">
        <div><span className="v">{s.workloadStated > 0 ? `${pct(s.partTimeOk, s.workloadStated)}%` : 'n/a'}</span><span className="k">Open below 100% (of {s.workloadStated} stating a workload)</span></div>
        <div className="mid"><span className="v">{s.gated >= 5 && s.langs[0] ? (LANG_NAMES[s.langs[0][0]] ?? s.langs[0][0]) : 'unstated'}</span><span className="k">{s.gated >= 5 ? `Language asked for most (${s.gated} state one)` : `Language: ${s.gated} of ${s.n} state one`}</span></div>
        <div><span className="v">{s.cities[0]?.[0] ?? 'n/a'}</span><span className="k">Most named location{s.cities[0] ? ` (${s.cities[0][1]})` : ''}</span></div>
      </div>
      {langLinks.length > 0 && s.gated >= 5 && (
        <div className="occ-skills">
          <h3>Language stated in the posting</h3>
          <ul>
            {langLinks.map((l) => (
              <li key={l.code}>
                {l.page ? <Link className="gl" href={`/jobs/${l.page.slug}`}>{l.name}</Link> : <span>{l.name}</span>}
                <span className="n">{l.n}</span>
              </li>
            ))}
          </ul>
          <p className="rt-note occ-tbl-note">Postings that name the language explicitly. The rest usually assume the canton&rsquo;s own language.</p>
        </div>
      )}
      {s.ranges.length > 0 && (
        <div className="occ-skills">
          <h3>Workload stated in the title</h3>
          <ul>
            {s.ranges.map(([r, n]) => <li key={r}><span>{r}</span><span className="n">{n}</span></li>)}
          </ul>
          <p className="rt-note occ-tbl-note">A range ending in 100% means full time is offered and less is negotiable.</p>
        </div>
      )}
    </section>
  );
}
