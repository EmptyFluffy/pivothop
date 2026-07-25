import { readNdjson, writeNdjson, writeJson, supabaseUpsert } from '../lib/store.js';
import { RAW_FILE, POSTINGS_FILE, QUALITY_FILE, UNMAPPED_FILE } from '../lib/paths.js';
import { mapTitle } from './titles.js';
import { toAnnualUsd } from './salary.js';
import { extractSkills, zoneText } from './skills.js';
import { inferCountry } from './country.js';

/**
 * postings_raw -> postings. Title canonicalization, salary to annual USD, skill
 * extraction, country inference. Writes data-quality counters per batch and the
 * unmapped-title log the synonym tables grow from.
 */
export async function normalize({ log }) {
  const raw = readNdjson(RAW_FILE);
  if (!raw.length) { log('normalize: no raw postings — run `ingest` first'); return null; }

  const out = [];
  const unmapped = new Map();
  let withSalary = 0, withSkills3 = 0;

  for (const r of raw) {
    const mapped = mapTitle(r.title);
    if (!mapped) {
      unmapped.set(r.title, (unmapped.get(r.title) ?? 0) + 1);
      continue;
    }
    const country = inferCountry(r.location);
    const sal = toAnnualUsd({ ...r, country }); // country drives the currency-mismatch check
    const skills = extractSkills(`${r.title}\n${zoneText(r.description_text)}`);
    if (sal.min) withSalary++;
    if (skills.length >= 3) withSkills3++;
    out.push({
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
      posted_at: r.posted_at,
      url: r.url,
    });
  }

  writeNdjson(POSTINGS_FILE, out);

  const quality = {
    ranAt: new Date().toISOString(),
    raw_total: raw.length,
    mapped: out.length,
    pct_titles_mapped: +(100 * out.length / raw.length).toFixed(1),
    pct_with_salary: out.length ? +(100 * withSalary / out.length).toFixed(1) : 0,
    pct_with_3plus_skills: out.length ? +(100 * withSkills3 / out.length).toFixed(1) : 0,
    unmapped_distinct_titles: unmapped.size,
  };
  writeJson(QUALITY_FILE, quality);
  writeJson(UNMAPPED_FILE, {
    $comment: 'Distinct unmapped titles by frequency. Review, extend occupations.json synonyms, re-run normalize.',
    titles: [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 400).map(([title, count]) => ({ title, count })),
  });

  log(`normalize: ${raw.length} raw → ${out.length} mapped (${quality.pct_titles_mapped}%) · salary ${quality.pct_with_salary}% · ≥3 skills ${quality.pct_with_3plus_skills}% · ${unmapped.size} distinct unmapped titles`);

  const { mirrored } = await supabaseUpsert('postings', out.map((p) => ({ ...p, skills: p.skills })), 'source,external_id');
  if (mirrored) log(`normalize: mirrored ${mirrored} rows to Supabase`);
  return quality;
}
