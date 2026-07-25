#!/usr/bin/env node
// IndexNow ping — push-notify Bing/Yandex (and via them DuckDuckGo + the
// engines behind AI search) whenever the deployed content changes. Runs after
// a deploy (daily-run.sh); the whole sitemap goes in one batch (cap 10k).
// Key file: apps/web/public/<key>.txt — must be live at the site root.

const HOST = 'www.pivothop.com';
const KEY = '04ffb55f0e7c065d607a0bb9d91de160';

const res = await fetch(`https://${HOST}/sitemap.xml`);
if (!res.ok) { console.error(`indexnow: sitemap fetch ${res.status}`); process.exit(1); }
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
if (!urls.length) { console.error('indexnow: no URLs in sitemap'); process.exit(1); }

const ping = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
// 200 = accepted, 202 = accepted-pending-key-verification; both are success.
console.log(`indexnow: submitted ${urls.length} URLs — HTTP ${ping.status}`);
process.exit(ping.status === 200 || ping.status === 202 ? 0 : 1);
