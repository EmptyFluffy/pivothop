import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { stripHtml, parseSalaryString } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Greenhouse public board API — thousands of companies expose JSON deliberately.
// Company list is curated in config/greenhouse-companies.json; 404s are logged and skipped.
export const name = 'greenhouse';

function extractSalary(text) {
  // Pay-transparency ranges are the highest-quality salary signal in any feed.
  const m = text.match(/(?:salary|pay|compensation|base)[^.\n]{0,80}?\$\s?([\d,]{4,11})(?:\s?[-–—to]{1,3}\s?\$?\s?([\d,]{4,11}))?/i)
    || text.match(/\$\s?([\d,]{6,11})\s?[-–—]\s?\$?\s?([\d,]{6,11})/);
  if (!m) return null;
  const parsed = parseSalaryString(m[0]);
  if (!parsed || parsed.max < 20000 || parsed.max > 2000000) return null;
  return parsed;
}

export async function fetchRaw({ log }) {
  const boards = readJson(path.join(CONFIG_DIR, 'greenhouse-companies.json'))?.boards ?? [];
  const rows = [];
  for (const token of boards) {
    const body = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
    if (!body) { log(`greenhouse:${token} — no public board (skipped)`); continue; }
    const jobs = body.jobs ?? [];
    log(`greenhouse:${token} — ${jobs.length} postings`);
    for (const j of jobs) {
      // Greenhouse delivers `content` as ESCAPED HTML, so this needs the repeated
      // strip/decode in stripHtml — a single pass returns the markup intact.
      const text = stripHtml(j.content ?? '');
      const sal = extractSalary(text);
      const loc = j.location?.name ?? '';
      rows.push({
        source: name,
        external_id: `${token}:${j.id}`,
        title: j.title ?? '',
        company: token,
        location: loc || null,
        remote_flag: /remote/i.test(loc) || /\bfully remote\b/i.test(text),
        salary_min: sal?.min ?? null,
        salary_max: sal?.max ?? null,
        currency: sal?.currency ?? null,
        salary_period: sal ? 'year' : null,
        description_text: text.slice(0, 20000),
        posted_at: j.first_published ?? j.updated_at ?? null,
        url: j.absolute_url ?? null,
      });
    }
  }
  return rows;
}
