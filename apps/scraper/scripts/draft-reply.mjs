#!/usr/bin/env node
// Reply/thread draft assistant. You paste a tweet (an invited "drop your SaaS"
// thread, or any relevant conversation) and this returns a few on-brand,
// value-first drafts that lead with a real PivotHop number instead of a bare
// link. It automates the WRITING, never the posting — you read the drafts, pick
// the good one, and post it yourself, only in threads where sharing is welcome.
//
// Why it works this way (docs/22, docs/09): the "build in public" crowd rewards
// substance and punishes drive-by self-promo. PivotHop's edge is that it has
// findings to lead with. So every draft opens with a measured number and treats
// the link as optional.
//
// Usage:
//   npm run draft -- "the tweet you're replying to"
//   echo "the tweet" | npm run draft
//   npm run draft -- --n=5 "tweet"          # more drafts
//   npm run draft -- --topic "tweet"        # print matched findings only (no LLM)
//
// With ANTHROPIC_API_KEY set it writes tailored drafts with Claude; without it,
// it surfaces your most relevant findings as scaffolds you finish by hand.

import process from 'node:process';

const SITE = 'https://www.pivothop.com';
const MODEL = 'claude-sonnet-5';

// The hook bank: PivotHop's uncopyable numbers, each with the page it proves.
// Lead a reply with the hook; link to the specific page, not the homepage.
const FINDINGS = [
  { tags: ['product manager', 'project manager', 'pm', 'title', 'role', 'confusing'], hook: 'A typical project manager’s skills cover only 24% of what product-manager postings demand. Same first word, different jobs.', link: '/compare/product-manager-vs-project-manager' },
  { tags: ['ux', 'graphic', 'design', 'designer', 'salary', 'pay'], hook: 'Graphic designers and UX designers share 13% of a skill set and a doubled salary band. The most expensively confused pair in design.', link: '/compare/graphic-designer-vs-ux-designer' },
  { tags: ['title', 'titles', 'job title', 'hiring', 'skills-based', 'skills based', 'resume', 'ats'], hook: 'This month’s job corpus: 42,254 distinct title strings that map to no real occupation, sitting on top of 177 that absorb 119k postings. Titles fragment; skills cluster.', link: '/blog/skills-over-titles' },
  { tags: ['data analyst', 'data scientist', 'data science', 'transition', 'switch', 'learn'], hook: 'A data scientist’s skills cover 65% of an analyst’s demand; an analyst covers 31% of a scientist’s. The ladder runs one way — 9 to 16 months, not a title change.', link: '/compare/data-analyst-vs-data-scientist' },
  { tags: ['product designer', 'ux', 'design', 'asymmetry'], hook: 'Product designer to UX reads 91% ready; UX to product designer only 40%. Two titles, one of which contains the other.', link: '/compare/product-designer-vs-ux-designer' },
  { tags: ['ai', 'llm', 'agents', 'jobs', 'automation', 'demand', 'gpt', 'claude'], hook: '4.9% of all job postings now demand LLM or agent skills — across 43 of 177 occupations, including lawyers, recruiters, and motion designers. The tooling already crossed the technical border.', link: '/blog/ai-jobs-three-ledgers' },
  { tags: ['ai', 'career', 'open', 'entry', 'new grad', 'break in', 'prompt engineer', 'conversation designer'], hook: 'The most skill-open doors in the market right now are the AI-era titles — conversation designer, prompt engineer, solutions architect. Young enough to have no credential wall, so they hire on demonstrated skill.', link: '/blog/skills-over-titles' },
  { tags: ['claude', 'chatgpt', 'google', 'index', 'privacy', 'share', 'noindex', 'seo', 'leak'], hook: 'Claude share chats hit Google search because they were BLOCKED from crawling — a blocked crawler never sees the noindex, so it indexes the link anyway. The whole industry keeps relearning this.', link: '/blog/claude-chats-google' },
  { tags: ['transferable', 'transfer', 'pivot', 'switch', 'career change', 'skills'], hook: 'Careers with the most exits at 45%+ readiness: sales engineer and operations manager (13 routes each), data scientist (12). A data core or a coordination core travels; one craft vocabulary doesn’t.', link: '/blog/skills-over-titles' },
  { tags: ['skills', 'transferable', 'anywhere', 'myth', 'overlap'], hook: '55% of the 3,521 career pairs we score sit under 20% overlap. "Your skills can take you anywhere" is mostly false — which is exactly why the specific ones are worth measuring.', link: '/blog/skills-over-titles' },
  { tags: ['recruiter', 'ghost', 'ghosted', 'application', 'applying', 'job search', 'apply'], hook: 'More applications is the wrong answer to getting ghosted — the math is in the piece. Fewer, closer-fit roles beat volume.', link: '/blog/why-recruiters-ghost' },
  { tags: ['bridge', 'learn', 'upskill', 'which skill', 'data analysis', 'sql'], hook: 'The market’s reserve-currency skill: data analysis appears in the top-20 demand of 62 of 177 occupations. LLM tooling is already in a third. Learn the bridge skill before the niche one.', link: '/blog/skills-over-titles' },
  { tags: ['nurse', 'np', 'license', 'healthcare', 'credential'], hook: 'A registered nurse reads 94% ready for nurse-practitioner work on skills alone — and none of that shortens the graduate degree and license between the titles. Skills open the door; credentials own the lock.', link: '/compare/nurse-practitioner-vs-registered-nurse' },
];

