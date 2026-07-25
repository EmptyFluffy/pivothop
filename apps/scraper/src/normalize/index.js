import { readNdjson, writeNdjson, readJson, writeJson, supabaseUpsert } from '../lib/store.js';
import { RAW_FILE, POSTINGS_FILE, QUALITY_FILE, UNMAPPED_FILE, FIRST_SEEN_FILE } from '../lib/paths.js';
import { mapTitle, cleanTitle } from './titles.js';
import { toAnnualUsd } from './salary.js';
import { extractSkills, zoneText } from './skills.js';
import { inferCountry } from './country.js';

// Light company normalization for the dedup key: lowercase, legal suffixes off,
// non-alphanumerics out. "Aspen Dental Group, LLC" == "aspen dental group".
function normCompany(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\b(incorporated|inc|llc|llp|ltd|limited|gmbh|corp|corporation|co|plc|sa|ag|group|holdings)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const DAY = 864e5;
const WINDOW_DAYS = 60; // Lightcast-style: the same job re-seen within a window is one job

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

    candidates.push({
      dedupKey,
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
  const out = [...best.values()].map((c) => c.row);
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

  log(`normalize: ${raw.length} raw → ${candidates.length} mapped (${quality.pct_titles_mapped}%) → ${out.length} after dedup (−${dupes}) · salary ${quality.pct_with_salary}% · ≥3 skills ${quality.pct_with_3plus_skills}% · ${unmapped.size} distinct unmapped titles`);

  const { mirrored } = await supabaseUpsert('postings', out.map((p) => ({ ...p, skills: p.skills })), 'source,external_id');
  if (mirrored) log(`normalize: mirrored ${mirrored} rows to Supabase`);
  return quality;
}
