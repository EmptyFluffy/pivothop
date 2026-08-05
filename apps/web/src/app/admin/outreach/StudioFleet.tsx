import fs from 'node:fs';
import path from 'node:path';
import directCfg from '../../../../../scraper/config/direct-companies.json';
import workdayCfg from '../../../../../scraper/config/workday-companies.json';
import personioCfg from '../../../../../scraper/config/personio-companies.json';

/* The scraped studio fleet, for the same reader as the outreach board: which
   firms we read directly, through which channel, and what each yielded on the
   last published board. Counts come from the live all-jobs.json, so a firm
   showing 0 is honest — either not hiring right now, or its page defeated the
   reader (the nightly log knows which). Config is the source of truth for WHO;
   the board is the source of truth for WHAT ARRIVED. */

type Row = { name: string; channel: string; url: string; live: number };

function liveCounts(): Map<string, number> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8'));
    const jobs: { company?: string; source?: string }[] = Array.isArray(raw) ? raw : raw.jobs ?? [];
    const m = new Map<string, number>();
    for (const j of jobs) {
      if (!j.company || !['direct', 'workday', 'personio'].includes(j.source ?? '')) continue;
      m.set(j.company, (m.get(j.company) ?? 0) + 1);
    }
    return m;
  } catch { return new Map(); }
}

export function StudioFleet() {
  const live = liveCounts();
  const rows: Row[] = [
    ...directCfg.companies.map((c) => ({ name: c.name, channel: 'direct (rendered + AI-read)', url: c.careers, live: live.get(c.name) ?? 0 })),
    ...workdayCfg.tenants.map((t) => ({ name: t.company, channel: 'workday API', url: `https://${t.tenant}.${t.wd}.myworkdayjobs.com/${t.site}`, live: live.get(t.company) ?? 0 })),
    ...personioCfg.tenants.map((t) => ({ name: t.company, channel: 'personio feed', url: `https://${t.tenant}.jobs.personio.com`, live: live.get(t.company) ?? 0 })),
  ].sort((a, b) => b.live - a.live || a.name.localeCompare(b.name));
  const withJobs = rows.filter((r) => r.live > 0).length;

  return (
    <details className="otr-prov">
      <summary><h2>Scraped studio fleet <span className="lbl">{rows.length} firms read nightly · {withJobs} yielding listings right now</span></h2></summary>
      <p className="adm-note">
        These firms&rsquo; openings are read by us directly &mdash; rendered careers pages with AI extraction, or their
        hosted-ATS feeds &mdash; because they publish on no aggregator. A zero is honest: not hiring, or the page beat the
        reader (the nightly log says which). Separate from the outreach targets below: these are already <i>on</i> the
        board; outreach targets are firms with no readable surface at all.
      </p>
      <table className="adm-table">
        <thead><tr><th>Firm</th><th>Channel</th><th>Live listings</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name + r.channel}>
              <td><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a></td>
              <td className="lbl">{r.channel}</td>
              <td>{r.live > 0 ? <b>{r.live}</b> : <span className="lbl">0</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
