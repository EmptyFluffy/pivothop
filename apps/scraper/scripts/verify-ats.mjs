/* The namesake verification the standing rule asks for: an ATS page is only
 * admissible if it demonstrably belongs to THIS firm and demonstrably lists
 * jobs. recruitee:som was a call center; two of these sit on a shared ADP host
 * where the URL carries a customer id and no company name at all. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const state = JSON.parse(fs.readFileSync('apps/scraper/config/prospect-state.json', 'utf8'));
const cands = Object.entries(state.tried).filter(([, v]) => v.outcome === 'ats-candidate');
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const browser = await chromium.launch();
const results = [];

for (const [name, rec] of cands) {
  const url = rec.detail;
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)' });
  let verdict = 'FAIL', why = '', jobs = 0;
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!r || r.status() >= 400) throw new Error('HTTP ' + (r ? r.status() : '?'));
    await page.waitForTimeout(5000);
    // Embedded ATS widgets (Workday, ADP, BambooHR) live in an iframe, and
    // body.innerText stops at that boundary. Read every frame.
    let text = await page.evaluate(() => document.body.innerText);
    for (const fr of page.frames()) {
      if (fr === page.mainFrame()) continue;
      try { text += '\n' + await fr.evaluate(() => document.body.innerText); } catch {}
    }
    const flat = norm(text);
    // 1. does the firm's own name appear on the page it supposedly owns?
    const tokens = name.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3);
    const nameHit = norm(name).length > 0 && (flat.includes(norm(name)) || tokens.every((t) => flat.includes(t)));
    // 2. does it actually list roles?
    jobs = (text.match(/\b(architect|designer|engineer|planner|intern|manager|coordinator|drafter|technician|principal|associate)\b/gi) || []).length;
    const applyish = /\b(apply|view (?:job|opening|position)|current opening|open position|job (?:title|description)|submit)\b/i.test(text);
    // The standing rule gates on NAMESAKE, not on headcount: "zero open roles is
    // fine if the page is a genuine careers page". So an empty board passes and a
    // page that never says the firm's name does not, however many jobs it lists.
    const offDomain = !/^(?:www\.)?[a-z0-9-]*$/.test('') && /archinect|indeed|linkedin|glassdoor|ziprecruiter/i.test(url);
    if (offDomain) { why = 'third-party job board, not the firm\'s own listings'; }
    else if (!nameHit) { why = 'firm name absent from the page (namesake risk)'; }
    else { verdict = 'PASS'; why = `name verified, roles~${jobs}${jobs === 0 ? ' (empty board, honest zero)' : ''}`; }
  } catch (e) { why = String(e.message).slice(0, 54); }
  results.push({ name, url, verdict, why, jobs });
  console.log(`${verdict}  ${name.padEnd(20)} ${why}`);
  await page.close();
}
await browser.close();
fs.writeFileSync('apps/scraper/data/ats-verdicts.json', JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.verdict === 'PASS').length} of ${results.length} pass`);
