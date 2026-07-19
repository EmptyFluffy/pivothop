import { readJson } from '../lib/store.js';
import { FX_FILE } from '../lib/paths.js';

let fx = null;
function rates() {
  if (!fx) fx = readJson(FX_FILE);
  return fx;
}

const PERIOD_FACTOR = { hour: 2080, day: 260, week: 52, month: 12, year: 1 };

/**
 * Converts a raw salary to annual USD using the monthly FX snapshot.
 * Infers the pay period when the source didn't state one; inference lowers confidence.
 * @returns {{min:number|null, max:number|null, confidence:'stated'|'inferred'|'absent'}}
 */
export function toAnnualUsd({ salary_min, salary_max, currency, salary_period }) {
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
  if (hi < 5000 || lo > 2000000 || lo > hi) return { min: null, max: null, confidence: 'absent' };
  return { min: Math.round(lo), max: Math.round(hi), confidence };
}
