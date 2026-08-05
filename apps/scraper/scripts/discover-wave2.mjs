/* Wave-2 careers discovery: boutique firms the ATS probe missed (correctly —
 * boutiques hire from their own sites). Renders each homepage, follows the
 * site's own careers link, reports the landing URL + any hosted-ATS signature
 * + a jobs signal. Only VERIFIED URLs enter direct-companies.json. */
import { chromium } from 'playwright';

const FIRMS = [
  // US boutique architecture
  ['KieranTimberlake', 'https://kierantimberlake.com'],
  ['Steven Holl Architects', 'https://www.stevenholl.com'],
  ['Diller Scofidio + Renfro', 'https://dsrny.com'],
  ['WEISS/MANFREDI', 'https://www.weissmanfredi.com'],
  ['Tod Williams Billie Tsien', 'https://twbta.com'],
  ['Bohlin Cywinski Jackson', 'https://bcj.com'],
  ['Lake|Flato', 'https://www.lakeflato.com'],
  ['Miller Hull', 'https://millerhull.com'],
  ['Mithun', 'https://mithun.com'],
  ['EHDD', 'https://ehdd.com'],
  ['WRNS Studio', 'https://www.wrnsstudio.com'],
  ['Johnston Marklee', 'https://www.johnstonmarklee.com'],
  ['Michael Maltzan Architecture', 'https://www.mmaltzan.com'],
  ['RAMSA', 'https://www.ramsa.com'],
  ['COOKFOX', 'https://cookfox.com'],
  ['FXCollaborative', 'https://www.fxcollaborative.com'],
  ['Marvel', 'https://marveldesigns.com'],
  ['WXY Studio', 'https://www.wxystudio.com'],
  ['Perkins Eastman', 'https://www.perkinseastman.com'],
  ['Ballinger', 'https://ballinger.com'],
  ['Cooper Carry', 'https://www.coopercarry.com'],
  ['Gould Evans', 'https://www.gouldevans.com'],
  ['Behnisch Architekten', 'https://behnisch.com'],
  ['Lake Flato', 'https://www.lakeflato.com'],
  ['Studio Ma', 'https://www.studioma.com'],
  ['Snohetta', 'https://www.snohetta.com'],
  // Swiss architecture + engineering
  ['Christ & Gantenbein', 'https://christgantenbein.com'],
  ['EM2N', 'https://www.em2n.ch'],
  ['Gigon/Guyer', 'https://www.gigon-guyer.ch'],
  ['Burckhardt Architektur', 'https://burckhardt.swiss'],
  ['Itten+Brechbuehl', 'https://www.ittenbrechbuehl.ch'],
  ['Diener & Diener', 'https://www.dienerdiener.ch'],
  ['Boltshauser Architekten', 'https://www.boltshauser.info'],
  ['Miller & Maranta', 'https://millermaranta.ch'],
  ['Buchner Bruendler', 'https://www.bbarc.ch'],
  ['Caruso St John', 'https://www.carusostjohn.com'],
  ['pool Architekten', 'https://www.poolarch.ch'],
  ['Theo Hotz Partner', 'https://www.theohotz.ch'],
  ['Baumschlager Eberle', 'https://www.baumschlager-eberle.com'],
  ['Basler & Hofmann', 'https://www.baslerhofmann.ch'],
  ['Emch+Berger', 'https://www.emchberger.ch'],
  ['Rapp AG', 'https://www.rapp.ch'],
  ['TBF + Partner', 'https://www.tbf.ch'],
  ['Enzmann Fischer', 'https://www.enzmannfischer.ch'],
  // Swiss digital
  ['Hinderling Volkart', 'https://hinderlingvolkart.com'],
  ['Liip', 'https://www.liip.ch'],
  ['Unic', 'https://www.unic.com'],
  ['Ginetta', 'https://ginetta.net'],
  ['Dreipol', 'https://www.dreipol.ch'],
  ['Feinheit', 'https://www.feinheit.ch'],
  ['Superhuit', 'https://superhuit.ch'],
  // EU design
  ['Studio Dumbar', 'https://studiodumbar.com'],
  ['Base Design', 'https://www.basedesign.com'],
  ['Ragged Edge', 'https://raggededge.com'],
  ['DixonBaxi', 'https://dixonbaxi.com'],
  ['Bakken & Baeck', 'https://bakkenbaeck.com'],
  ['Kurppa Hosk', 'https://kurppahosk.com'],
  ['Snask', 'https://snask.com'],
  // global architecture
  ['Kengo Kuma', 'https://kkaa.co.jp'],
  ['MAD Architects', 'https://www.i-mad.com'],
  ['Dorte Mandrup', 'https://dortemandrup.dk'],
  ['C.F. Moller', 'https://www.cfmoller.com'],
  ['White Arkitekter', 'https://whitearkitekter.com'],
  ['Powerhouse Company', 'https://www.powerhouse-company.com'],
  ['MVSA Architects', 'https://mvsa-architects.com'],
  ['Benthem Crouwel', 'https://www.benthemcrouwel.com'],
  ['Barcode Architects', 'https://www.barcodearchitects.com'],
  ['Carmody Groarke', 'https://www.carmodygroarke.com'],
  ['Feilden Fowles', 'https://www.feildenfowles.co.uk'],
  ['Stanton Williams', 'https://www.stantonwilliams.com'],
  ['WilkinsonEyre', 'https://www.wilkinsoneyre.com'],
];

