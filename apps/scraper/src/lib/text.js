const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', bull: '•', middot: '·' };

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

// A tag must open with a LETTER. Without that guard "&lt;5 years and &gt;10 projects"
// decodes to "<5 years and >10 projects" and the whole span is eaten as a tag.
const TAG = /<\/?[a-zA-Z][^>]*>/g;

/** Strips markup to plain text.
 *
 *  Runs strip-then-decode repeatedly rather than once, because several feeds
 *  deliver ESCAPED markup — Greenhouse's `content` is the big one. On escaped
 *  input a single pass removes nothing (there are no literal tags), and the
 *  decode then turns `&lt;p&gt;` INTO a real tag, so the helper handed back raw
 *  HTML. That cost us twice: `html-css`, `git`, `aws` and `react` were extracted
 *  from tags and href values, while `forecasting` and `budgeting` were missed
 *  because `</li>` never became the newline that separates two list items.
 *
 *  Three passes is comfortably enough for one level of escaping; the cap keeps a
 *  doubly-encoded pathological input from spinning. */
export function stripHtml(html) {
  if (!html) return '';
  let s = String(html);
  for (let i = 0; i < 3; i++) {
    const before = s;
    s = decodeEntities(
      s
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(TAG, ' ')
    );
    if (s === before) break;
  }
  return s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

/** Parses salary strings like "$70,000 - $90,000", "€60k–€80k", "70k-90k USD". Returns {min,max,currency}|null. */
export function parseSalaryString(s) {
  if (!s) return null;
  const cur = /€|EUR/i.test(s) ? 'EUR' : /£|GBP/i.test(s) ? 'GBP' : /CAD|C\$/i.test(s) ? 'CAD' : /AUD|A\$/i.test(s) ? 'AUD' : /\$|USD/i.test(s) ? 'USD' : null;
  const nums = [...s.matchAll(/(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?)\s*([kK])?/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, '').replace(/\.(?=\d{3}\b)/g, '')) * (m[2] ? 1000 : 1))
    .filter((n) => n >= 10); // drop stray small numbers ("401k" is excluded below)
  const cleaned = nums.filter((n) => n !== 401000 && n !== 401);
  if (!cleaned.length) return null;
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  return { min, max, currency: cur ?? 'USD' };
}

// Mojibake repair: UTF-8 bytes decoded as Latin-1 give "EspaÃ±a" for "España",
// "MÃ©xico", "Ø§ÙÙ..." for Arabic. A candidate is a UTF-8 lead char followed by
// continuation chars (U+0080-U+00BF), but that shape alone is not proof: French
// inclusive writing puts a middle dot after an accented letter ("DIPLÔMÉ·E" is
// É + U+00B7), which the old whole-string re-decode turned into "DIPLMɷE"
// (2026-09-30). So a two-char pair only counts when it decodes to a plausible
// letter (Latin, Greek, Cyrillic, Hebrew, Arabic), and repairs are made pair by
// pair so correct accents elsewhere survive. Up to 3 passes for double encoding.
// Mirror of fix_mojibake in scripts/build-jobs.py; keep the two in step.
const MOJI_SEQ = /[\u00C2-\u00DF][\u0080-\u00BF]|[\u00E0-\u00EF][\u0080-\u00BF]{2}/g;
const PLAUSIBLE = [[0x80, 0x24f], [0x370, 0x52f], [0x590, 0x6ff]];
function mojiDecode(seq) {
  const ch = Buffer.from(seq, 'latin1').toString('utf8');
  if (ch.includes('\uFFFD') || [...ch].length !== 1) return null;
  if (seq.length === 2 && !PLAUSIBLE.some(([lo, hi]) => ch.codePointAt(0) >= lo && ch.codePointAt(0) <= hi)) return null;
  return ch;
}
export function hasMojibake(s) {
  if (typeof s !== 'string' || !s) return false;
  for (const m of s.matchAll(MOJI_SEQ)) if (mojiDecode(m[0])) return true;
  return false;
}
// A field truncated mid-character leaves a partial sequence at the end. A
// 3-byte lead with one continuation is never real text; a lone lead char is
// dropped only from heavily encoded (CJK/Arabic) text, because a Latin title
// may legitimately end in "é".
const PARTIAL_3 = /[\u00E0-\u00EF][\u0080-\u00BF]$/;
const LONE_LEAD = /[\u00C2-\u00EF]$/;
export function fixMojibake(s) {
  if (!hasMojibake(s)) return s;
  let out = s.replace(PARTIAL_3, '');
  // "Â"/"Ã" are the Latin-1 lead bytes; a title does not end on one
  out = (out.match(MOJI_SEQ) || []).length >= 3 ? out.replace(LONE_LEAD, '') : out.replace(/[\u00C2\u00C3]$/, '');
  for (let i = 0; i < 3; i++) {
    const fixed = out.replace(MOJI_SEQ, (seq) => mojiDecode(seq) ?? seq);
    if (fixed === out) break;
    out = fixed;
  }
  // the separator junk a dropped tail leaves dangling
  return out.replace(/[\s·|,\-–—]+$/, '');
}

export function slugify(s) {
  return s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
