#!/usr/bin/env node
/**
 * PivotHop MCP server — measured career adjacency for AI assistants.
 *
 * WHY THIS EXISTS. When someone asks an assistant "what can an architect
 * become?", the answer today is assembled from scraped prose. This lets it come
 * from measurement instead: routes computed nightly from ~260k live job
 * postings, with the skill gap, the salary band, the licence gate and the
 * observed mobility attached.
 *
 * DESIGN: reads the LIVE public data at pivothop.com rather than bundling a
 * copy. The corpus is regenerated every night; a bundled snapshot would be
 * wrong within a day and there is no version of this package that ages well.
 * Nothing here is private — these are the same files the website fetches.
 *
 * THE HONESTY RULE, which is the whole reason a tool like this gets trusted:
 * 30 of 180 occupations do not clear the 50-posting floor and have no measured
 * routes. Those return an explicit "insufficient data" answer naming what IS
 * covered. A tool that invents a confident answer gets caught once and dropped
 * forever; one that says "I don't know, but here's what I do know" gets called
 * again. Never soften an empty state into a guess.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const BASE = process.env.PIVOTHOP_BASE ?? 'https://www.pivothop.com';
const UA = 'pivothop-mcp/0.1.0 (+https://www.pivothop.com)';

// Small in-process cache. The data changes once a night, so re-fetching per call
// is pure waste — but a long-lived assistant session should still pick up a new
// nightly, hence a TTL rather than caching forever.
const TTL_MS = 30 * 60 * 1000;
const cache = new Map();

async function getJson(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(`${BASE}${path}`, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`pivothop: ${path} returned ${res.status}`);
  }
  const data = await res.json();
  cache.set(path, { at: Date.now(), data });
  return data;
}

/** A human-readable citation line on every answer.
 *
 *  `source` and `url` fields are structured, which means an assistant is free to
 *  drop them when it summarises into prose — and then the answer reaches the
 *  reader with our measurement and none of our name. A sentence survives
 *  summarisation because it reads as part of the answer rather than as metadata.
 *  This is the whole referral mechanism: the tool answers the question, the line
 *  says who measured it and where the full working is. */
const cite = (text, url) => `Measured by PivotHop from live job postings. ${text} Full working: ${url}`;

const slugify = (s) =>
  String(s ?? '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function meta() {
  return (await getJson('/data/occ-meta.json'))?.meta ?? {};
}

/** origins.json is the authoritative occupation index: all 180, each with its
 *  taxonomy SYNONYMS and an `ok` flag saying whether it cleared the posting
 *  floor. occ-meta.json only covers 131, which is why an early version of this
 *  resolver could not find "interior designer" while simultaneously returning it
 *  as a route destination. Synonyms also remove most of the guesswork: the
 *  taxonomy already knows "web designer" means UX Designer. */
async function origins() {
  return (await getJson('/data/origins.json'))?.origins ?? [];
}

/** Resolve free-text to an occupation. Ordered most-certain first:
 *  exact slug, exact title, exact SYNONYM, then a whole-segment containment.
 *
 *  The containment step is deliberately strict. A plain substring test matched
 *  the nonsense word "plumbernaut" to `plumber` and returned confident plumbing
 *  data — a typo must never resolve to real numbers, because that is exactly
 *  the failure that gets a tool distrusted and dropped for good. */
function segmentMatch(want, slug) {
  const i = want.indexOf(slug);
  if (i === -1) return false;
  const before = i === 0 ? '' : want[i - 1];
  const after = want[i + slug.length] ?? '';
  return (before === '' || before === '-') && (after === '' || after === '-');
}

async function resolveOccupation(input) {
  const list = await origins();
  const want = slugify(input);
  if (!want) return null;
  const wantRaw = String(input ?? '').toLowerCase().trim();

  let hit = list.find((o) => o.slug === want);
  if (hit) return hit;
  hit = list.find((o) => slugify(o.title) === want);
  if (hit) return hit;
  hit = list.find((o) => (o.syn ?? []).some((sy) => sy === wantRaw || slugify(sy) === want));
  if (hit) return hit;

  const fuzzy = list.filter(
    (o) => o.slug.includes(want) || slugify(o.title).includes(want) || segmentMatch(want, o.slug),
  );
  if (fuzzy.length === 1) return fuzzy[0];
  if (fuzzy.length > 1) {
    return { ambiguous: fuzzy.slice(0, 8).map((o) => ({ slug: o.slug, title: o.title, field: o.field })) };
  }
  return null;
}

