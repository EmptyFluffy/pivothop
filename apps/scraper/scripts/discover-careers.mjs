/* Find each studio's REAL careers URL, by rendering its homepage and following
 * the site's own careers link, then report what the destination runs on (hosted
 * ATS or custom) and whether listings are actually visible after render.
 *
 * WHY THIS EXISTS. direct-companies.json was first written from PATTERN-GUESSED
 * URLs (/careers, /jobs) that nobody verified. Measured 2026-08-03: many were
 * wrong — fosterandpartners.com/careers is a 404 whose SPA shell still returns
 * 73KB, so a static fetch looked like a healthy page and the extractor honestly
 * reported "0 open positions". A confident zero from a dead URL is exactly the
 * silent-failure class this project keeps relearning: verify the artifact, not
 * the gate. Real answers found here: HOK is /people/careers/, Studio Gang is
 * /opportunities/, Herzog & de Meuron is /practice/jobs/, Foster's vacancies
 * live on a separate subdomain entirely.
 *
 * Run it after editing direct-companies.json, and periodically — studios
 * reorganise their sites, and a moved careers page fails silently otherwise:
 *   node apps/scraper/scripts/discover-careers.mjs > /tmp/careers-map.json
 *
 * Firms that report an `ats` should MOVE to that deterministic adapter
 * (workday/homerun/etc.) and leave the LLM path: cheaper, and it cannot
 * hallucinate. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const FIRMS = JSON.parse(fs.readFileSync('/Users/carlos/PivotHop/apps/scraper/config/direct-companies.json', 'utf8')).companies;

const ATS = {
  workday: /([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com/,
  teamtailor: /([a-z0-9-]+)\.teamtailor\.com/,
  personio: /([a-z0-9-]+)\.jobs\.personio\./,
  bamboohr: /([a-z0-9-]+)\.bamboohr\.com/,
  homerun: /([a-z0-9-]+)\.homerun\.co/,
  pinpoint: /([a-z0-9-]+)\.pinpointhq\.com/,
  jazzhr: /([a-z0-9-]+)\.applytojob\.com/,
  jobvite: /jobs\.jobvite\.com\/([a-z0-9-]+)/i,
  icims: /([a-z0-9-]+)\.icims\.com/,
  greenhouse: /(?:boards|job-boards)\.greenhouse\.io\/([a-z0-9]+)|greenhouse\.io\/embed\/job_board\?for=([a-z0-9]+)/,
  lever: /jobs\.lever\.co\/([a-zA-Z0-9-]+)/,
  recruitee: /([a-z0-9-]+)\.recruitee\.com/,
  ashby: /jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/,
  workable: /apply\.workable\.com\/([a-z0-9-]+)/,
  smartrecruiters: /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9]+)/,
  successfactors: /([a-z0-9-]+)\.(?:successfactors|sapsf)\.(?:com|eu)/,
  eploy: /([a-z0-9-]+)\.eploy\.net/,
  hirehive: /([a-z0-9-]+)\.hirehive\.com/,
};

const out = [];
const browser = await chromium.launch();
for (const { name, careers } of FIRMS) {
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)' });
  const rec = { name, configured: careers, real: null, ats: null, jobsVisible: 0, note: '' };
  try {
    const origin = new URL(careers).origin;
    // 1. does the configured URL work and show jobs?
    let ok = false;
    try {
      const r = await page.goto(careers, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2500);
      const t = await page.evaluate(() => document.body.innerText);
      ok = r && r.status() < 400 && !/404|page not found/i.test(t.slice(0, 400));
    } catch { ok = false; }

    // 2. from the homepage, find the site's own careers link
    let target = ok ? careers : null;
    if (!ok) {
      try {
        await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1500);
        const cand = await page.evaluate(() =>
          [...document.querySelectorAll('a')]
            .map((a) => ({ href: a.href, label: (a.innerText || '').trim() }))
            .filter((l) => /career|vacan|job|join us|work with us|opportunit/i.test(l.href + ' ' + l.label))
            .map((l) => l.href));
        target = [...new Set(cand)].sort((a, b) => (/vacan|job/i.test(b) ? 1 : 0) - (/vacan|job/i.test(a) ? 1 : 0))[0] || null;
        rec.note = ok ? '' : 'configured URL dead, found via homepage';
      } catch { /* homepage unreachable */ }
    }

    if (target) {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(3000);
      rec.real = page.url();
      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      // hosted ATS signature anywhere on the rendered page (incl. iframes/links)
      const frames = page.frames().map((f) => f.url()).join(' ');
      for (const [k, re] of Object.entries(ATS)) {
        const m = (html + ' ' + frames + ' ' + rec.real).match(re);
        if (m) { rec.ats = `${k}:${m.slice(1).filter(Boolean)[0] || ''}`; break; }
      }
      // crude job-listing signal: repeated role nouns in the rendered text
      rec.jobsVisible = (text.match(/\b(architect|designer|engineer|manager|director|coordinator|technologist|intern|assistant)\b/gi) || []).length;
    }
  } catch (e) { rec.note = 'error: ' + String(e.message).slice(0, 60); }
  await page.close();
  out.push(rec);
  console.error(`${rec.name.padEnd(26)} ats=${(rec.ats || '-').padEnd(22)} jobs~${String(rec.jobsVisible).padStart(3)}  ${rec.real || 'NOT FOUND'}`);
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
