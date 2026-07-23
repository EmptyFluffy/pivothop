'use client';
import { useState } from 'react';

export type CountryDatum = {
  code: string;
  name: string;
  p25: number;
  p50: number;
  p75: number;
  priceLevel: number | null;
  isUS: boolean;
  oews: number | null;
  employed: number | null;
};

const fmt = (v?: number | null) => (v == null ? '—' : '$' + Math.round(v).toLocaleString());

export default function SalaryFacts({
  countries,
  usMedian,
  unemployment,
  trendPct,
  trendFrom,
}: {
  countries: CountryDatum[];
  usMedian: number | null;
  unemployment: { rate: number; label: string } | null;
  trendPct: number | null;
  trendFrom: number | null;
}) {
  const [code, setCode] = useState(countries.find((c) => c.isUS)?.code ?? countries[0]?.code);
  const c = countries.find((x) => x.code === code) ?? countries[0];
  if (!c) return null;
  const adjusted = c.priceLevel ? c.p50 / c.priceLevel : null;
  const vsUS = !c.isUS && usMedian ? Math.round((c.p50 / usMedian - 1) * 100) : null;

  return (
    <div className="sal-facts-wrap">
      <div className="sal-cty-head">
        <span className="lbl">Pay in</span>
        <span className="sal-cty-sel">
          <select aria-label="Country" className="sal-cty" value={code} onChange={(e) => setCode(e.target.value)}>
            {countries.map((x) => (
              <option key={x.code} value={x.code}>{x.name}</option>
            ))}
          </select>
        </span>
        <span className="lbl sal-cty-n">
          {countries.length > 1 ? `${countries.length} markets measured` : 'one market measured'}
        </span>
      </div>
      <div className="rt-facts">
        <div><span className="v">{fmt(c.p50)}</span><span className="k">Median (blended)</span></div>
        <div><span className="v">{fmt(c.p25)}&ndash;{fmt(c.p75)}</span><span className="k">Typical range (25th&ndash;75th)</span></div>
        {c.isUS ? (
          <>
            {c.oews != null && <div><span className="v">{fmt(c.oews)}</span><span className="k">Official OEWS median</span></div>}
            {unemployment && <div><span className="v">{unemployment.rate}%</span><span className="k">Unemployment 2025</span></div>}
            {trendPct != null && trendFrom != null && <div><span className="v">{trendPct > 0 ? '+' : ''}{trendPct}%</span><span className="k">OEWS since {trendFrom}</span></div>}
            {c.employed != null && <div><span className="v">{Math.round(c.employed / 1000)}k</span><span className="k">US employed</span></div>}
          </>
        ) : (
          <>
            {c.priceLevel != null && <div><span className="v">{c.priceLevel.toFixed(2)}</span><span className="k">Cost of living (US = 1.00)</span></div>}
            {adjusted != null && <div><span className="v">{fmt(adjusted)}</span><span className="k">Adjusted to US cost</span></div>}
            {vsUS != null && <div><span className="v">{vsUS > 0 ? '+' : ''}{vsUS}%</span><span className="k">vs US median</span></div>}
          </>
        )}
      </div>
    </div>
  );
}
