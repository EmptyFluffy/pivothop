import { readJson } from '../lib/store.js';
import { FX_FILE } from '../lib/paths.js';

let fx = null;
function rates() {
  if (!fx) fx = readJson(FX_FILE);
  return fx;
}

const PERIOD_FACTOR = { hour: 2080, day: 260, week: 52, month: 12, year: 1 };

// Country -> local currency, for the mismatch check below. Only countries whose
// currency is in the FX snapshot; unlisted countries skip the check.
const LOCAL_CCY = {
  TW: 'TWD', CO: 'COP', MX: 'MXN', IN: 'INR', JP: 'JPY', PH: 'PHP', BR: 'BRL',
  KR: 'KRW', TH: 'THB', VN: 'VND', ID: 'IDR', MY: 'MYR', SG: 'SGD', CL: 'CLP',
  PE: 'PEN', AR: 'ARS', TR: 'TRY', ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', PL: 'PLN', IL: 'ILS', AE: 'AED', SA: 'SAR',
  HK: 'HKD', CN: 'CNY',
};

/**
 * Converts a raw salary to annual USD using the monthly FX snapshot, then runs
 * the sanitization layers that keep one bad posting from poisoning a band:
 *
 *   1. degenerate min  — "$1–$150,000" (USAJOBS API stubs): the min is garbage, drop it
 *   2. currency mismatch — a non-US posting claiming USD at an implausible level
 *      (Verkada Taipei: NT$1,640,000 labeled "USD/year") is reinterpreted in the
 *      country's local currency; kept only if the result is plausible
 *   3. ratio           — max/min > 5 is a range no real posting has; the min goes
 *   4. bounds          — sub-annual artifacts (per-course adjunct pay) and
 *      anything above $900k are dropped rather than displayed
 *
 * Every reinterpretation lowers confidence to 'inferred'; drops report 'absent'.
 * @returns {{min:number|null, max:number|null, confidence:'stated'|'inferred'|'absent'}}
 */
export function toAnnualUsd({ salary_min, salary_max, currency, salary_period, country }) {
  if (!salary_min && !salary_max) return { min: null, max: null, confidence: 'absent' };
  const cur = currency ?? 'USD';
  const rate = rates().rates[cur];
  if (!rate) return { min: null, max: null, confidence: 'absent' };

  let lo = salary_min ?? salary_max;
  let hi = salary_max ?? salary_min;
  let confidence = 'stated';
  let period = salary_period;
  if (!period) {
    // Infer from magnitude (in USD terms) — conservative, and flagged.
    const hiUsd = hi / rate;
    period = hiUsd <= 400 ? 'hour' : hiUsd < 20000 ? 'month' : 'year';
    if (period !== 'year') confidence = 'inferred';
  }
  const factor = PERIOD_FACTOR[period] ?? 1;
  lo = (lo / rate) * factor;
  hi = (hi / rate) * factor;
  if (lo > hi) return { min: null, max: null, confidence: 'absent' };

  // 1. Degenerate min: a real posting never spans "$1 to $150k".
  if (lo < 2000 && hi >= 30000) lo = null;

  // 2. Currency mismatch: employer typed local amounts into a USD-labeled field.
  //    Only fires for USD claims, outside the US, in weak-currency countries, at
  //    levels no local posting plausibly pays in dollars.
  if (cur === 'USD' && country && country !== 'US' && hi > 250000) {
    const localCcy = LOCAL_CCY[country];
    const localRate = localCcy ? rates().rates[localCcy] : null;
    if (localRate && localRate >= 5) {
      const hi2 = hi / localRate;
      const lo2 = lo != null ? lo / localRate : null;
      if (hi2 >= 6000 && hi2 <= 400000) {
        hi = hi2; lo = lo2; confidence = 'inferred';
      } else {
        return { min: null, max: null, confidence: 'absent' };
      }
    } else {
      // No local rate to reinterpret with — an implausible claim stays out.
      return { min: null, max: null, confidence: 'absent' };
    }
  }

  // 3. A 5x+ spread is a data artifact, not a salary band.
  if (lo != null && lo > 0 && hi / lo > 5) lo = null;

  // 4. Bounds: sub-annual artifacts and nothing above $900k.
  const floor = country === 'US' ? 14000 : 5000;
  if (hi < floor || hi > 900000) return { min: null, max: null, confidence: 'absent' };

  return { min: lo != null ? Math.round(lo) : null, max: Math.round(hi), confidence };
}
