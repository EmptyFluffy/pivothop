const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', bull: '•', middot: '·' };

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export function stripHtml(html) {
  if (!html) return '';
  return decodeEntities(
    String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
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
// "MÃ©xico", "Ø§ÙÙ..." for Arabic, "â€™" for a curly quote. The universal tell is
// two adjacent high-Latin-1 chars (a UTF-8 lead byte + a continuation byte),
// which real accented text never produces — "São"/"Zürich"/"Núñez" have one
// accent between ASCII, so they're left untouched. Re-decode up to 3× for
// double-encoding; bail if a pass yields the replacement char or no change.
const MOJIBAKE = /[\u00C2-\u00EF][\u0080-\u00BF]/;
export function fixMojibake(s) {
  if (typeof s !== 'string' || !s || !MOJIBAKE.test(s)) return s;
  let out = s;
  for (let i = 0; i < 3 && MOJIBAKE.test(out); i++) {
    let fixed;
    try { fixed = Buffer.from(out, 'latin1').toString('utf8'); } catch { break; }
    if (fixed.includes('�') || fixed === out) break;
    out = fixed;
  }
  return out;
}

export function slugify(s) {
  return s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
