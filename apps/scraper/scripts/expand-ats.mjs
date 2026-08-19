// Probe candidate ATS board tokens and append the ones that answer with real
// postings. Public board APIs only, the same endpoints the drivers read.
// Greenhouse verifies the board's own name against the label (namesake rule);
// lever/ashby candidates are exact brand tokens, and a wrong guess simply 404s.
import fs from 'node:fs';

const GH = [
  ['Oscar Health','oscarhealth'],['Devoted Health','devotedhealth'],['Cityblock','cityblockhealth'],
  ['Tempus','tempus'],['Komodo Health','komodohealth'],['Chime','chime'],['Marqeta','marqeta'],
  ['Verkada','verkada'],['Benchling','benchling'],['Flexport','flexport'],['Procore','procoretechnologies'],
  ['Gusto','gusto'],['Airtable','airtable'],['Ramp','ramp'],['Brex','brex'],['Scale AI','scaleai'],
  ['Databricks','databricks'],['Duolingo','duolingo'],['Reddit','reddit'],['Discord','discord'],
  ['Instacart','instacart'],['Lyft','lyft'],['Affirm','affirm'],['Attentive','attentive'],
  ['Samsara','samsara'],['Grammarly','grammarly'],['Carta','carta'],['Rippling','rippling'],
  ['Faire','faire'],['Whatnot','whatnot'],['StockX','stockx'],['Zillow','zillowgroup'],
  ['DraftKings','draftkings'],['Datadog','datadog'],['MongoDB','mongodb'],['Elastic','elastic'],
  ['HashiCorp','hashicorp'],['Cloudflare','cloudflare'],['Asana','asana'],['Intercom','intercom'],
  ['Monzo','monzo'],['Deliveroo','deliveroo'],['Starling Bank','starlingbank'],['Checkout.com','checkout'],
  ['Skyscanner','skyscanner'],['Improbable','improbable'],['Babylon Health','babylonhealth'],
];
const LEVER = [
  ['Anduril','anduril'],['Plaid','plaid'],['Zoox','zoox'],['Octopus Energy','octopusenergy'],
  ['Kraken','kraken123'],['Mistral AI','mistral'],['Palmetto','palmetto'],['Nielsen','nielsen'],
  ['Veeva','veeva'],['Welocalize','welocalize'],['Voleon','voleon'],['Highspot','highspot'],
];
const ASHBY = [
  ['OpenAI','openai'],['Cursor','cursor'],['Perplexity','Perplexity-AI'],['Sierra','sierra'],
  ['Harvey','harvey'],['Mercury','mercury'],['Vanta','vanta'],['Deel','deel'],['Supabase','supabase'],
  ['Vercel','vercel'],['Linear','linear'],['Notion','notion'],['Retool','retool'],['Modal','modal'],
  ['Replit','replit'],['ElevenLabs','elevenlabs'],['Docker','docker'],['Posthog','posthog'],
];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function j(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); return r.ok ? await r.json() : null; }
  catch { return null; }
}

function load(file, key) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { d, list: d[key] };
}

const out = [];
{
  const { d, list } = load('config/greenhouse-companies.json', 'boards');
  const have = new Set(list.map(norm));
  for (const [label, token] of GH) {
    if (have.has(norm(token))) continue;
    await sleep(400);
    const root = await j(`https://boards-api.greenhouse.io/v1/boards/${token}`);
    if (!root?.name) { console.log(`gh  MISS  ${token}`); continue; }
    const nameOk = norm(root.name).includes(norm(label).slice(0, 6)) || norm(label).includes(norm(root.name).slice(0, 6));
    if (!nameOk) { console.log(`gh  NAME? ${token} board says "${root.name}" (skipped)`); continue; }
    const jobs = await j(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`);
    const n = jobs?.jobs?.length ?? 0;
    if (!n) { console.log(`gh  EMPTY ${token} ("${root.name}")`); continue; }
    list.push(token); have.add(norm(token));
    out.push(`greenhouse ${token} (${root.name}, ${n} jobs)`);
    console.log(`gh  ADD   ${token} — ${root.name}, ${n} jobs`);
  }
  fs.writeFileSync('config/greenhouse-companies.json', JSON.stringify(d, null, 1) + '\n');
}
{
  const d = JSON.parse(fs.readFileSync('config/lever-companies.json', 'utf8'));
  const key = 'companies';
  const have = new Set(d[key].map(norm));
  for (const [label, token] of LEVER) {
    if (have.has(norm(token))) continue;
    await sleep(400);
    const posts = await j(`https://api.lever.co/v0/postings/${token}?mode=json&limit=5`);
    const n = Array.isArray(posts) ? posts.length : 0;
    if (!n) { console.log(`lev MISS  ${token}`); continue; }
    d[key].push(token); have.add(norm(token));
    out.push(`lever ${token} (${label}, ${n}+ jobs)`);
    console.log(`lev ADD   ${token} — ${label}, ${n}+ jobs`);
  }
  fs.writeFileSync('config/lever-companies.json', JSON.stringify(d, null, 1) + '\n');
}
{
  const d = JSON.parse(fs.readFileSync('config/ashby-companies.json', 'utf8'));
  const key = 'companies';
  const have = new Set(d[key].map(norm));
  for (const [label, token] of ASHBY) {
    if (have.has(norm(token))) continue;
    await sleep(400);
    const body = await j(`https://api.ashbyhq.com/posting-api/job-board/${token}`);
    const n = body?.jobs?.length ?? 0;
    if (!n) { console.log(`ash MISS  ${token}`); continue; }
    d[key].push(token); have.add(norm(token));
    out.push(`ashby ${token} (${label}, ${n} jobs)`);
    console.log(`ash ADD   ${token} — ${label}, ${n} jobs`);
  }
  fs.writeFileSync('config/ashby-companies.json', JSON.stringify(d, null, 1) + '\n');
}
console.log(`\n${out.length} boards added`);
