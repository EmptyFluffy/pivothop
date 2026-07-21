'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { WORLDMAP } from './worldmap';

/* FairElephant, live. Same instrument philosophy as PivotHop: every number
   traces to postings or a named public dataset, method switches shown honestly
   (housing and savings lenses are OFF until we have open rent data). */

type Band = { n?: number; p10?: number; p25?: number; p50?: number; p75?: number; p90?: number; basis?: string };
type SalDoc = {
  slug: string; title: string; observations: number;
  global: Band | null;
  by_country: Record<string, { posted?: Band; anchor?: Band; blended?: Band; price_level?: number | null }>;
  remote: { remote: Band; onsite: Band; premium_pct: number } | null;
};
type Levels = Record<string, { price_level: number }>;

// UN M49 (map path data-c) <-> ISO2, for the countries the atlas draws
const M49: Record<string, [string, string]> = {
  '840': ['US', 'United States'], '124': ['CA', 'Canada'], '484': ['MX', 'Mexico'], '188': ['CR', 'Costa Rica'],
  '076': ['BR', 'Brazil'], '032': ['AR', 'Argentina'], '152': ['CL', 'Chile'], '170': ['CO', 'Colombia'],
  '604': ['PE', 'Peru'], '858': ['UY', 'Uruguay'], '826': ['GB', 'United Kingdom'], '372': ['IE', 'Ireland'],
  '250': ['FR', 'France'], '724': ['ES', 'Spain'], '620': ['PT', 'Portugal'], '380': ['IT', 'Italy'],
  '276': ['DE', 'Germany'], '528': ['NL', 'Netherlands'], '056': ['BE', 'Belgium'], '756': ['CH', 'Switzerland'],
  '040': ['AT', 'Austria'], '208': ['DK', 'Denmark'], '752': ['SE', 'Sweden'], '578': ['NO', 'Norway'],
  '246': ['FI', 'Finland'], '352': ['IS', 'Iceland'], '616': ['PL', 'Poland'], '203': ['CZ', 'Czechia'],
  '703': ['SK', 'Slovakia'], '348': ['HU', 'Hungary'], '642': ['RO', 'Romania'], '100': ['BG', 'Bulgaria'],
  '300': ['GR', 'Greece'], '191': ['HR', 'Croatia'], '688': ['RS', 'Serbia'], '233': ['EE', 'Estonia'],
  '428': ['LV', 'Latvia'], '440': ['LT', 'Lithuania'], '804': ['UA', 'Ukraine'], '792': ['TR', 'Turkey'],
  '376': ['IL', 'Israel'], '784': ['AE', 'United Arab Emirates'], '682': ['SA', 'Saudi Arabia'],
  '818': ['EG', 'Egypt'], '504': ['MA', 'Morocco'], '566': ['NG', 'Nigeria'], '404': ['KE', 'Kenya'],
  '710': ['ZA', 'South Africa'], '356': ['IN', 'India'], '360': ['ID', 'Indonesia'], '608': ['PH', 'Philippines'],
  '704': ['VN', 'Vietnam'], '764': ['TH', 'Thailand'], '458': ['MY', 'Malaysia'], '702': ['SG', 'Singapore'],
  '392': ['JP', 'Japan'], '410': ['KR', 'South Korea'], '156': ['CN', 'China'], '036': ['AU', 'Australia'],
  '554': ['NZ', 'New Zealand'],
};
const ISO2NAME = Object.fromEntries(Object.values(M49));
const fmt = (v: number | null | undefined) => (v == null ? '—' : '$' + Math.round(v).toLocaleString());
const fmtK = (v: number | null | undefined) => (v == null ? '—' : '$' + Math.round(v / 1000) + 'k');

