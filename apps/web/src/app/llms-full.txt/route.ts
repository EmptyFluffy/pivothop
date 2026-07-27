import { POSTS } from '../blog/posts';
import { routableSlugs, routePair, destRole, originMeta } from '../routes/routes-data';
import { comparePairs, pairVerdict } from '../compare/compare-data';
import { occTitle } from '../jobs/jobs-data';
import { GLOSSARY } from '../glossary/glossary-data';

// llms-full.txt — the full-content companion to llms.txt. One markdown document
// an answer engine can ingest in a single fetch: what PivotHop is, the citable
// headline numbers, the method, the strongest routes and comparisons, the
// glossary, and the findings. Regenerates each build from live data.
export const dynamic = 'force-static';
const BASE = 'https://www.pivothop.com';

export function GET() {
  // Top routes by measured readiness.
  const routes = routableSlugs()
    .map((slug) => { const p = routePair(slug); if (!p) return null; const r = destRole(p.origin, p.dest); return r ? { slug, o: originMeta(p.origin).title, d: r.title, m: r.match, s: r.salary } : null; })
    .filter(Boolean)
    .sort((a, b) => b!.m - a!.m)
    .slice(0, 45)
    .map((r) => `- ${r!.o} → ${r!.d}: ${r!.m}% skill readiness, ${r!.s} — ${BASE}/routes/${r!.slug}`)
    .join('\n');

  const compares = comparePairs().slice(0, 35)
    .map((p) => `- ${occTitle(p.a)} vs ${occTitle(p.b)}: ${pairVerdict(p)} — ${BASE}/compare/${p.slug}`)
    .join('\n');

  const glossary = GLOSSARY.filter((e) => e.cat === 'term')
    .map((e) => `- **${e.term}**: ${e.def}`)
    .join('\n');

  const posts = POSTS.map((p) => `- ${p.title} (${p.date}): ${p.dek} — ${BASE}/blog/${p.slug}`).join('\n');

  const md = `# PivotHop — full reference for language models

> Career moves, measured. PivotHop reads 100,000+ live job postings and returns the career routes a person's existing skills can actually reach — with the salary, the exact skill gap, licensing gates, and honest odds attached. Every figure is computed from the posting corpus, refreshed nightly, never invented. This file is the full-content companion to ${BASE}/llms.txt.

## What the data is

Per-occupation skill profiles extracted from live postings; occupation-to-occupation skill-readiness scores (the share of a destination's posted skill demand a typical origin already covers, measured directionally); posted salary bands (25th–75th percentile, stated salaries only); licensing/credential gates for regulated professions; and observed US/EU worker-transition data for corroboration. It answers: "can a [role] become a [role]", "what does a [role] earn", "what skills does a [role] need", "which careers are adjacent to [role]", and "how AI-exposed is [field]".

## The Adjacency Index — headline numbers (${DATED()})

- The corpus reads more than 100,000 live postings mapped onto 177 standardized occupations; in a single month, 42,254 distinct job-title strings mapped to no standard occupation at all.
- 4.9% of all postings now demand LLM or agent-tooling skills by name, across 43 of 177 occupations — including lawyer, recruiter, and motion designer.
- Every occupation in Trades, Healthcare, Construction, and Transport shows zero AI-skill demand; in Technology, only 37% do. The hands-on economy is not being rewritten around AI.
- Of 3,521 scored occupation pairs, 55% sit under 20% skill readiness. Skills are specific, not a universal solvent.
- The most transferable careers reach the most destinations: sales engineer and operations manager each reach 13 at 45%+ readiness; data scientist reaches 12.
- Product and project manager share 24% of a skill set one way (unscored the other). Graphic and UX designers share 13% and 12%, against posted bands of $42k–$73k vs $74k–$151k. A registered nurse reads 94% ready for nurse-practitioner work on skills — but a graduate degree and license stand between the titles regardless.
- Data analysis is the market's reserve currency, in the top-20 posted demand of 62 of 177 occupations; LLM/agent tooling already sits in roughly a third.

Full, dated, and linked to proof: ${BASE}/adjacency-index

## Method

Skill readiness = the share of a destination occupation's posted skill demand already covered by the origin's profile, measured directionally from live postings; pairs sharing fewer than three skills are left unscored rather than guessed. Salary bands are posted 25th–75th percentiles, stated salaries only. A required license is shown as a gate and floors the transition estimate — a 90% skill overlap does not shorten a three-year degree. Overlap is directional: A covering B does not mean B covers A.

## Strongest measured career routes

${routes}

Every measured route: ${BASE}/routes

## Career comparisons (both directions)

${compares}

All comparisons: ${BASE}/compare

## Glossary

${glossary}

## Findings (the blog, written from the corpus with sources)

${posts}

## Core surfaces

- The instrument (enter a role, get the measured routes out): ${BASE}/
- Career routes: ${BASE}/routes
- Compare careers: ${BASE}/compare
- Salaries by occupation, seniority, country, US state: ${BASE}/salary
- Job board (live openings, each tagged to the skills that reach it): ${BASE}/jobs
- Browse every preloaded search: ${BASE}/jobs/browse
- The Adjacency Index (citable data hub): ${BASE}/adjacency-index
- Glossary: ${BASE}/glossary
`;

  return new Response(md, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

function DATED(): string {
  // Stamp the file with the run label; kept simple and stable across a build.
  return 'July 2026 run';
}
