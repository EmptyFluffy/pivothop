/* Nightly firm prospector: drains config/prospect-queue.json a few candidates
 * per run, renders each one, and auto-admits firms that pass the SAME rules the
 * manual waves apply by hand (docs/33). Admits land in
 * config/direct-companies-auto.json (read by sources/direct.js alongside the
 * curated file); every attempt is recorded in config/prospect-state.json so a
 * candidate is tried exactly once. Both files are tracked, so the nightly's
 * `git add -u` publishes admissions and state together with the data.
 *
 * The wave rules, encoded:
 *  - the careers link must live on the firm's OWN registrable domain
 *    (kills the Fentress->populous.com and Snask->mcdonalds junk-link class)
 *  - the landing URL itself must look careers-ish (/careers, /jobs, /join,
 *    /hiring, karriere, stellen, #jobs...) — an award page or news article
 *    that happens to say "architect" six times does not pass (Ross Barney)
 *  - a hosted-ATS signature is NEVER auto-admitted: namesakes are everywhere
 *    (recruitee:som was a call center). ATS hits are logged for manual
 *    sample-posting verification, per the standing rule.
 *  - zero open roles is fine if the page is a genuine careers page ("a zero
 *    can be honest"); the LLM extractor and the verify gate stand behind it.
 *
 *   node apps/scraper/scripts/prospect.mjs            # PROSPECT_PER_NIGHT=12
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CONFIG = path.join(ROOT, 'apps/scraper/config');
const QUEUE = path.join(CONFIG, 'prospect-queue.json');
const STATE = path.join(CONFIG, 'prospect-state.json');
const AUTO = path.join(CONFIG, 'direct-companies-auto.json');
const CURATED = path.join(CONFIG, 'direct-companies.json');
const PER_NIGHT = Number(process.env.PROSPECT_PER_NIGHT || 12);

const readJson = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };

const CAREERS_PATH = /career|vacan|job|join|hiring|opportunit|work-with|workwith|stellen|karriere|hiring|recruit/i;
const ATS_HOSTS = /myworkdayjobs\.com|personio|teamtailor|homerun\.co|applytojob|bamboohr|paylocity|hibob|greenhouse|lever\.co|recruitee|ashbyhq|workable|smartrecruiters|icims|jobvite|adp|dayforce|avature|slideroom/i;

// registrable domain, enough for the fleet's TLD mix (.com/.net/.co/.ch/.co.uk...)
function regDomain(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    const parts = h.split('.');
    const twoLevel = /^(co|com|org|net|ac|gov)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
    return parts.slice(twoLevel ? -3 : -2).join('.');
  } catch { return ''; }
}

const queue = readJson(QUEUE, []);
const state = readJson(STATE, { tried: {} });
const auto = readJson(AUTO, { companies: [] });
const curated = readJson(CURATED, { companies: [] });
const fleetDomains = new Set(
  [...curated.companies, ...auto.companies].map((c) => regDomain(c.careers)).filter(Boolean),
);

const batch = queue.filter(([name]) => !state.tried[name]).slice(0, PER_NIGHT);
if (!batch.length) {
  console.log('prospect: queue drained — top it up (config/prospect-queue.json)');
  process.exit(0);
}

const browser = await chromium.launch();
let admitted = 0;
for (const [name, home] of batch) {
  const rec = { date: new Date().toISOString().slice(0, 10), outcome: 'failed', detail: '' };
  state.tried[name] = rec;
  if (fleetDomains.has(regDomain(home))) { rec.outcome = 'duplicate'; console.log(`prospect: ${name.padEnd(28)} duplicate (already in fleet)`); continue; }
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)',
  });
  try {
    const r = await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 28000 });
    if (!r || r.status() >= 400) throw new Error('home HTTP ' + (r ? r.status() : 'none'));
    await page.waitForTimeout(2000);
    const cands = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => ({ href: a.href, label: (a.innerText || '').trim() }))
        .filter((l) => /career|vacan|job|join|opportunit|work with|hiring|offene stellen|stellen|karriere/i.test(l.href + ' ' + l.label))
        .map((l) => l.href));
    const target = [...new Set(cands)].sort((a, b) =>
      (/vacan|job|stellen|karriere|hiring/i.test(b) ? 1 : 0) - (/vacan|job|stellen|karriere|hiring/i.test(a) ? 1 : 0))[0];
    if (!target) { rec.outcome = 'no-careers-link'; await page.close(); continue; }
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 28000 }).catch(() => {});
    await page.waitForTimeout(2400);
    const landed = page.url();
    rec.detail = landed;
    const html = await page.content();
    const frames = page.frames().map((f) => f.url()).join(' ');
    if (ATS_HOSTS.test(landed) || ATS_HOSTS.test(frames) || ATS_HOSTS.test(html.slice(0, 200000))) {
      rec.outcome = 'ats-candidate';            // manual verification only — namesake rule
    } else if (regDomain(landed) !== regDomain(home)) {
      rec.outcome = 'off-domain';               // the junk-link class
    } else if (!CAREERS_PATH.test(new URL(landed).pathname + new URL(landed).hash)) {
      rec.outcome = 'not-careers-page';         // award pages, news articles, contact pages
    } else {
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      const jobs = (text.match(/\b(architekt|architect|designer|artist|engineer|producer|director|developer|intern|praktik|manager|lead)\b/gi) || []).length;
      auto.companies.push({ name, careers: landed.replace(/[?].*$/, ''), admitted: rec.date, jobsSignal: jobs });
      fleetDomains.add(regDomain(landed));
      rec.outcome = 'admitted';
      rec.detail = `${landed} jobs~${jobs}`;
      admitted++;
    }
  } catch (e) {
    rec.detail = String(e.message).slice(0, 60);
  }
  await page.close();
  console.log(`prospect: ${name.padEnd(28)} ${state.tried[name].outcome.padEnd(16)} ${state.tried[name].detail}`);
}
await browser.close();

fs.writeFileSync(AUTO, JSON.stringify(auto, null, 1));
fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
const remaining = queue.filter(([name]) => !state.tried[name]).length;
console.log(`prospect: ${batch.length} tried, ${admitted} admitted, auto-fleet ${auto.companies.length}, queue ${remaining} remaining`);
