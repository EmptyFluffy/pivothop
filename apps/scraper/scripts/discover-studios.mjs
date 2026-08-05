/* Generic studio careers discovery: renders each candidate's homepage, follows
 * the site's own careers link, reports landing URL + hosted-ATS signature + a
 * jobs signal. Candidates come from a JSON file (argv[2]): [["Name","https://…"],…]
 * — waves are data now, the runner is fixed. Only render-VERIFIED URLs enter
 * direct-companies.json; paid niche boards stay out (the jobs.ch rule).
 *   node apps/scraper/scripts/discover-studios.mjs waves/wave-N.json  */
import { chromium } from 'playwright';
import fs from 'node:fs';

const FIRMS = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const ATS = {
  workday: /([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com/,
  personio: /([a-z0-9-]+)\.jobs\.personio\./,
  teamtailor: /([a-z0-9-]+)\.teamtailor\.com/,
  homerun: /([a-z0-9-]+)\.homerun\.co/,
  jazzhr: /([a-z0-9-]+)\.applytojob\.com/,
  bamboohr: /([a-z0-9-]+)\.bamboohr\.com/,
  paylocity: /recruiting\.paylocity\.com/,
  hibob: /([a-z0-9-]+)\.careers\.hibob\.com/,
  greenhouse: /(?:boards|job-boards)\.greenhouse\.io\/([a-z0-9]+)/,
  lever: /jobs\.lever\.co\/([a-zA-Z0-9-]+)/,
  recruitee: /([a-z0-9-]+)\.recruitee\.com/,
  ashby: /jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/,
  workable: /apply\.workable\.com\/([a-z0-9-]+)/,
  smartrecruiters: /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9]+)/,
};
const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const browser = await chromium.launch();
const out = [];
for (const [name, home] of FIRMS) {
  const page = await browser.newPage({ userAgent: UA });
  const rec = { name, home, careers: null, ats: null, jobs: 0, note: '' };
  try {
    const r = await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 28000 });
    if (!r || r.status() >= 400) throw new Error('home HTTP ' + (r ? r.status() : 'none'));
    await page.waitForTimeout(2200);
    const cands = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => ({ href: a.href, label: (a.innerText || '').trim() }))
        .filter((l) => /career|vacan|job|join|opportunit|work with|hiring|offene stellen|stellen|karriere/i.test(l.href + ' ' + l.label))
        .map((l) => l.href));
    const target = [...new Set(cands)].sort((a, b) => (/vacan|job|stellen|karriere|hiring/i.test(b) ? 1 : 0) - (/vacan|job|stellen|karriere|hiring/i.test(a) ? 1 : 0))[0];
    if (!target) { rec.note = 'no careers link'; }
    else {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 28000 }).catch(() => {});
      await page.waitForTimeout(2600);
      rec.careers = page.url();
      const html = await page.content();
      const frames = page.frames().map((f) => f.url()).join(' ');
      for (const [k, re] of Object.entries(ATS)) {
        const m = (html + ' ' + frames + ' ' + rec.careers).match(re);
        if (m) { rec.ats = `${k}:${m[1] || ''}`; break; }
      }
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      rec.jobs = (text.match(/\b(architekt|architect|designer|animator|artist|engineer|producer|director|developer|intern|praktik|manager|lead)\b/gi) || []).length;
    }
  } catch (e) { rec.note = String(e.message).slice(0, 55); }
  await page.close();
  out.push(rec);
  console.error(`${rec.name.padEnd(26)} ats=${(rec.ats || '-').padEnd(22)} jobs~${String(rec.jobs).padStart(3)} ${rec.careers || rec.note}`);
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