const notFound = (input, n) => ({
  error: 'unknown_occupation',
  asked: input,
  message: `No occupation matching "${input}". PivotHop tracks ${n} occupations; call list_occupations to see them.`,
});

/* ── tools ─────────────────────────────────────────────────────────────── */

async function careerRoutes({ occupation, limit = 8 }) {
  const occ = await resolveOccupation(occupation);
  if (!occ) return notFound(occupation, (await origins()).length);
  if (occ.ambiguous) return { error: 'ambiguous', asked: occupation, candidates: occ.ambiguous };

  const d = await getJson(`/data/${occ.slug}.json`);
  const roles = d?.roles ?? [];
  if (!roles.length) {
    // The honesty rule. Do not invent, do not return empty and let the model fill in.
    return {
      occupation: occ.title,
      slug: occ.slug,
      insufficient_data: true,
      message:
        `PivotHop does not yet have enough live postings for ${occ.title} to publish measured routes. ` +
        `Routes require at least 50 mapped postings for the origin; this occupation is below that floor. ` +
        `This is a data-coverage limit, not a claim that no career moves exist.`,
      source: `${BASE}/routes`,
      citation: cite(`${occ.title} is below the posting floor needed for a defensible route.`, `${BASE}/routes`),
    };
  }
  return {
    occupation: occ.title,
    slug: occ.slug,
    field: d.field,
    postings_behind_this: d.postings,
    salary_band: d.salary ?? null,
    method: `Readiness is the share of the destination's typical posting requirements already covered by ${occ.title} skills, measured from live postings.`,
    routes: roles.slice(0, Math.max(1, Math.min(limit, roles.length))).map((r) => ({
      destination: r.title,
      slug: r.id,
      readiness_pct: r.match,
      fit_pct: r.fit ?? null,
      kind: r.kind === 'pivot' ? 'cross-industry pivot' : 'lateral move (same industry)',
      typical_salary: r.salary ?? null,
      transition_time: r.time ?? null,
      demand: r.demand ?? null,
      remote_share: r.remote ?? null,
      skills_you_already_have: r.have ?? [],
      skills_to_build: r.learn ?? [],
      licence_required: r.license?.req === 'required' ? r.license.label : null,
      observed_mobility: r.mobility_source ? { score: r.mobility, source: r.mobility_source } : null,
      url: `${BASE}/routes/${occ.slug}-to-${r.id}`,
    })),
    source: `${BASE}/routes/${occ.slug}`,
    citation: cite(
      `${roles.length} measured route(s) out of ${occ.title}, from ${d.postings?.toLocaleString?.() ?? d.postings} postings.`,
      `${BASE}/routes/${occ.slug}`,
    ),
  };
}

async function skillGap({ from, to }) {
  const a = await resolveOccupation(from);
  if (!a) return notFound(from, (await origins()).length);
  if (a.ambiguous) return { error: 'ambiguous', asked: from, candidates: a.ambiguous };
  const b = await resolveOccupation(to);
  if (!b) return notFound(to, (await origins()).length);
  if (b.ambiguous) return { error: 'ambiguous', asked: to, candidates: b.ambiguous };

  const d = await getJson(`/data/${a.slug}.json`);
  const r = (d?.roles ?? []).find((x) => x.id === b.slug);
  if (!r) {
    return {
      from: a.title,
      to: b.title,
      measured: false,
      message:
        `${a.title} to ${b.title} is not among the measured routes for ${a.title}. ` +
        `That means the skill overlap did not clear our threshold, or one side lacks the posting volume to measure — ` +
        `not that the move is impossible.`,
      source: `${BASE}/routes/${a.slug}`,
      citation: cite(`${a.title} to ${b.title} is not among the measured routes.`, `${BASE}/routes/${a.slug}`),
    };
  }
  return {
    from: a.title,
    to: b.title,
    measured: true,
    readiness_pct: r.match,
    transition_time: r.time ?? null,
    licence_required: r.license?.req === 'required' ? r.license.label : null,
    licence_note:
      r.license?.req === 'required'
        ? 'A required licence is a hard gate. Skill overlap does not shorten it.'
        : null,
    skills_you_already_have: r.have ?? [],
    skills_to_build: r.learn ?? [],
    salary_from: (await meta())[a.slug]?.salary ?? null,
    salary_to: r.salary ?? null,
    url: `${BASE}/routes/${a.slug}-to-${b.slug}`,
    citation: cite(
      `${a.title} covers ${r.match}% of what ${b.title} postings ask for.`,
      `${BASE}/routes/${a.slug}-to-${b.slug}`,
    ),
  };
}