// ── input ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const nFlag = Number((args.find((a) => a.startsWith('--n=')) || '').split('=')[1]) || 3;
const topicOnly = args.includes('--topic');
let tweet = args.filter((a) => !a.startsWith('--')).join(' ').trim();
if (!tweet && !process.stdin.isTTY) tweet = await new Promise((res) => { let s = ''; process.stdin.on('data', (d) => (s += d)); process.stdin.on('end', () => res(s.trim())); });
if (!tweet) {
  console.error('Usage: npm run draft -- "the tweet you\'re replying to"   (or pipe it on stdin)');
  process.exit(1);
}

// ── match findings to the tweet ────────────────────────────────────────────────
const words = new Set(tweet.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
const scored = FINDINGS.map((f) => {
  let s = 0;
  for (const t of f.tags) if (t.includes(' ') ? tweet.toLowerCase().includes(t) : words.has(t)) s += t.includes(' ') ? 3 : 1;
  return { f, s };
}).sort((a, b) => b.s - a.s);
// top matches, then top up with strong evergreen hooks so there's always material
const picks = [];
for (const { f, s } of scored) { if (s > 0 && picks.length < 6) picks.push(f); }
for (const { f } of scored) { if (picks.length >= 6) break; if (!picks.includes(f)) picks.push(f); }

const RULES = `Voice (non-negotiable, from the PivotHop style guide):
- Lead with the number. The hook is the finding, never "check out my site".
- No exclamation points. No motivational words (unlock, supercharge, empower, journey, level up, elevate, unleash). No emoji unless one is genuinely deadpan.
- Deadpan, specific, numbers over adjectives. If a line could appear on any career-tech account, cut it.
- One link at most, and it points to the specific page for the finding, not the homepage. The link is optional — a reply that's pure finding is fine.
- Each draft must take a DIFFERENT angle (the raw stat / a contrarian read / a "we measured it" authority note) and read as a natural reply to the tweet, not a broadcast.
- Under 280 characters including the link.`;

function scaffolds() {
  console.log(`\nTweet:\n  "${tweet}"\n`);
  console.log(`Your most relevant findings (lead a reply with one; ${topicOnly ? 'topic mode' : 'no ANTHROPIC_API_KEY set, so scaffolds only'}):\n`);
  picks.slice(0, nFlag).forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.hook}`);
    console.log(`     link if it fits: ${SITE}${f.link}\n`);
  });
  console.log('Finish each in your own voice: open with the number, answer the tweet, drop the link only if it adds proof.');
}

async function withClaude() {
  const prompt = `You draft replies for PivotHop (a career-navigation instrument that measures skill overlap between jobs from live postings) on X / tech-Twitter.

Someone posted this tweet:
"""${tweet}"""

Write ${nFlag} distinct reply drafts. Ground each in ONE of these real PivotHop findings (use the numbers exactly; pick the ones most relevant to the tweet):
${picks.map((f, i) => `${i + 1}. ${f.hook}  [link: ${SITE}${f.link}]`).join('\n')}

${RULES}

Return ONLY the drafts, numbered, each on its own block with its character count in brackets after it, like:
1. <draft text>  [chars: 172]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) { console.error(`Claude API ${res.status} — falling back to scaffolds.\n`); scaffolds(); return; }
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? '';
  console.log(`\nTweet:\n  "${tweet}"\n\nDrafts (pick one, post it yourself, only in threads where sharing is welcome):\n`);
  console.log(text.trim());
}

console.log('─'.repeat(70));
if (!topicOnly && process.env.ANTHROPIC_API_KEY) await withClaude();
else scaffolds();
console.log('\n' + '─'.repeat(70));
console.log('Post discipline: invited "drop your X" threads and relevant conversations only.');
console.log('Never the same text twice, never at unrelated accounts. Lead with the finding, not the funnel.');
