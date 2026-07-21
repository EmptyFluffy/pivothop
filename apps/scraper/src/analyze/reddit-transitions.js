import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { CONFIG_DIR, GENERATED_DIR } from '../lib/paths.js';
import { matchOccupationInText } from '../normalize/disciplines.js';

// Reddit career-change testimony miner (docs/15, Thread 6). The closest FREE thing to
// real behavioral flow: people literally write "I went from architecture to UX." This is
// the signal that finally captures the non-obvious, human moves O*NET and skill-overlap
// both miss. Uses Reddit's official OAuth API (read-only, application-only token) — needs
// REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET in .env (free app at reddit.com/prefs/apps).
//
// Extraction is deliberately conservative: only "from X to Y" testimony where BOTH X and Y
// map to our occupation taxonomy is counted. Regex + taxonomy matching, no LLM dependency —
// noisier phrasing is left on the floor rather than guessed at.

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const UA = 'PivotHopResearch/0.1 (career-adjacency research; contact cvinocoura@gmail.com)';
const MIN_EDGE = 2;

async function appToken() {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': UA,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Reddit token: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

// "... from <A> to <B> ..." — capture a bounded window each side, then find the occupation
// within it (tolerating trailing words). Boundary words/punctuation close the second side.
const FROM_TO = /\b(?:from|was|were|been)\s+(?:an?\s+)?([a-z][a-z /-]{2,30}?)\s+(?:to|into)\s+(?:a\s+|an\s+|being\s+)?([a-z][a-z /-]{2,30}?)(?:[.,;:!?]| and | but | because | since | after | when | now\b| where | who | which |$)/gi;

function extractPairs(text) {
  const pairs = [];
  for (const m of text.matchAll(FROM_TO)) {
    const a = matchOccupationInText(m[1]), b = matchOccupationInText(m[2]);
    if (a && b && a !== b) pairs.push([a, b]);
  }
  return pairs;
}

export async function redditTransitions({ log }) {
  const token = await appToken();
  if (!token) { log('analyze:reddit — skipped: set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env (free app at reddit.com/prefs/apps, type "script")'); return null; }
  const cfg = readJson(path.join(CONFIG_DIR, 'reddit.json'));
  const headers = { authorization: `Bearer ${token}`, 'user-agent': UA };

  const edge = new Map(); // `${origin}->${dest}` -> count
  let posts = 0, hits = 0;
  for (const sub of cfg.subreddits) {
    for (const phrase of cfg.phrases) {
      const url = `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(`"${phrase}"`)}&restrict_sr=1&limit=100&sort=relevance&t=all`;
      let body;
      try {
        const res = await fetch(url, { headers });
        if (res.status === 429) { await new Promise((r) => setTimeout(r, 3000)); continue; }
        if (!res.ok) { log(`  r/${sub} "${phrase}" — HTTP ${res.status}`); continue; }
        body = await res.json();
      } catch (err) { log(`  r/${sub} "${phrase}" — ${err.message}`); continue; }
      for (const c of body?.data?.children ?? []) {
        const p = c.data;
        posts++;
        const text = `${p.title ?? ''}. ${p.selftext ?? ''}`.toLowerCase();
        for (const [origin, dest] of extractPairs(text)) {
          edge.set(`${origin}->${dest}`, (edge.get(`${origin}->${dest}`) ?? 0) + 1);
          hits++;
        }
      }
      await new Promise((r) => setTimeout(r, 700)); // polite ~85 req/min under the 100 QPM cap
    }
  }

  const byOrigin = {};
  for (const [key, count] of edge) {
    if (count < MIN_EDGE) continue;
    const [origin, dest] = key.split('->');
    (byOrigin[origin] ??= []).push({ dest, count });
  }
  for (const k of Object.keys(byOrigin)) {
    const max = Math.max(...byOrigin[k].map((r) => r.count));
    byOrigin[k] = byOrigin[k].map((r) => ({ ...r, score: Math.round(100 * r.count / max) })).sort((a, b) => b.score - a.score).slice(0, 12);
  }

  writeJson(path.join(GENERATED_DIR, 'reddit-transitions.json'), {
    $comment: 'Self-reported career transitions mined from Reddit ("I went from X to Y"), both sides mapped to the taxonomy. The closest free proxy for real behavioral flow; captures non-obvious human moves. docs/15 Thread 6.',
    posts_scanned: posts, testimony_edges: hits, origins: byOrigin,
  });
  log(`analyze:reddit — ${hits} transition testimonies from ${posts} posts across ${cfg.subreddits.length} subs → ${Object.keys(byOrigin).length} origins`);
  if (byOrigin['architect']) log(`  architect → ${byOrigin['architect'].slice(0, 6).map((r) => `${r.dest}(${r.score})`).join(', ')}`);
  return byOrigin;
}
