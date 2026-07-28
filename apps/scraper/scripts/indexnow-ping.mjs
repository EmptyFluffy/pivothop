#!/usr/bin/env node
// IndexNow ping — push-notify Bing/Yandex (and via them DuckDuckGo + the
// engines behind AI search) when deployed content changes. Runs after a deploy
// (daily-run.sh). Key file: apps/web/public/<key>.txt — must live at the root.
//
// Submits only the URLs that actually changed, read from the sitemap's per-page
// <lastmod> (build-lastmod.py advances a date only on a real content change).
// This used to fire the entire sitemap every night, which is the same "all
// 1,800 pages changed again" noise that makes a crawler stop believing the
// signal — IndexNow is explicitly for "these specific URLs changed".
//
//   node indexnow-ping.mjs            # today's changes
//   node indexnow-ping.mjs --all      # everything (use after a structural change)
//   node indexnow-ping.mjs --since 2026-07-25

const HOST = 'www.pivothop.com';
const KEY = '04ffb55f0e7c065d607a0bb9d91de160';
const MAX = 10000;

const argv = process.argv.slice(2);
const all = argv.includes('--all');
const sinceArg = argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null;
const since = sinceArg || new Date().toISOString().slice(0, 10);

const res = await fetch(`https://${HOST}/sitemap.xml`);
if (!res.ok) { console.error(`indexnow: sitemap fetch ${res.status}`); process.exit(1); }
const xml = await res.text();

// Pair each <loc> with the <lastmod> in the same <url> block.
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
  const block = m[1];
  return {
    url: (block.match(/<loc>([^<]+)<\/loc>/) || [])[1],
    lastmod: (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || null,
  };
}).filter((e) => e.url);

if (!entries.length) { console.error('indexnow: no URLs in sitemap'); process.exit(1); }

const urls = (all ? entries : entries.filter((e) => e.lastmod && e.lastmod.slice(0, 10) >= since))
  .map((e) => e.url)
  .slice(0, MAX);

if (!urls.length) {
  console.log(`indexnow: nothing changed on or after ${since} — nothing submitted`);
  process.exit(0);
}

const ping = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
// 200 = accepted, 202 = accepted-pending-key-verification; both are success.
console.log(`indexnow: submitted ${urls.length}/${entries.length} URLs`
  + (all ? ' (--all)' : ` changed since ${since}`) + ` — HTTP ${ping.status}`);
process.exit(ping.status === 200 || ping.status === 202 ? 0 : 1);