const ATS = {
  workday: /([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com/,
  personio: /([a-z0-9-]+)\.jobs\.personio\./,
  teamtailor: /([a-z0-9-]+)\.teamtailor\.com/,
  homerun: /([a-z0-9-]+)\.homerun\.co/,
  jazzhr: /([a-z0-9-]+)\.applytojob\.com/,
  bamboohr: /([a-z0-9-]+)\.bamboohr\.com/,
  paylocity: /recruiting\.paylocity\.com\/recruiting\/jobs\/[A-Za-z]+\/([0-9]+)/,
  hibob: /([a-z0-9-]+)\.careers\.hibob\.com/,
  greenhouse: /(?:boards|job-boards)\.greenhouse\.io\/([a-z0-9]+)/,
  lever: /jobs\.lever\.co\/([a-zA-Z0-9-]+)/,
  recruitee: /([a-z0-9-]+)\.recruitee\.com/,
  ashby: /jobs\.ashbyhq\.com\/([a-zA-Z0-9-]+)/,
  workable: /apply\.workable\.com\/([a-z0-9-]+)/,
  smartrecruiters: /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9]+)/,
  dayforce: /jobs\.dayforcehcm\.com/,
  avature: /([a-z0-9-]+)\.avature\.net/,
};
const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const browser = await chromium.launch();
const out = [];
for (const [name, home] of FIRMS) {
  const page = await browser.newPage({ userAgent: UA });
  const rec = { name, home, careers: null, ats: null, jobs: 0, note: '' };
  try {
    const r = await page.goto(home, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!r || r.status() >= 400) throw new Error('home HTTP ' + (r ? r.status() : 'none'));
    await page.waitForTimeout(2500);
    const cands = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => ({ href: a.href, label: (a.innerText || '').trim() }))
        .filter((l) => /career|vacan|job|join|opportunit|work with|offene stellen|stellen|emploi|karriere/i.test(l.href + ' ' + l.label))
        .map((l) => l.href));
    const target = [...new Set(cands)].sort((a, b) => (/vacan|job|stellen|karriere/i.test(b) ? 1 : 0) - (/vacan|job|stellen|karriere/i.test(a) ? 1 : 0))[0];
    if (!target) { rec.note = 'no careers link found'; }
    else {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);
      rec.careers = page.url();
      const html = await page.content();
      const frames = page.frames().map((f) => f.url()).join(' ');
      for (const [k, re] of Object.entries(ATS)) {
        const m = (html + ' ' + frames + ' ' + rec.careers).match(re);
        if (m) { rec.ats = `${k}:${m[1] || ''}`; break; }
      }
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      rec.jobs = (text.match(/\b(architekt|architect|designer|ingenieur|engineer|zeichner|drafts|bim|projektleiter|manager|praktik|intern)\b/gi) || []).length;
    }
  } catch (e) { rec.note = String(e.message).slice(0, 60); }
  await page.close();
  out.push(rec);
  console.error(`${rec.name.padEnd(26)} ats=${(rec.ats || '-').padEnd(20)} jobs~${String(rec.jobs).padStart(3)} ${rec.careers || rec.note}`);
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