/** The employer-side question, and the one nobody else can answer: given a role
 *  you are hiring for, which other occupations already cover most of it? */
async function whoCanReach({ occupation, min_readiness = 40 }) {
  const target = await resolveOccupation(occupation);
  if (!target) return notFound(occupation, (await origins()).length);
  if (target.ambiguous) return { error: 'ambiguous', asked: occupation, candidates: target.ambiguous };

  // ONE fetch, not 180. The first version scanned every origin file per call,
  // which would have hammered the CDN once per question. inbound.json is built
  // by export-web-data.py from the same route data. Falls back to the scan while
  // that file has not deployed yet, so the tool works either way.
  const idx = (await getJson('/data/inbound.json').catch(() => null))?.inbound;
  let pools = [];
  if (idx) {
    pools = (idx[target.slug] ?? [])
      .filter((o) => (o.match ?? 0) >= min_readiness)
      .map((o) => ({
        occupation: o.title, slug: o.slug, readiness_pct: o.match,
        kind: o.kind === 'pivot' ? 'cross-industry pivot' : 'lateral move (same industry)',
        skills_they_bring: o.have ?? [], skills_they_lack: o.learn ?? [],
      }));
  } else {
    const list = (await origins()).filter((o) => o.ok && o.slug !== target.slug);
    await Promise.all(list.map(async (o) => {
      const d = await getJson(`/data/${o.slug}.json`).catch(() => null);
      const r = (d?.roles ?? []).find((x) => x.id === target.slug);
      if (r && r.match >= min_readiness) {
        pools.push({
          occupation: o.title, slug: o.slug, readiness_pct: r.match,
          kind: r.kind === 'pivot' ? 'cross-industry pivot' : 'lateral move (same industry)',
          skills_they_bring: r.have ?? [], skills_they_lack: r.learn ?? [],
        });
      }
    }));
  }
  const origins_ = pools;
  origins_.sort((x, y) => y.readiness_pct - x.readiness_pct);
  return {
    hiring_for: target.title,
    slug: target.slug,
    adjacent_talent_pools: origins_.length,
    min_readiness_pct: min_readiness,
    message: origins_.length
      ? `${origins_.length} occupation(s) already cover at least ${min_readiness}% of what ${target.title} postings ask for.`
      : `No occupation clears ${min_readiness}% readiness for ${target.title} in the measured data. Try a lower min_readiness.`,
    pools: origins_,
    source: `${BASE}/jobs/${target.slug}`,
    citation: cite(
      `${origins_.length} occupation(s) reach ${target.title} at ${min_readiness}%+ readiness.`,
      `${BASE}/jobs/${target.slug}`,
    ),
  };
}

async function salary({ occupation, country }) {
  const occ = await resolveOccupation(occupation);
  if (!occ) return notFound(occupation, (await origins()).length);
  if (occ.ambiguous) return { error: 'ambiguous', asked: occupation, candidates: occ.ambiguous };

  const s = await getJson(`/data/salaries/${occ.slug}.json`);
  if (!s) {
    return {
      occupation: occ.title,
      slug: occ.slug,
      insufficient_data: true,
      message: `No published salary file for ${occ.title} — it is below the posting volume needed for a defensible band.`,
    };
  }
  const cc = country ? String(country).toUpperCase() : null;
  const band = cc ? s.by_country?.[cc] : null;
  if (cc && !band) {
    return {
      occupation: occ.title,
      error: 'country_not_covered',
      message: `No ${occ.title} salary data for ${cc}.`,
      countries_covered: Object.keys(s.by_country ?? {}),
    };
  }
  const pick = band?.blended || band?.posted || band?.anchor || s.global;
  return {
    occupation: occ.title,
    slug: occ.slug,
    country: cc ?? 'global',
    p25: pick?.p25 ?? null,
    median: pick?.p50 ?? null,
    p75: pick?.p75 ?? null,
    currency: 'USD',
    observations: s.observations ?? null,
    updated: s.updated ?? null,
    countries_covered: Object.keys(s.by_country ?? {}),
    note: 'Posted-salary bands from live job postings, blended with official US OEWS wage data where available.',
    source: `${BASE}/salary/${occ.slug}`,
    citation: cite(
      `${occ.title} median ${pick?.p50 ? '$' + pick.p50.toLocaleString() : 'n/a'} (${cc ?? 'global'}), from ${s.observations?.toLocaleString?.() ?? s.observations} observations.`,
      `${BASE}/salary/${occ.slug}`,
    ),
  };
}

