import { createHash } from 'node:crypto';
import { readNdjson, writeNdjson, readJson, writeJson, supabaseUpsert } from '../lib/store.js';
import { RAW_FILE, POSTINGS_FILE, QUALITY_FILE, UNMAPPED_FILE, FIRST_SEEN_FILE } from '../lib/paths.js';
import { mapTitle, cleanTitle } from './titles.js';
import { toAnnualUsd } from './salary.js';
import { extractSkills, zoneText } from './skills.js';
import { inferCountry } from './country.js';
import { fixMojibake, stripHtml } from '../lib/text.js';

// Light company normalization for the dedup key: lowercase, legal suffixes off,
// non-alphanumerics out. "Aspen Dental Group, LLC" == "aspen dental group".
function normCompany(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\b(incorporated|inc|llc|llp|ltd|limited|gmbh|corp|corporation|co|plc|sa|ag|group|holdings|hire|hiring|hr|recruiting|recruitment|staffing)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const DAY = 864e5;
const WINDOW_DAYS = 60; // Lightcast-style: the same job re-seen within a window is one job

// Content-identity dedup (2026-07-30). The place-keyed dedup above cannot see a
// listing carpet-bombed across geography: "chartis / recruiter" appeared 325 times
// in one month across 245 US towns, every copy byte-identical, and every copy
// survived because the place differed. Measured before the fix: 326 (company,
// title) pairs accounted for 10,762 of 125,537 corpus rows — 8.6% — and the worst
// case made sound-designer 83% ONE listing (174 of 210), which set that
// occupation's entire skill profile, salary band and adjacency routes.
//
// A byte-identical description from one employer is one piece of evidence about
// what that job requires, however many towns it names. So a second pass collapses
// on (employer, title, description hash) with NO place and NO time bucket.
//
// The length floor is load-bearing: sources that ship empty or stub descriptions
// would otherwise hash identically and collapse genuinely distinct openings.
// Below the floor the posting keeps its place-keyed identity and this pass is a
// no-op for it.
const CONTENT_MIN_CHARS = 200;

// Case and whitespace only. An earlier version also stripped each posting's own
// location tokens and all digits, meaning to catch templates that write the city
// into the body ("seeking a Perfusionist for a job in Harwood Heights, Illinois").
// Measured, it was a net LOSS: 19,433 collapses fell to 18,514, because two
// postings with byte-identical descriptions strip DIFFERENT tokens — so if the
// shared text mentions another posting's city, they stop matching. It bought 3
// rows on the case it targeted and cost ~900 real duplicates elsewhere.
//
// The targeted case is not reachable by exact hashing anyway: SpecialtyCare's
// descriptions are truncated at exactly 500 characters with the city inside, so a
// longer city name shifts the cut and the tails differ no matter what is removed.
// Catching that needs near-duplicate detection (shingling/simhash), which is a
// different piece of work and is NOT justified by 3 rows. Digit-stripping was
// dropped for a second reason: it would hash two different salaries the same.
function contentHash(desc) {
  return createHash('sha1')
    .update(String(desc).toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex').slice(0, 16);
}

/**
 * postings_raw -> postings. Title canonicalization, salary to annual USD, skill
 * extraction, country inference — then two honesty layers:
 *
 *   1. First-seen ledger: the earliest posted date we ever observed for each
 *      (source, external_id) is the date that counts. A repost refreshing its
 *      timestamp at the source cannot make a stale listing look fresh.
 *   2. Cross-source dedup: the same (company, cleaned title, place) inside a
 *      60-day window is ONE job, however many boards syndicate it. The richest
 *      copy wins (stated salary beats absent, more skills beats fewer), so
 *      aggregates and skill shares count openings, not syndication.
 *
 * Writes data-quality counters per batch and the unmapped-title log the
 * synonym tables grow from.
 */
export async function normalize({ log }) {
  const raw = readNdjson(RAW_FILE);
  if (!raw.length) { log('normalize: no raw postings — run `ingest` first'); return null; }

  const ledger = readJson(FIRST_SEEN_FILE) ?? {};
  const unmapped = new Map();
  const candidates = [];

  for (const r of raw) {
    r.title = fixMojibake(r.title); r.company = fixMojibake(r.company); r.location = fixMojibake(r.location);

    // Repair markup HERE as well as in the adapters, so the corpus already on disk
    // is fixed without re-scraping 260k rows. Feeds that deliver escaped HTML —
    // Greenhouse above all — used to reach this point as raw tags (see stripHtml),
    // averaging 129 residual tags per posting on our richest source. That cut both
    // ways: `html-css`, `git` and `aws` were extracted from tags and href values,
    // while `forecasting` and `budgeting` were missed because `</li>` never became
    // the break that separates two list items.
    // Cheap-exit on text that has neither a tag nor an entity, which is most rows.
    if (r.description_text && /[<&]/.test(r.description_text)) r.description_text = stripHtml(r.description_text);
    const mapped = mapTitle(r.title);
    if (!mapped) {
      unmapped.set(r.title, (unmapped.get(r.title) ?? 0) + 1);
      continue;
    }
    const country = inferCountry(r.location);
    const sal = toAnnualUsd({ ...r, country }); // country drives the currency-mismatch check
    const skills = extractSkills(`${r.title}\n${zoneText(r.description_text)}`);

    // 1. Honest date: min(ledger, source-reported), per posting identity.
    const idKey = `${r.source}|${r.external_id}`;
    const obs = String(r.posted_at ?? '').slice(0, 10);
    if (obs && (!ledger[idKey] || obs < ledger[idKey])) ledger[idKey] = obs;
    const posted = ledger[idKey] ?? obs;

    // 2. Dedup key: normalized employer + cleaned title + place, per 60-day window.
    const place = country ?? String(r.location ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 24);
    const t = Date.parse(posted);
    const bucket = Number.isFinite(t) ? Math.floor(t / (WINDOW_DAYS * DAY)) : 'x';
    const dedupKey = `${normCompany(r.company)}|${cleanTitle(r.title)}|${place}|${bucket}`;
    // 3. Content identity: same employer, same title, same words — one job,
    //    regardless of how many towns it was posted into. Null below the floor.
    const desc = String(r.description_text ?? '');
    const contentKey = desc.length >= CONTENT_MIN_CHARS
      ? `${normCompany(r.company)}|${cleanTitle(r.title)}|${contentHash(desc)}`
      : null;

    candidates.push({
      dedupKey,
      contentKey,
      richness: (sal.min ? 2 : 0) + Math.min(skills.length, 8) / 10 + (r.description_text?.length > 800 ? 0.5 : 0),
      row: {
        source: r.source,
        external_id: r.external_id,
        role_id: mapped.slug,
        title_raw: r.title,
        skills,
        salary_usd_min: sal.min,
        salary_usd_max: sal.max,
        salary_confidence: sal.confidence,
        remote_flag: Boolean(r.remote_flag),
        country,
        posted_at: posted,
        url: r.url,
      },
    });
  }

  // Keep the richest copy per dedup key.
  const best = new Map();
  for (const c of candidates) {
    const prev = best.get(c.dedupKey);
    if (!prev || c.richness > prev.richness) best.set(c.dedupKey, c);
  }
  const placeDeduped = [...best.values()];

  // Second pass: collapse geographic blasts. Runs AFTER the place-keyed pass so a
  // genuinely syndicated job is already one row before content identity is asked.
  const byContent = new Map();
  const kept = [];
  for (const c of placeDeduped) {
    if (!c.contentKey) { kept.push(c); continue; }
    const prev = byContent.get(c.contentKey);
    if (!prev) { byContent.set(c.contentKey, c); kept.push(c); continue; }
    if (c.richness > prev.richness) Object.assign(prev, c); // richest copy still wins
  }
  const blasted = placeDeduped.length - kept.length;

  const out = kept.map((c) => c.row);
  const dupes = candidates.length - out.length;

  // Ledger hygiene: entries whose first-seen date is over 400 days old are done.
  const cutoff = new Date(Date.now() - 400 * DAY).toISOString().slice(0, 10);
  for (const k of Object.keys(ledger)) if (ledger[k] < cutoff) delete ledger[k];
  writeJson(FIRST_SEEN_FILE, ledger);

  writeNdjson(POSTINGS_FILE, out);

  const withSalary = out.filter((p) => p.salary_usd_min).length;
  const withSkills3 = out.filter((p) => p.skills.length >= 3).length;
  const quality = {
    ranAt: new Date().toISOString(),
    raw_total: raw.length,
    mapped: candidates.length,
    deduped: out.length,
    dupes_removed: dupes,
    blasts_collapsed: blasted,
    pct_titles_mapped: +(100 * candidates.length / raw.length).toFixed(1),
    pct_with_salary: out.length ? +(100 * withSalary / out.length).toFixed(1) : 0,
    pct_with_3plus_skills: out.length ? +(100 * withSkills3 / out.length).toFixed(1) : 0,
    unmapped_distinct_titles: unmapped.size,
  };
  writeJson(QUALITY_FILE, quality);
  writeJson(UNMAPPED_FILE, {
    $comment: 'Distinct unmapped titles by frequency. Review, extend occupations.json synonyms, re-run normalize.',
    titles: [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 400).map(([title, count]) => ({ title, count })),
  });

  log(`normalize: ${raw.length} raw → ${candidates.length} mapped (${quality.pct_titles_mapped}%) → ${out.length} after dedup (−${dupes}, of which −${blasted} geo-blast) · salary ${quality.pct_with_salary}% · ≥3 skills ${quality.pct_with_3plus_skills}% · ${unmapped.size} distinct unmapped titles`);

  const { mirrored } = await supabaseUpsert('postings', out.map((p) => ({ ...p, skills: p.skills })), 'source,external_id');
  if (mirrored) log(`normalize: mirrored ${mirrored} rows to Supabase`);
  return quality;
}
