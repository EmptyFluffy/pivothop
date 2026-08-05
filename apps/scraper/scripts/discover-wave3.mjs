/* Wave-3 careers discovery: the SMALL boutiques. Same contract as wave 2 —
 * render the homepage, follow the site's own careers link, report the landing
 * URL + ATS signature + a jobs signal; only verified URLs enter the config.
 * Paid niche boards (Dezeen Jobs, world-architects, Hochparterre) are NOT
 * candidates: employer-paid boards are the jobs.ch case — plausible partners,
 * not scrape targets. */
import { chromium } from 'playwright';

const FIRMS = [
  // US small/celebrated architecture
  ['SO-IL', 'https://so-il.org'],
  ['MOS Architects', 'https://mos.nyc'],
  ['WORKac', 'https://work.ac'],
  ['MASS Design Group', 'https://massdesigngroup.org'],
  ['LEVER Architecture', 'https://leverarchitecture.com'],
  ['Allied Works', 'https://alliedworks.com'],
  ['Marmol Radziner', 'https://www.marmol-radziner.com'],
  ['Rios', 'https://www.rios.com'],
  ['Eskew Dumez Ripple', 'https://www.eskewdumezripple.com'],
  ['BNIM', 'https://www.bnim.com'],
  ['El Dorado', 'https://eldoradoarchitects.com'],
  ['Bora Architects', 'https://bora.co'],
  ['Hacker Architects', 'https://hackerarchitects.com'],
  ['Skylab', 'https://skylabarchitecture.com'],
  ['Graham Baba', 'https://grahambabaarchitects.com'],
  ['MW Works', 'https://mwworks.com'],
  ['Wheeler Kearns', 'https://wkarch.com'],
  ['Ross Barney Architects', 'https://www.r-barc.com'],
  ['MSR Design', 'https://msrdesign.com'],
  ['Quinn Evans', 'https://www.quinnevans.com'],
  ['GBBN', 'https://www.gbbn.com'],
  ['Trahan Architects', 'https://www.trahanarchitects.com'],
  ['Leong Leong', 'https://leong-leong.com'],
  ['Only If', 'https://only-if.co'],
  // US landscape
  ['SWA Group', 'https://www.swagroup.com'],
  ['OLIN', 'https://www.theolinstudio.com'],
  ['Field Operations', 'https://www.fieldoperations.net'],
  ['SCAPE', 'https://www.scapestudio.com'],
  ['Reed Hilderbrand', 'https://www.reedhilderbrand.com'],
  ['Stoss Landscape Urbanism', 'https://www.stoss.net'],
  // UK small practice
  ['Haworth Tompkins', 'https://www.haworthtompkins.com'],
  ['Mikhail Riches', 'https://www.mikhailriches.com'],
  ['6a architects', 'https://6a.co.uk'],
  ['Sergison Bates', 'https://sergisonbates.com'],
  ['DSDHA', 'https://dsdha.co.uk'],
  ['Peter Barber Architects', 'https://peterbarberarchitects.com'],
  ['Jestico + Whiles', 'https://www.jesticowhiles.com'],
  ['Bennetts Associates', 'https://www.bennettsassociates.com'],
  ['FCBStudios', 'https://fcbstudios.com'],
  ['Cullinan Studio', 'https://cullinanstudio.com'],
  ['Sheppard Robson', 'https://www.sheppardrobson.com'],
  ['Morris+Company', 'https://morrisand.company'],
  ['Karakusevic Carson', 'https://karakusevic-carson.com'],
  ['Maccreanor Lavington', 'https://www.maccreanorlavington.com'],
  ['Pollard Thomas Edwards', 'https://pollardthomasedwards.co.uk'],
  ['Levitt Bernstein', 'https://www.levittbernstein.co.uk'],
  ['Squire & Partners', 'https://squireandpartners.com'],
  ['PLP Architecture', 'https://plparchitecture.com'],
  ['Scott Brownrigg', 'https://www.scottbrownrigg.com'],
  ['TP Bennett', 'https://www.tpbennett.com'],
  ['dRMM', 'https://drmm.co.uk'],
  ['Gort Scott', 'https://gortscott.com'],
  ['We Made That', 'https://www.wemadethat.co.uk'],
  // Nordics
  ['Cobe', 'https://www.cobe.dk'],
  ['EFFEKT', 'https://www.effekt.dk'],
  ['AART', 'https://aart.dk'],
  ['Adept', 'https://www.adept.dk'],
  ['Lundgaard & Tranberg', 'https://www.ltarkitekter.dk'],
  ['Tham & Videgard', 'https://www.thamvidegard.se'],
  ['Wingardhs', 'https://wingardhs.se'],
  ['Reiulf Ramstad', 'https://www.reiulframstadarkitekter.com'],
  ['Lund Hagem', 'https://lundhagem.no'],
  ['Mad arkitekter', 'https://mad.no'],
  // DE/AT
  ['Sauerbruch Hutton', 'https://www.sauerbruchhutton.de'],
  ['Barkow Leibinger', 'https://barkowleibinger.com'],
  ['GRAFT', 'https://graftlab.com'],
  ['HENN', 'https://www.henn.com'],
  ['kadawittfeld', 'https://www.kadawittfeldarchitektur.de'],
  ['Delugan Meissl', 'https://www.dmaa.at'],
  ['Querkraft', 'https://www.querkraft.at'],
  // Swiss small practice
  ['Karamuk Kuo', 'https://karamukkuo.com'],
  ['Nightnurse Images', 'https://nightnurse.ch'],
  ['Raffinerie', 'https://raffinerie.com'],
  ['Studio Feixen', 'https://www.studiofeixen.ch'],
  ['NORM Zurich', 'https://norm.to'],
  ['Penzel Valier', 'https://www.penzelvalier.ch'],
  ['Oxid Architektur', 'https://www.oxid.archi'],
  // motion / brand boutiques
  ['Buck', 'https://buck.co'],
  ['Oddfellows', 'https://oddfellows.tv'],
  ['Gunner', 'https://gunner.works'],
  ['Giant Ant', 'https://giantant.ca'],
  ['ManvsMachine', 'https://mvsm.com'],
  ['Golden Wolf', 'https://goldenwolf.tv'],
  ['Art&Graft', 'https://www.artandgraft.com'],
  ['Animade', 'https://animade.tv'],
  ['Territory Studio', 'https://territorystudio.com'],
  ['DIA Studio', 'https://dia.tv'],
  ['Porto Rocha', 'https://portorocha.com'],
  ['Gretel', 'https://gretelny.com'],
  ['Trollback', 'https://www.trollback.com'],
  ['Sibling Rivalry', 'https://siblingrivalry.studio'],
  ['Franklyn', 'https://franklyn.co'],
  ['Hello Monday', 'https://www.hellomonday.com'],
  ['Active Theory', 'https://activetheory.net'],
  ['Resn', 'https://resn.co.nz'],
  ['North Kingdom', 'https://www.northkingdom.com'],
  ['Your Majesty', 'https://yourmajesty.co'],
];

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
