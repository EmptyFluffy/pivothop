/* Second-pass careers discovery for firms the main sweep could not resolve.
 * Slower and more patient: longer waits, footer-link scan, and the common
 * careers/vacancies/jobs subdomain probes that big practices use. */
import { chromium } from 'playwright';

const FIRMS = [
  ['Foster + Partners', 'https://www.fosterandpartners.com'],
  ['Snohetta', 'https://www.snohetta.com'],
  ['Ennead Architects', 'https://www.ennead.com'],
  ['Zaha Hadid Architects', 'https://www.zaha-hadid.com'],
  ['Heatherwick Studio', 'https://www.heatherwick.com'],
  ['Grimshaw', 'https://grimshaw.global'],
  ['SHoP Architects', 'https://www.shoparchitects.com'],
  ['Wolff Olins', 'https://www.wolffolins.com'],
  ['COLLINS', 'https://www.wearecollins.com'],
  ['Designit', 'https://www.designit.com'],
];
const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const browser = await chromium.launch();

for (const [name, home] of FIRMS) {
  const page = await browser.newPage({ userAgent: UA });
  let found = null, how = '';
  try {
    const r = await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(4000);
    if (!r || r.status() >= 400) throw new Error(`home HTTP ${r ? r.status() : 'none'}`);
    const cands = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => ({ href: a.href, label: (a.innerText || a.textContent || '').trim() }))
        .filter((l) => /career|vacan|job|join|opportunit|work.with.us/i.test(l.href + ' ' + l.label))
        .map((l) => l.href));
    const uniq = [...new Set(cands)];
    found = uniq.find((u) => /vacan|job/i.test(u)) || uniq[0] || null;
    if (found) how = 'homepage link';
  } catch (e) { how = 'home failed: ' + String(e.message).slice(0, 40); }

  if (!found) {
    const host = new URL(home).host.replace(/^www\./, '');
    for (const sub of ['careers', 'vacancies', 'jobs']) {
      const u = `https://${sub}.${host}/`;
      try {
        const r = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (r && r.status() < 400) { found = u; how = 'subdomain probe'; break; }
      } catch { /* no such subdomain */ }
    }
  }

  let jobs = 0;
  if (found) {
    try {
      await page.goto(found, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3500);
      found = page.url();
      const t = await page.evaluate(() => document.body.innerText);
      jobs = (t.match(/\b(architect|designer|engineer|manager|director|coordinator|intern|assistant|apply)\b/gi) || []).length;
    } catch { /* keep the url, jobs unknown */ }
  }
  console.log(`${name.padEnd(24)} jobs~${String(jobs).padStart(3)}  ${found || 'STILL NOT FOUND'}  (${how})`);
  await page.close();
}
await browser.close();
