/*
 * PivotHop MCP job tools.
 *
 * These tools read ONLY the public job-board exports. build-jobs.py is the
 * licensing boundary: sources that are data-only never enter these files, so a
 * consumer of this module cannot accidentally re-display restricted listings.
 *
 * Search results point to PivotHop job-detail pages. The original apply URL is
 * exposed only by get_job_details, where it is useful and expected.
 */

let getJson = async () => { throw new Error('pivothop job tools: no data source configured'); };
export function configureJobTools(fetcher) { getJson = fetcher; }

const BASE = 'https://www.pivothop.com';
const tag = (url) => `${url}${url.includes('?') ? '&' : '?'}utm_source=mcp`;
const citation = (text, url) => `Found by PivotHop from live, re-displayable job postings. ${text} See: ${url}`;

const clampLimit = (v, fallback = 10, max = 25) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(1, Math.min(max, Math.floor(n))) : fallback;
};

const slugify = (s) =>
  String(s ?? '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function origins() {
  return (await getJson('/data/origins.json'))?.origins ?? [];
}

function segmentMatch(want, slug) {
  const i = want.indexOf(slug);
  if (i === -1) return false;
  const before = i === 0 ? '' : want[i - 1];
  const after = want[i + slug.length] ?? '';
  return (before === '' || before === '-') && (after === '' || after === '-');
}