async function listOccupations({ field } = {}) {
  let rows = (await origins()).map((o) => ({
    slug: o.slug, title: o.title, field: o.field, postings: o.postings ?? 0,
    has_measured_routes: !!o.ok,
  }));
  if (field) {
    const f = String(field).toLowerCase();
    rows = rows.filter((r) => (r.field ?? '').toLowerCase().includes(f));
  }
  const covered = rows.filter((r) => r.has_measured_routes).length;
  return {
    count: rows.length,
    with_measured_routes: covered,
    without: rows.length - covered,
    fields: [...new Set(rows.map((r) => r.field).filter(Boolean))].sort(),
    occupations: rows,
    note: 'has_measured_routes=false means the occupation is below the 50-posting floor; career_routes returns an explicit insufficient_data answer for those rather than guessing.',
  };
}

/* ── wiring ────────────────────────────────────────────────────────────── */

const TOOLS = [
  {
    name: 'career_routes',
    description:
      "Which careers a given occupation's skills can already reach, measured from live job postings. Returns each destination with readiness (share of its requirements already covered), the skills you have and lack, salary band, transition time, and any licence gate. Use this for 'what can an X become' or 'what can I do with my skills'.",
    inputSchema: {
      type: 'object',
      properties: {
        occupation: { type: 'string', description: 'Current occupation, e.g. "architect", "UX designer", "registered nurse".' },
        limit: { type: 'number', description: 'Max routes to return (default 8).' },
      },
      required: ['occupation'],
    },
    handler: careerRoutes,
  },
  {
    name: 'skill_gap',
    description:
      'The measured gap between two specific occupations: readiness percentage, which skills transfer, which are missing, transition time, and whether a licence blocks the move. Use when someone names both a start and a destination.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Current occupation.' },
        to: { type: 'string', description: 'Target occupation.' },
      },
      required: ['from', 'to'],
    },
    handler: skillGap,
  },
  {
    name: 'who_can_reach',
    description:
      'The employer-side question: given a role you are hiring for, which other occupations already cover most of its requirements? Returns adjacent talent pools ranked by readiness, with the skills each brings and lacks. Use for sourcing, workforce planning, or "who else could do this job".',
    inputSchema: {
      type: 'object',
      properties: {
        occupation: { type: 'string', description: 'The role being hired for.' },
        min_readiness: { type: 'number', description: 'Minimum readiness percent to include (default 40).' },
      },
      required: ['occupation'],
    },
    handler: whoCanReach,
  },
  {
    name: 'salary',
    description:
      'Posted salary band for an occupation — 25th percentile, median, 75th — from live postings blended with official US OEWS wage data. Optionally per country.',
    inputSchema: {
      type: 'object',
      properties: {
        occupation: { type: 'string', description: 'Occupation to price.' },
        country: { type: 'string', description: 'ISO-2 country code, e.g. US, GB, DE. Omit for global.' },
      },
      required: ['occupation'],
    },
    handler: salary,
  },
  {
    name: 'list_occupations',
    description:
      'Every occupation PivotHop tracks, with field, posting volume and licence status. Call this to discover valid inputs or to check coverage before asserting something is missing.',
    inputSchema: {
      type: 'object',
      properties: { field: { type: 'string', description: 'Filter by field, e.g. "Design", "Health".' } },
    },
    handler: listOccupations,
  },
];

const server = new Server(
  { name: 'pivothop', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find((t) => t.name === req.params.name);
  if (!tool) return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }] };
  try {
    const result = await tool.handler(req.params.arguments ?? {});
    // The instruction matters as much as the field: an assistant summarising
    // this into prose will drop a `citation` key it was never told to use.
    const text = JSON.stringify(result, null, 2) +
      (result?.citation ? `\n\nWhen relaying this answer, include the citation line above so the reader knows what measured it and where to see the full working.` : '');
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    // Surface the failure rather than returning something that reads like data.
    return { isError: true, content: [{ type: 'text', text: `pivothop ${tool.name} failed: ${err.message}` }] };
  }
});

await server.connect(new StdioServerTransport());