function computeLenses(doc: SalDoc | null, levels: Levels, cur: string, hire: string) {
  if (!doc) return null;
  const pl = (c: string) => levels[c]?.price_level ?? null;
  const usP50 = doc.by_country?.US?.blended?.p50 ?? doc.by_country?.US?.posted?.p50 ?? null;
  const hireEntry = doc.by_country?.[hire];
  const hireP50 = hireEntry?.blended?.p50 ?? hireEntry?.posted?.p50 ?? (usP50 && pl(hire) ? usP50 * pl(hire)! : null);
  const hireEst = !(hireEntry?.blended?.p50 ?? hireEntry?.posted?.p50);
  const curEntry = doc.by_country?.[cur];
  const localP50 = curEntry?.posted?.p50 ?? curEntry?.blended?.p50 ?? (usP50 && pl(cur) ? usP50 * pl(cur)! : null);
  const localEst = !(curEntry?.posted?.p50 ?? curEntry?.blended?.p50);
  const ppPar = hireP50 && pl(cur) && pl(hire) ? hireP50 * (pl(cur)! / pl(hire)!) : null;
  const remoteP50 = doc.remote?.remote?.p50 ?? doc.global?.p50 ?? null;
  const ethical = ppPar && remoteP50 ? (ppPar + remoteP50) / 2 : ppPar ?? remoteP50;
  const fair = remoteP50 ?? ethical ?? hireP50;
  // when local is only an estimate it can coincide with the PP par; drop the duplicate
  const dropLocal = localEst && ppPar != null && localP50 != null && Math.abs(localP50 - ppPar) / ppPar < 0.02;
  return {
    lenses: [
      ...(dropLocal ? [] : [{ name: 'Local market salary', sub: (ISO2NAME[cur] || cur) + (localEst ? ' · estimated via price level' : ' · live postings'), v: localP50 }]),
      { name: 'Purchasing-power par', sub: 'World Bank ICP', v: ppPar },
      { name: 'Ethical band midpoint', sub: 'blended', v: ethical },
      { name: 'Remote market median', sub: doc.remote ? 'live remote postings' : 'live postings, all', v: remoteP50, hot: true },
      { name: 'Employer-country rate', sub: (ISO2NAME[hire] || hire) + (hireEst ? ' · estimated via price level' : ' · postings + official'), v: hireP50 },
    ].filter((l) => l.v != null) as { name: string; sub: string; v: number; hot?: boolean }[],
    fair, usP50,
  };
}