async function resolveOccupation(input) {
  if (!input) return null;
  const list = await origins();
  const want = slugify(input);
  const raw = String(input).toLowerCase().trim();

  let hit = list.find((o) => o.slug === want);
  if (hit) return hit;
  hit = list.find((o) => slugify(o.title) === want);
  if (hit) return hit;
  hit = list.find((o) => (o.syn ?? []).some((s) => s === raw || slugify(s) === want));
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

const unknownOccupation = async (input) => ({
  error: 'unknown_occupation',
  asked: input,
  message: `No occupation matching "${input}". PivotHop tracks ${(await origins()).length} occupations; call list_occupations to inspect coverage.`,
});

async function allJobs() {
  const rows = await getJson('/data/all-jobs.json');
  return Array.isArray(rows) ? rows : [];
}

const hasFlag = (j, f) => Array.isArray(j.fl) && j.fl.includes(f);

function jobPage(j) {
  return tag(`${BASE}/jobs/${j.occ}/${j.id}`);
}

function salaryRange(j) {
  return {
    min_usd: j.smin ?? null,
    max_usd: j.smax ?? null,
  };
}

function levelName(j) {
  return j.lv === 's' ? 'senior' : j.lv === 'e' ? 'entry' : null;
}

function publicJob(j) {
  return {
    job_id: j.id,
    occupation: j.occ,
    title: j.title,
    company: j.company,
    location: j.location || null,
    country: j.c ?? null,
    remote: !!j.remote,
    level: levelName(j),
    salary: salaryRange(j),
    posted: j.posted || null,
    equity: hasFlag(j, 'eq'),
    visa_sponsor: hasFlag(j, 'vi'),
    four_day_week: hasFlag(j, '4d'),
    url: jobPage(j),
  };
}

function matchesFilters(j, args = {}) {
  if (typeof args.remote === 'boolean' && !!j.remote !== args.remote) return false;

  if (args.country) {
    const cc = String(args.country).trim().toUpperCase();
    if ((j.c ?? '').toUpperCase() !== cc) return false;
  }

  if (args.level) {
    const want = String(args.level).toLowerCase();
    if (want === 'senior' && j.lv !== 's') return false;
    if (want === 'entry' && j.lv !== 'e') return false;
  }

  if (args.min_salary != null) {
    const floor = Number(args.min_salary);
    const high = j.smax ?? j.smin;
    if (!Number.isFinite(floor) || high == null || high < floor) return false;
  }

  if (args.max_salary != null) {
    const ceiling = Number(args.max_salary);
    const low = j.smin ?? j.smax;
    if (!Number.isFinite(ceiling) || low == null || low > ceiling) return false;
  }

  if (args.equity === true && !hasFlag(j, 'eq')) return false;
  if (args.visa_sponsor === true && !hasFlag(j, 'vi')) return false;
  if (args.four_day_week === true && !hasFlag(j, '4d')) return false;

  if (args.query) {
    const tokens = String(args.query).toLowerCase().trim().split(/\s+/).filter(Boolean);
    const haystack = `${j.title ?? ''} ${j.company ?? ''} ${j.location ?? ''} ${j.occ ?? ''}`.toLowerCase();
    if (!tokens.every((t) => haystack.includes(t))) return false;
  }

  return true;
}

async function resolveOccupationFilter(input) {
  if (!input) return { slug: null };
  const occ = await resolveOccupation(input);
  if (!occ) return { error: await unknownOccupation(input) };
  if (occ.ambiguous) return { error: { error: 'ambiguous', asked: input, candidates: occ.ambiguous } };
  return { slug: occ.slug, title: occ.title };
}

async function searchJobs(args = {}) {
  const limit = clampLimit(args.limit);
  const occ = await resolveOccupationFilter(args.occupation);
  if (occ.error) return occ.error;

  let rows = await allJobs();
  if (occ.slug) rows = rows.filter((j) => j.occ === occ.slug);
  rows = rows.filter((j) => matchesFilters(j, args));

  return {
    query: args.query || null,
    occupation: occ.title ?? null,
    total_matches: rows.length,
    returned: Math.min(limit, rows.length),
    jobs: rows.slice(0, limit).map(publicJob),
    note: 'Results come from PivotHop’s public board only: company career pages, permitted remote-job sources, and public-sector postings. Apply links remain with the original source.',
    source: tag(`${BASE}/jobs`),
    citation: citation(`${rows.length} live opening(s) matched this search.`, tag(`${BASE}/jobs`)),
  };
}

async function getJobs(args = {}) {
  const limit = clampLimit(args.limit);
  const occ = await resolveOccupationFilter(args.occupation);
  if (occ.error) return occ.error;

  let rows;
  if (occ.slug) {
    const data = await getJson(`/data/jobs/${occ.slug}.json`);
    rows = Array.isArray(data) ? data : [];
  } else {
    rows = await allJobs();
  }
  rows = rows.filter((j) => matchesFilters(j, args));

  const sourceUrl = occ.slug ? `${BASE}/jobs/${occ.slug}` : `${BASE}/jobs`;
  return {
    occupation: occ.title ?? null,
    available: rows.length,
    returned: Math.min(limit, rows.length),
    jobs: rows.slice(0, limit).map(publicJob),
    source: tag(sourceUrl),
    citation: citation(`${rows.length} current opening(s) are available${occ.title ? ` for ${occ.title}` : ''}.`, tag(sourceUrl)),
  };
}

async function findJob(jobId, occupation) {
  const id = String(jobId ?? '').trim();
  if (!id) return { error: { error: 'missing_job_id', message: 'job_id is required.' } };

  let occSlug = null;
  let occTitle = null;
  if (occupation) {
    const resolved = await resolveOccupationFilter(occupation);
    if (resolved.error) return { error: resolved.error };
    occSlug = resolved.slug;
    occTitle = resolved.title;
  } else {
    const hit = (await allJobs()).find((j) => j.id === id);
    if (!hit) return { error: { error: 'job_not_found', job_id: id, message: 'No live PivotHop job matches that id. It may have expired.' } };
    occSlug = hit.occ;
  }

  const rows = await getJson(`/data/jobs/${occSlug}.json`);
  const job = Array.isArray(rows) ? rows.find((j) => j.id === id) : null;
  if (!job) {
    return { error: { error: 'job_not_found', job_id: id, occupation: occSlug, message: 'No live PivotHop job matches that id in this occupation. It may have expired.' } };
  }

  if (!occTitle) {
    const o = (await origins()).find((x) => x.slug === occSlug);
    occTitle = o?.title ?? occSlug;
  }
  return { job, occSlug, occTitle };
}

async function getJobDetails({ job_id, occupation } = {}) {
  const found = await findJob(job_id, occupation);
  if (found.error) return found.error;

  const detailMap = await getJson(`/data/jobs-detail/${found.occSlug}.json`);
  const detail = detailMap?.[found.job.id] ?? null;
  const pivotUrl = jobPage(found.job);

  return {
    ...publicJob(found.job),
    occupation_title: found.occTitle,
    skills: detail?.k ?? [],
    description_sections: detail?.s ?? [],
    apply_url: found.job.url ?? null,
    apply_note: 'Applications are handled by the original employer or source. PivotHop does not host the application.',
    citation: citation(`${found.job.title} at ${found.job.company} is currently listed on PivotHop.`, pivotUrl),
  };
}

function titleTokens(title) {
  const stop = new Set(['a','an','and','at','for','in','of','on','the','to','with','remote','senior','sr','junior','jr','lead','principal','staff']);
  return new Set(String(title ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 2 && !stop.has(x)));
}

function relatedScore(seed, j) {
  let score = 0;
  if (!!seed.remote === !!j.remote) score += 2;
  if (seed.c && j.c && seed.c === j.c) score += 2;
  if (seed.lv && j.lv && seed.lv === j.lv) score += 1;
  if (seed.smin != null && seed.smax != null && j.smin != null && j.smax != null) {
    if (Math.max(seed.smin, j.smin) <= Math.min(seed.smax, j.smax)) score += 2;
  }
  const a = titleTokens(seed.title);
  const b = titleTokens(j.title);
  for (const t of a) if (b.has(t)) score += 1;
  return score;
}

async function getRelatedJobs({ job_id, occupation, limit = 8 } = {}) {
  const found = await findJob(job_id, occupation);
  if (found.error) return found.error;
  const n = clampLimit(limit, 8, 20);
  const rows = await getJson(`/data/jobs/${found.occSlug}.json`);
  const related = (Array.isArray(rows) ? rows : [])
    .filter((j) => j.id !== found.job.id)
    .map((j) => ({ j, score: relatedScore(found.job, j) }))
    .sort((a, b) => b.score - a.score || String(b.j.posted ?? '').localeCompare(String(a.j.posted ?? '')))
    .slice(0, n)
    .map(({ j }) => publicJob(j));

  const pivotUrl = jobPage(found.job);
  return {
    seed_job: publicJob(found.job),
    returned: related.length,
    related_jobs: related,
    method: 'Related jobs are live roles in the same measured occupation, ranked by title overlap, remote status, country, seniority, salary overlap, then freshness.',
    citation: citation(`${related.length} related live opening(s) were found for ${found.job.title}.`, pivotUrl),
  };
}

async function searchJobsForPivot(args = {}) {
  const from = await resolveOccupation(args.from);
  if (!from) return unknownOccupation(args.from);
  if (from.ambiguous) return { error: 'ambiguous', asked: args.from, candidates: from.ambiguous };

  const routeData = await getJson(`/data/${from.slug}.json`);
  const roles = from.ok === false ? [] : (routeData?.roles ?? []);
  if (routeData?.insufficient || !roles.length) {
    return {
      from: from.title,
      insufficient_data: true,
      message: `PivotHop does not have enough live postings for ${from.title} to publish defensible measured career routes yet.`,
      source: tag(`${BASE}/routes/${from.slug}`),
      citation: citation(`${from.title} is below the posting floor needed for pivot-aware job search.`, tag(`${BASE}/routes/${from.slug}`)),
    };
  }

  const minReadiness = Number.isFinite(Number(args.min_readiness)) ? Math.max(0, Math.min(100, Number(args.min_readiness))) : 40;
  const routeMap = new Map(
    roles
      .filter((r) => (r.match ?? 0) >= minReadiness)
      .map((r) => [r.id, r]),
  );

  let rows = (await allJobs()).filter((j) => routeMap.has(j.occ) && matchesFilters(j, args));
  rows.sort((a, b) => {
    const ra = routeMap.get(a.occ)?.match ?? 0;
    const rb = routeMap.get(b.occ)?.match ?? 0;
    return rb - ra || String(b.posted ?? '').localeCompare(String(a.posted ?? ''));
  });

  const limit = clampLimit(args.limit, 12, 25);
  const perOccupation = new Map();
  const picked = [];
  for (const j of rows) {
    const used = perOccupation.get(j.occ) ?? 0;
    if (used >= 3) continue;
    perOccupation.set(j.occ, used + 1);
    picked.push(j);
    if (picked.length >= limit) break;
  }

  const jobs = picked.map((j) => {
    const r = routeMap.get(j.occ);
    return {
      ...publicJob(j),
      pivot: {
        from: from.title,
        to: r.title,
        readiness_pct: r.match,
        fit_pct: r.fit ?? null,
        transition_time: r.time ?? null,
        skills_you_already_have: r.have ?? [],
        skills_to_build: r.learn ?? [],
        licence_required: r.license?.req === 'required' ? r.license.label : null,
        route_url: tag(`${BASE}/routes/${from.slug}-to-${r.id}`),
      },
    };
  });

  const destinationCount = new Set(rows.map((j) => j.occ)).size;
  return {
    from: from.title,
    min_readiness_pct: minReadiness,
    matching_destinations: destinationCount,
    total_matching_jobs: rows.length,
    returned: jobs.length,
    jobs,
    method: `A job qualifies only when its occupation is a measured PivotHop route out of ${from.title} at ${minReadiness}%+ readiness, then the requested job filters are applied. Results are capped at three jobs per destination for diversity.`,
    source: tag(`${BASE}/routes/${from.slug}`),
    citation: citation(`${rows.length} live job(s) across ${destinationCount} measured destination occupation(s) match this pivot search from ${from.title}.`, tag(`${BASE}/routes/${from.slug}`)),
  };
}

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const FILTER_PROPERTIES = {
  country: { type: 'string', description: 'ISO-2 country code, e.g. US, GB, DE, CR. Omit for any country.' },
  remote: { type: 'boolean', description: 'true for remote-only, false for non-remote-only. Omit for both.' },
  level: { type: 'string', enum: ['entry', 'senior'], description: 'Optional explicit seniority filter. Omit for any/unknown level.' },
  min_salary: { type: 'number', description: 'Minimum annual USD salary. A range qualifies when its stated upper bound reaches this value.' },
  max_salary: { type: 'number', description: 'Maximum annual USD salary. A range qualifies when its stated lower bound is at or below this value.' },
  equity: { type: 'boolean', description: 'Set true to require a posting that explicitly mentions equity.' },
  visa_sponsor: { type: 'boolean', description: 'Set true to require positive visa-sponsorship language in the posting.' },
  four_day_week: { type: 'boolean', description: 'Set true to require a posting that explicitly describes a four-day/32-hour style week.' },
};

export const JOB_TOOLS = [
  {
    name: 'search_jobs',
    description: 'Search PivotHop’s live public job board by words in the title/company/location plus occupation, country, remote status, seniority, salary and selected benefits. Use for normal job-finding requests. Returns PivotHop detail URLs; call get_job_details for the original apply URL and description.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to match in job title, company, location, or occupation.' },
        occupation: { type: 'string', description: 'Optional occupation name or slug, e.g. architect, data scientist.' },
        ...FILTER_PROPERTIES,
        limit: { type: 'number', description: 'Maximum results, 1–25. Default 10.' },
      },
    },
    annotations: { ...READ_ONLY, title: 'Search live jobs' },
    handler: searchJobs,
  },
  {
    name: 'get_jobs',
    description: 'Get the freshest live jobs on PivotHop, optionally within one occupation and with basic filters. Use for “latest jobs”, “show me current architect jobs”, or browsing without a keyword query.',
    inputSchema: {
      type: 'object',
      properties: {
        occupation: { type: 'string', description: 'Optional occupation name or slug.' },
        ...FILTER_PROPERTIES,
        limit: { type: 'number', description: 'Maximum results, 1–25. Default 10.' },
      },
    },
    annotations: { ...READ_ONLY, title: 'Get latest jobs' },
    handler: getJobs,
  },
  {
    name: 'get_job_details',
    description: 'Get one live job’s full PivotHop detail payload: description sections, extracted skills, salary/location metadata, PivotHop URL, and the original apply URL. Use after search_jobs/get_jobs when the user asks about a specific result or wants to apply.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string', description: 'PivotHop job_id returned by another job tool.' },
        occupation: { type: 'string', description: 'Optional occupation name/slug. Supplying it avoids a global lookup.' },
      },
      required: ['job_id'],
    },
    annotations: { ...READ_ONLY, title: 'Get job details' },
    handler: getJobDetails,
  },
  {
    name: 'get_related_jobs',
    description: 'Find similar current openings for a PivotHop job. Relatedness uses the same measured occupation plus title overlap, remote status, country, level and salary overlap. Use for “show me more like this”.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string', description: 'PivotHop job_id returned by another job tool.' },
        occupation: { type: 'string', description: 'Optional occupation name/slug. Supplying it avoids a global lookup.' },
        limit: { type: 'number', description: 'Maximum related jobs, 1–20. Default 8.' },
      },
      required: ['job_id'],
    },
    annotations: { ...READ_ONLY, title: 'Find related jobs' },
    handler: getRelatedJobs,
  },
  {
    name: 'search_jobs_for_pivot',
    description: 'PivotHop’s distinctive job search: start from the person’s CURRENT occupation, use measured career-adjacency routes to identify reachable destination occupations, then return live jobs in those destinations. Use when someone wants jobs they could realistically pivot into, especially requests like “I’m an architect; what remote jobs could I move into without starting over?”',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Current occupation, e.g. architect, accountant, UX designer.' },
        min_readiness: { type: 'number', description: 'Minimum measured readiness percentage for destination occupations, 0–100. Default 40.' },
        ...FILTER_PROPERTIES,
        limit: { type: 'number', description: 'Maximum jobs, 1–25. Default 12. Results are diversified across destination occupations.' },
      },
      required: ['from'],
    },
    annotations: { ...READ_ONLY, title: 'Find jobs you can pivot into' },
    handler: searchJobsForPivot,
  },
];
