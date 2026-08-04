import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Admin — Schweiz', robots: { index: false, follow: false } };

/* The Swiss pivot, complete, for both founders — written so Nadine can run her
   side (SECO, GmbH, outplacement, backlinks) without asking for context. Source
   of truth is docs/32-switzerland.md in the repo; this page mirrors it and adds
   the live status. Same rule as /admin/research: numbers are published or
   measured, never estimated, and the two we could not verify are named as open. */
export const dynamic = 'force-dynamic';

const asOf = 'Stand: 2. August 2026';

export default function Schweiz() {
  return (
    <div className="adm res">
      <header className="adm-head">
        <h1>Schweiz — the pivot</h1>
        <span className="lbl">{asOf} · 31,096 CH ads in corpus · 12,056 mapped · 4,800 LIVE on the board · day-45 mapping gate passed early</span>
      </header>

      <nav className="otr-nav">
        <Link href="/admin">← Submissions</Link>
        <Link href="/admin/outreach">Outreach</Link>
        <Link href="/admin/research">Research →</Link>
      </nav>

      {/* ── The verdict ─────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>The verdict <span className="lbl">decided 2026-08-01, full reasoning in docs/32</span></h2>
        <p className="res-lede">
          <b>Go Swiss-first now, staged, without burning the global boats.</b> All new effort goes to Switzerland;
          the automated global machine (nightly scrape, English site, MCP) keeps running untouched at zero marginal
          cost. Reverting costs almost nothing by construction, which is what makes starting cheap.
        </p>
        <div className="res-callout">
          <span className="lbl">Why this market</span>
          <p>
            The demand has a <b>name</b> (&ldquo;Quereinsteiger&rdquo; is a job-market category here, not a description),
            the shortage is official (<b>32 of 55 occupational groups</b>, Adecco/UZH index, at 2.8% unemployment),
            the prices are the best in Europe (jobs.ch charges <b>~CHF 1,000+ per posting</b>; outplacement runs{' '}
            <b>CHF 10,000–25,000 per person</b>), a federal law feeds our data (Stellenmeldepflicht), and the
            co-founder is native to the market. Nobody in Switzerland measures career adjacency. Everyone sells
            listings, coaching, or retraining; the measurement seat is empty.
          </p>
        </div>
        <div className="res-warn">
          <b>Why now:</b> PivotHop is pre-revenue and pre-brand, so there is nothing to strand — and the global
          English lane has a funded competitor on our exact architecture (HiringCafe, 1M MAU, currently hiring a
          Head of SEO). Every month of further US investment raises the price of this decision; today it is near zero.
        </div>
      </section>

      {/* ── Status + next steps ─────────────────────────────────── */}
      <section className="res-sec">
        <h2>Status board <span className="lbl">what is done, what is next, who does it</span></h2>
        <table className="res-table">
          <thead><tr><th>Item</th><th>Status</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td><b>Job-Room corpus source</b> — the federal portal&rsquo;s public search endpoint: 71,702 published ads, full text, language-tagged, official AVAM occupation codes</td><td><b>LIVE</b> — 31,096 ads banked; the 10k API window is beaten with canton-sliced queries; full country swept every ~2 nights</td><td>done</td></tr>
            <tr><td><b>SECO blessing email</b> — formal read-access request; draft below, ready to send</td><td>ready to send</td><td><b>Nadine</b></td></tr>
            <tr><td><b>CH country inference + Careerjet CH locales</b> in the miner</td><td>shipped</td><td>done</td></tr>
            <tr><td><b>Careerjet key</b> — free signup at careerjet.com/partners (the adapter existed, the key never did)</td><td>open, low priority now</td><td>Carlos</td></tr>
            <tr><td><b>German miner</b> (compound splitting) — 197 of 200 probed Job-Room ads are German; this is the critical path. Shortcut candidate: one AVAM-code→taxonomy crosswalk instead of parsing titles</td><td>next build</td><td>Carlos/Claude</td></tr>
            <tr><td><b>pivothop.ch domain</b> (~CHF 10/yr) — the ccTLD is itself the trust strategy</td><td>open</td><td>Carlos</td></tr>
            <tr><td><b>GmbH / Einzelfirma</b> — unlocks CHF invoicing, TWINT, and the legally-earned Swiss cross (Swissness Act: permitted for services when HQ + administration are Swiss)</td><td>open</td><td><b>Nadine</b></td></tr>
            <tr><td><b>Swiss edition of the site</b> (de-CH landing, CH data slice, geo-suggest banner)</td><td>after corpus confirms over a few nights</td><td>Carlos/Claude</td></tr>
            <tr><td><b>First outplacement conversations</b> (target list below)</td><td>day-90 gate</td><td><b>Nadine</b></td></tr>
          </tbody>
        </table>
      </section>

      {/* ── Market ──────────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>The market, by its numbers</h2>
        <ul className="res-notes">
          <li><span className="lbl">Workforce &amp; mobility</span>~5.2M workers. BFS/SAKE: <b>one person in seven changed workplace 2022→2023</b> (14.7%); 19.5% left their position within 2024; 23.8% among 15–24-year-olds; 38.1% of changers saw pay rise. A population that changes jobs constantly, in a system that documents it obsessively.</li>
          <li><span className="lbl">Shortage</span>Adecco/UZH index: shortage in <b>32 of 55 occupational groups</b>. Hardest hit: IT, healthcare/Pflege, engineering, construction, trades — exactly the fields most open to Quereinsteiger. Retraining compressed to 3–6-month certificates in several trades; the Pflegeinitiative puts federal money behind care retraining.</li>
          <li><span className="lbl">Languages</span>Deutschschweiz ~65% of the market (launch region); Romandie second (jobup.ch culture, own market); Ticino deferred. Swiss tech advertises heavily in English. Site language is <b>de-CH — Swiss Standard German, never dialect, never German-German</b>: no ß (always ss), &ldquo;Lohn&rdquo; not &ldquo;Gehalt&rdquo;, &ldquo;Ferien&rdquo; not &ldquo;Urlaub&rdquo;. Nadine reviews every German line — the native eye is the quality gate.</li>
          <li><span className="lbl">Salaries</span>Swiss ads do not post pay. Replacement is an upgrade: <b>BFS Salarium / Lohnstrukturerhebung</b> — official federal wages per occupation, region, age. &ldquo;The federal statistics say&rdquo; beats &ldquo;179 postings state pay&rdquo; here.</li>
        </ul>
      </section>

      {/* ── Competitors ─────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>Competitors <span className="lbl">how each makes money, how each grew</span></h2>
        <table className="res-table">
          <thead><tr><th>Player</th><th>Business mechanics</th><th>How they grew</th><th>Meaning for us</th></tr></thead>
          <tbody>
            <tr>
              <td><b>JobCloud</b><br /><span className="lbl">jobs.ch · jobup.ch · JobScout24</span></td>
              <td>50/50 JV of TX Group + Ringier, ~350 staff, <b>CHF 100M+ revenue since 2017</b>. Pure listings: employers pay per posting (~CHF 1,000+), packages, CV database, display ads. Seekers free.</td>
              <td>Consolidation, not product: jobs.ch + jobup merged 2013 with media-house distribution; 49% of Austria&rsquo;s karriere.at. Moat = employer habit.</td>
              <td>Channel competitor, not product competitor. Listing revenue means measurement neither threatens nor tempts them. Plausible eventual partner or acquirer.</td>
            </tr>
            <tr>
              <td><b>SwissDevJobs</b></td>
              <td>Employer-paid postings where the differentiator IS the product: mandatory salary transparency + structured tech stacks. Bootstrapped, ~5 people, never funded.</td>
              <td>2018 side project → 80k+ monthly users via SEO on structured data + developer word-of-mouth; exported the playbook (GermanTechJobs.de, DevITJobs.fr).</td>
              <td><b>The proof our plan shape sustains a business here.</b> They stopped at transparency; we go to measurement. Candidate data partner.</td>
            </tr>
            <tr>
              <td><b>x28 AG</b></td>
              <td>B2B data licensing: crawls ~250k postings from employer sites, sells API slices; Profilmatcher matching; quarterly Jobradar report.</td>
              <td>Institutional sales: KOF (ETH), University of Lausanne, cantons, NZZ, consultancies.</td>
              <td>Proof Swiss institutions <b>pay for labor-market data</b> — our B2B thesis validated by someone else&rsquo;s revenue. Fallback corpus supplier, not a rival.</td>
            </tr>
            <tr>
              <td><b>derquereinstieg.ch</b></td>
              <td>Niche listings + guides for career-changers (~425 tagged ads).</td>
              <td>Small; rides the Quereinsteiger keyword space.</td>
              <td>The demand proof. A keyword surface we outrank with data, not a business we fight.</td>
            </tr>
            <tr>
              <td><b>Outplacement</b><br /><span className="lbl">Grass &amp; Partner · Alixio Mobility (ex-von Rundstedt) · LHH/Adecco · Right Management · von Rohr · Dr. Nadig · Mangold</span></td>
              <td><b>CHF 10,000–25,000 per person, paid by the former employer</b>, customary/contractual in Swiss redundancy social plans; annual contracts at the big firms.</td>
              <td>Decades of HR relationships; hrtoday calls the market &ldquo;träge&rdquo; (sluggish), shaken only by von Rundstedt&rsquo;s tooling-and-pricing entry.</td>
              <td><b>Buyers, not competitors.</b> Against a CHF 15k mandate, our counselor seat is invisible. NZZ-documented pain (&ldquo;employers want a clone of the predecessor&rdquo;) is literally what adjacency answers.</td>
            </tr>
          </tbody>
        </table>
        <div className="res-callout">
          <span className="lbl">The pattern</span>
          <p>Everyone monetizes employers. <b>Nobody monetizes measurement</b>, and nobody sells the employer &ldquo;who could do this job that never applied.&rdquo; The revenue in this market flows B2B — exactly where our plan points.</p>
        </div>
      </section>

      {/* ── Data & scraping ─────────────────────────────────────── */}
      <section className="res-sec">
        <h2>Data &amp; scraping <span className="lbl">the corpus plan, in try-order</span></h2>
        <table className="res-table">
          <thead><tr><th>Source</th><th>Volume / cost</th><th>Posture</th><th>Verdict</th></tr></thead>
          <tbody>
            <tr><td><b>Job-Room</b> (job-room.ch, SECO)</td><td><b>71,702 ads</b>, free, full text, AVAM codes, language tags</td><td>Public endpoint the portal&rsquo;s own frontend uses; polite paging, capped, contact in User-Agent; SECO email in parallel — if they say stop, we stop</td><td><b>LIVE — the anchor</b></td></tr>
            <tr><td>Direct ATS crawl (CH tech offices)</td><td>thin but full text</td><td>Already our model (Greenhouse/Lever/Ashby)</td><td>do — feeds skills</td></tr>
            <tr><td>Careerjet CH locales</td><td>unknown; excerpts only</td><td>Terms make re-display the intended use; needs the (never-provisioned) key + IP allow-list</td><td>supplementary</td></tr>
            <tr><td>Apify bridge scrapers</td><td>10k+ plausible, small fees</td><td>Validation only, not permanent re-display</td><td>only if needed</td></tr>
            <tr><td>x28 API</td><td>~250k, commercial (pricing open)</td><td>Clean, licensed</td><td>gated fallback + partnership conversation</td></tr>
            <tr><td>jobs.ch scraping</td><td>—</td><td>ToS of our plausible future partner + UWG risk</td><td><b>refused</b></td></tr>
          </tbody>
        </table>
        <p className="res-lede">
          Architecture: <b>one corpus, sliced by country — no fork.</b> Skill relationships and the engine are shared;
          the 100-point demand <i>weights</i> are computed per-market once the CH slice clears the sample floor, with
          the global profile as a labeled fallback below it. Licence gates get a CH overlay from the SBFI
          reglementierte-Berufe list; mobility stays geography-labeled (BFS publishes Swiss occupational mobility as
          open data — a future upgrade); salaries per-country via Salarium. Site: same codebase, two front doors —
          pivothop.ch triggers the Swiss edition via the Host header; .com visitors from CH get a dismissible
          &ldquo;Zur Schweizer Ausgabe&rdquo; banner; hreflang interlinks both. Suggest, never force-redirect.
        </p>
      </section>

      {/* ── GTM, pricing, backlinks ─────────────────────────────── */}
      <section className="res-sec">
        <h2>Go-to-market <span className="lbl">Nadine&rsquo;s half of the company</span></h2>
        <ul className="res-notes">
          <li><span className="lbl">Who pays, sketch</span><b>Counselor seat</b> (outplacement/RAV): CHF 90–150/counselor/month — invisible against a CHF 15k mandate, priced to sign without procurement. <b>Employer concierge</b> (adjacent-talent shortlist): CHF 300–500 per shortlist, manual first. <b>B2C stays free</b> — the PDF report is the demo the counselor sees. Reference math: 10 seats + 2 concierge employers ≈ CHF 1,500–2,500/month, reachable through a dozen in-person conversations.</li>
          <li><span className="lbl">Outplacement target list</span>Grass &amp; Partner (Deutschschweiz establishment) · Alixio Mobility (ex-von Rundstedt, the modernizer) · LHH (Adecco) · Right Management (Manpower) · von Rohr &amp; Associates (Ostschweiz) · Dr. Nadig &amp; Partner (Zürich) · Mangold (Basel). Open in German, in person; the pitch is the instrument as counselor tooling.</li>
          <li><span className="lbl">RAV</span>Cantonal employment offices; legally mandated counseling with placement targets; they already operate Job-Room, so our data source is their data source. Start with one canton.</li>
          <li><span className="lbl">Backlinks — institutional, few but mighty</span><b>berufsberatung.ch</b> (the official national career portal — one link outweighs fifty blog mentions) · cantonal RAV resource pages · university career services · hrtoday.ch · Handelszeitung · startupticker.ch. Earned by the Swiss launch data-post (&ldquo;we measured every open Swiss position for what it actually demands&rdquo;) and by asking, in German, in person.</li>
          <li><span className="lbl">Press</span>hrtoday, Handelszeitung, NZZ economy desk; the Jobradar-style quarterly angle is proven appetite (x28 feeds NZZ already).</li>
        </ul>
      </section>

      {/* ── Kill criteria ───────────────────────────────────────── */}
      <section className="res-sec">
        <h2>Kill criteria <span className="lbl">agreed before the first hour is spent</span></h2>
        <table className="res-table">
          <thead><tr><th>Gate</th><th>Condition to continue</th><th>Otherwise</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Day 14</td><td>Job-Room access answered OR ≥10k CH postings flowing</td><td>pause; price x28 (cap CHF 300/mo)</td><td><b>passed day zero — 71,702 available</b></td></tr>
            <tr><td>Day 45</td><td>≥25k CH postings in corpus AND German titles mapping ≥55%</td><td>reassess scope (tech-only edition vs full market)</td><td><b>passed 2026-08-04, 41 days early</b> — 31k postings; AVAM crosswalk (56 official codes) + German title matcher map 12,056; ceiling is missing occupations (FaGe, machinists, drivers…), documented in the crosswalk&rsquo;s gap list</td></tr>
            <tr><td>Day 90</td><td>one Swiss B2B conversation showing pilot interest</td><td>revert to global-only (which never stopped running)</td><td>open — Nadine&rsquo;s gate</td></tr>
          </tbody>
        </table>
      </section>

      {/* ── SECO email ──────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>The SECO email <span className="lbl">ready to send — an: jobroom-api@seco.admin.ch</span></h2>
        <div className="res-warn" style={{ whiteSpace: 'pre-line' }}>
          <b>Betreff: Anfrage Lesezugriff Job-Room API, Arbeitsmarkt-Analyse</b>{'\n\n'}
          Guten Tag{'\n\n'}
          Wir bauen mit PivotHop (pivothop.ch, Schweizer Firma in Gründung) ein Analyse-Instrument für Berufswechsel:
          Es misst anhand echter Stellendaten, welche Berufe die vorhandenen Kompetenzen einer Person bereits
          erreichen, und was konkret fehlt. Zielgruppen sind Stellensuchende, Berufsberatung und Outplacement.{'\n\n'}
          Dafür möchten wir publizierte Stellenanzeigen aus dem Job-Room auswerten (reiner Lesezugriff, aggregierte
          Analyse, tägliche Aktualisierung, keine Weitergabe von Personendaten). Die API-Dokumentation unter
          api.job-room.ch beschreibt primär den Publikationskanal für Arbeitgeber; uns interessiert der korrekte, von
          Ihnen vorgesehene Weg für Lesezugriff.{'\n\n'}
          Können Sie uns sagen, welche Nutzungsbedingungen gelten und ob ein formeller Zugang möglich ist? Wir richten
          uns selbstverständlich nach Ihren Vorgaben.{'\n\n'}
          Freundliche Grüsse{'\n'}
          Nadine, PivotHop
        </div>
        <p className="res-lede">
          Anpassen und senden — Absender idealerweise eine @pivothop.com-Adresse. Zwei Zahlen, die wir bewusst als
          offen führen (nie schätzen): x28-Preise und die formellen Job-Room-Lesebedingungen. Diese Mail klärt die
          zweite.
        </p>
      </section>
    </div>
  );
}