export function FEClient() {
  const [index, setIndex] = useState<{ slug: string; title: string; observations: number }[]>([]);
  const [levels, setLevels] = useState<Levels>({});
  const [slug, setSlug] = useState('ux-designer');
  const [doc, setDoc] = useState<SalDoc | null>(null);
  const [cur, setCur] = useState('CR');
  const [hire, setHire] = useState('US');
  const [salary, setSalary] = useState(80000);
  const [ran, setRan] = useState(false);
  const [mode, setMode] = useState<'local' | 'remote' | 'gap'>('local');
  const [pinned, setPinned] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/salaries/index.json').then((r) => r.json()).then((d) => setIndex(d.occupations || []));
    fetch('/data/price-levels.json').then((r) => r.json()).then((d) => setLevels(d.levels || {}));
  }, []);
  useEffect(() => {
    setDoc(null);
    fetch(`/data/salaries/${slug}.json`).then((r) => (r.ok ? r.json() : null)).then(setDoc).catch(() => setDoc(null));
  }, [slug]);

  const L = useMemo(() => computeLenses(doc, levels, cur, hire), [doc, levels, cur, hire]);
  const score = L?.fair ? Math.max(0, Math.min(100, Math.round(100 * (salary / L.fair) / 1.15))) : null;
  const verdict = score == null ? '' :
    score >= 87 ? 'At or above the fair remote band.' :
    score >= 70 ? 'Good match for the remote market.' :
    score >= 50 ? 'Below fair for this work.' : 'Well below the measured band.';
  const delta = L?.fair ? Math.round(100 * (L.fair - salary) / salary) : null;

  // atlas values per ISO for the selected occupation
  const atlas = useMemo(() => {
    if (!doc) return {};
    const out: Record<string, { local: number | null; remote: number | null; gap: number | null }> = {};
    const remote = doc.remote?.remote?.p50 ?? doc.global?.p50 ?? null;
    const usP50 = doc.by_country?.US?.blended?.p50 ?? doc.by_country?.US?.posted?.p50 ?? null;
    for (const iso of Object.keys(ISO2NAME)) {
      const entry = doc.by_country?.[iso];
      const pl = levels[iso]?.price_level ?? null;
      const local = entry?.posted?.p50 ?? entry?.blended?.p50 ?? (usP50 && pl ? usP50 * pl : null);
      out[iso] = { local, remote, gap: local && remote ? remote - local : null };
    }
    return out;
  }, [doc, levels]);

  // paint + wire the map (persistent DOM, delegation)
  useEffect(() => {
    const host = mapRef.current;
    if (!host) return;
    if (!host.querySelector('svg')) host.innerHTML = WORLDMAP;
    const svg = host.querySelector('svg')!;
    const vals = Object.values(atlas).map((a) => a[mode]).filter((v): v is number => v != null);
    const lo = Math.min(...vals), hiV = Math.max(...vals);
    svg.querySelectorAll('path').forEach((p) => {
      const m = M49[p.getAttribute('data-c') || ''];
      const v = m ? atlas[m[0]]?.[mode] : null;
      if (v == null || !isFinite(lo)) { p.classList.add('nodata'); p.setAttribute('fill', '#f1eee6'); return; }
      p.classList.remove('nodata');
      const t = hiV > lo ? (v - lo) / (hiV - lo) : 0.5;
      // oxblood ramp on paper
      const a = 0.06 + t * 0.82;
      p.setAttribute('fill', `rgba(138,47,30,${a.toFixed(3)})`);
      p.classList.toggle('pinned', !!m && pinned === m[0]);
    });
  }, [atlas, mode, pinned]);

  useEffect(() => {
    const host = mapRef.current;
    if (!host) return;
    const onClick = (e: Event) => {
      const p = (e.target as Element).closest('path');
      const m = p && M49[p.getAttribute('data-c') || ''];
      if (m && atlas[m[0]]?.local != null) setPinned(pinned === m[0] ? null : m[0]);
    };
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  }, [atlas, pinned]);

  const countryOpts = Object.entries(ISO2NAME).sort((a, b) => a[1].localeCompare(b[1]));
  const occOpts = index.filter((o) => o.observations >= 50);

  return (
    <div>
      {/* calculator */}
      <section className="calcwrap">
        <div className="calc">
          <label className="cfield"><span className="l">You live in</span>
            <select value={cur} onChange={(e) => setCur(e.target.value)}>
              {countryOpts.map(([iso, n]) => <option key={iso} value={iso}>{n}</option>)}
            </select></label>
          <span className="cdiv"></span>
          <label className="cfield"><span className="l">Employer country</span>
            <select value={hire} onChange={(e) => setHire(e.target.value)}>
              {countryOpts.map(([iso, n]) => <option key={iso} value={iso}>{n}</option>)}
            </select></label>
          <span className="cdiv"></span>
          <label className="cfield"><span className="l">Annual salary (USD)</span>
            <input type="text" inputMode="numeric" value={'$' + salary.toLocaleString()}
              onChange={(e) => { const v = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); if (!isNaN(v)) setSalary(v); }} /></label>
          <span className="cdiv"></span>
          <label className="cfield"><span className="l">Occupation</span>
            <select value={slug} onChange={(e) => setSlug(e.target.value)}>
              {occOpts.map((o) => <option key={o.slug} value={o.slug}>{o.title}</option>)}
            </select></label>
          <button className="go" id="analyzeBtn" onClick={() => setRan(true)}>
            <span>Run the numbers</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </button>
        </div>
      </section>

      {/* results */}
      {ran && L && (
        <section className="band" id="results">
          <div className="band-head">
            <span className="lbl">Analysis · {doc?.title} · {ISO2NAME[cur]} ← {ISO2NAME[hire]}</span>
            <span className="src">Live postings · BLS OEWS · World Bank ICP · no sign-up</span>
          </div>
          <div className="rgrid">
            <div className="rcol">
              <span className="cap">Fairness score</span>
              <div className="big"><span>{score}</span><small>/100</small></div>
              <div className="sub">{verdict}</div>
              <div className="scorebar"><i style={{ width: `${score}%` }}></i></div>
              <div className="scoreticks"><span>0</span><span>50</span><span>100</span></div>
            </div>
            <div className="rcol">
              <span className="cap">Fair remote salary</span>
              <div className="big">{fmt(L.fair)}</div>
              <span className="delta">{delta != null && delta !== 0 ? (delta > 0 ? `+${delta}% vs your number` : `${delta}% vs your number`) : 'matches your number'}</span>
              <div className="sub">The remote market median for this occupation, from {doc?.observations.toLocaleString()} salary observations.</div>
            </div>
            <div className="rcol">
              <span className="cap">Method</span>
              <div className="methodlist">
                <div><span>Market salary</span><span className="on">On</span></div>
                <div><span>Official anchor (OEWS)</span><span className="on">On</span></div>
                <div><span>Purchasing power (ICP)</span><span className="on">On</span></div>
                <div><span>Housing index</span><span>Off · needs open rent data</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* lenses */}
      {ran && L && L.lenses.length > 0 && (
        <section className="lenses" id="lenses">
          <div className="h-cap">The lenses</div>
          <h2>Same salary. {L.lenses.length} answers.</h2>
          <p className="sub">Each lens reads the same offer differently. The spread between them is the story.</p>
          <div className="lbody">
            {(() => {
              const vals = L.lenses.map((l) => l.v).concat([salary]);
              const lo = Math.min(...vals) * 0.8, hiV = Math.max(...vals) * 1.1;
              const X = (v: number) => Math.max(0, Math.min(100, (100 * (v - lo)) / (hiV - lo)));
              return (
                <>
                  {L.lenses.map((l) => (
                    <div key={l.name} className={`lrow${l.hot ? ' hot' : ''}`}>
                      <div className="nm">{l.name}<small>{l.sub}</small></div>
                      <div className="ltrack"><i className="base"></i><b className="dot" style={{ left: `${X(l.v)}%` }}></b></div>
                      <div><div className="val">{fmt(l.v)}</div><div className="rd">{l.v >= salary * 1.05 ? 'above your number' : l.v <= salary * 0.95 ? 'below your number' : 'at your number'}</div></div>
                    </div>
                  ))}
                  <div className="offerline" style={{ left: `${X(salary)}%` }}>
                    <span className="grip"></span><span className="tag">Your number · {fmt(salary)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* atlas */}
      <section className="atlas" id="atlas">
        <div className="h-cap">The atlas</div>
        <h2>Geography is the last lens.</h2>
        <p className="sub">Median pay for {doc ? 'a ' + doc.title.toLowerCase() : 'this occupation'}, read by location. Countries without posted data are estimated through World Bank price levels and marked as such when pinned.</p>
        <div className="modebar" role="tablist" aria-label="Map mode">
          {(['local', 'remote', 'gap'] as const).map((m) => (
            <button key={m} className={`mode${mode === m ? ' on' : ''}`} onClick={() => setMode(m)} role="tab" aria-selected={mode === m}>
              {m === 'local' ? 'Local market' : m === 'remote' ? 'Remote market' : 'The gap'}
            </button>
          ))}
        </div>
        <div className="mapwrap">
          <div ref={mapRef} />
          <div className="mapfocus" id="mapfocus">
            {pinned && atlas[pinned] ? (
              <>
                <span className="mf-name">{ISO2NAME[pinned]}</span>
                <span className="mf-line">Local median {fmt(atlas[pinned].local)}{doc?.by_country?.[pinned]?.posted ? '' : ' (est.)'}</span>
                <span className="mf-line">Remote median {fmt(atlas[pinned].remote)}</span>
                <span className="mf-line">{atlas[pinned].gap != null ? (atlas[pinned].gap! > 0 ? `Remote pays ${fmtK(atlas[pinned].gap)} more` : `Local pays ${fmtK(-atlas[pinned].gap!)} more`) : ''}</span>
              </>
            ) : (
              <span className="mf-hint">Click a country to pin it</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
