export type BenchmarkSource = {
  id: string;
  label: string;
  lens: 'multinational-total-comp' | 'remote-foreign-employer' | 'contractor-market';
  measure: string;
  currency: 'CRC' | 'USD';
  p25?: number;
  p50?: number;
  p75?: number;
  low?: number;
  high?: number;
  unit?: 'year' | 'hour';
  sample?: string;
  asOf: string;
  url: string;
  note?: string;
};

export type CostaRicaRoleBenchmark = {
  slug: string;
  title: string;
  cocrCodes?: string[];
  cocrLabel?: string;
  cocrNote?: string;
  sources: BenchmarkSource[];
};

export const CR_BENCHMARKS: CostaRicaRoleBenchmark[] = [
  {
    slug: 'software-engineer',
    title: 'Software Engineer',
    cocrCodes: ['2512'],
    cocrLabel: 'Desarrolladores de software',
    cocrNote: 'Direct COCR-2011 occupation match. The official ECE distribution will be published after the rolling-four-quarter weighted pipeline clears the sample floor.',
    sources: [
      {
        id: 'levels', label: 'Levels.fyi', lens: 'multinational-total-comp',
        measure: 'Total compensation in Costa Rica', currency: 'CRC',
        p25: 15051614, p50: 25086024, p75: 34781693, unit: 'year', asOf: '2026-08-17',
        url: 'https://www.levels.fyi/t/software-engineer/locations/costa-rica',
        note: 'Includes base, stock and bonus where reported. This is not a base-salary median.',
      },
      {
        id: 'plane', label: 'Plane', lens: 'remote-foreign-employer',
        measure: 'Remote employee base salary', currency: 'USD',
        p50: 50990, low: 12537, high: 104743, unit: 'year', asOf: '2026-07',
        url: 'https://plane.com/salaries/software-engineer/costa-rica',
        note: 'Plane reports the 10th, 50th and 90th percentiles for remote employees in Costa Rica.',
      },
      {
        id: 'hiretalent', label: 'HireTalent.lat', lens: 'remote-foreign-employer',
        measure: 'Modeled remote-for-US-company range', currency: 'USD',
        low: 40000, p50: 58000, high: 96000, unit: 'year', asOf: '2026-03',
        url: 'https://hiretalent.lat/salaries/software-developer-in-costa-rica',
        note: 'Modeled benchmark for US companies hiring remotely, not a local payroll survey.',
      },
      {
        id: 'lemon', label: 'Lemon.io', lens: 'contractor-market',
        measure: 'Senior contractor hourly rate', currency: 'USD',
        p50: 34, low: 26, high: 51, unit: 'hour', sample: 'n=38 senior contracts', asOf: '2026-08',
        url: 'https://lemon.io/rate-calculator/costa-rica/',
        note: 'Observed vetted contract rates. Contractor pricing is not employee salary.',
      },
    ],
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    cocrCodes: ['2163'],
    cocrLabel: 'Diseñadores de productos y de prendas',
    cocrNote: 'COCR 2163 is the closest official product-design category, but digital product design may also be coded elsewhere depending on actual tasks. Treat the mapping as approximate until validated against the microdata and coding manual.',
    sources: [
      {
        id: 'levels', label: 'Levels.fyi', lens: 'multinational-total-comp',
        measure: 'Total compensation in Costa Rica', currency: 'CRC',
        p25: 10099041, p50: 13939710, p75: 14869024, unit: 'year', asOf: '2026-08-17',
        url: 'https://www.levels.fyi/t/product-designer/locations/costa-rica',
        note: 'Includes base, stock and bonus where reported.',
      },
      {
        id: 'hiretalent', label: 'HireTalent.lat', lens: 'remote-foreign-employer',
        measure: 'Modeled remote-for-US-company range', currency: 'USD',
        low: 28000, p50: 37000, high: 55000, unit: 'year', asOf: '2026-03',
        url: 'https://hiretalent.lat/salaries/product-designer-in-costa-rica',
        note: 'Modeled benchmark for a remote hire paid by a US company.',
      },
    ],
  },
  {
    slug: 'accountant',
    title: 'Accountant',
    cocrCodes: ['2411'],
    cocrLabel: 'Contadores',
    cocrNote: 'Direct COCR-2011 occupation match. The official ECE salary distribution will use salaried workers only and a rolling four-quarter sample.',
    sources: [
      {
        id: 'levels', label: 'Levels.fyi', lens: 'multinational-total-comp',
        measure: 'Total compensation in Costa Rica', currency: 'CRC',
        p50: 12018496, unit: 'year', asOf: '2026-08',
        url: 'https://www.levels.fyi/t/accountant/locations/costa-rica',
        note: 'Total compensation. The public page currently exposes a median but not a robust percentile band.',
      },
      {
        id: 'hiretalent', label: 'HireTalent.lat', lens: 'remote-foreign-employer',
        measure: 'Modeled remote-for-US-company range', currency: 'USD',
        low: 22000, p50: 29000, high: 43000, unit: 'year', asOf: '2026-03',
        url: 'https://hiretalent.lat/salaries/accountant-in-costa-rica',
        note: 'Modeled benchmark for remote accountants hired by US companies.',
      },
    ],
  },
  {
    slug: 'product-manager',
    title: 'Product Manager',
    cocrNote: 'No single COCR-2011 code is defensible from the title alone. The official code depends on the actual managerial, marketing and product responsibilities, so PivotHop should not manufacture an INEC Product Manager median.',
    sources: [
      {
        id: 'levels', label: 'Levels.fyi', lens: 'multinational-total-comp',
        measure: 'Total compensation in Costa Rica', currency: 'CRC',
        p25: 30250918, p50: 38858636, p75: 53522161, unit: 'year', asOf: '2026-08-15',
        url: 'https://www.levels.fyi/t/product-manager/locations/costa-rica',
        note: 'Includes base, stock and bonus where reported.',
      },
      {
        id: 'hiretalent', label: 'HireTalent.lat', lens: 'remote-foreign-employer',
        measure: 'Modeled remote-for-US-company range', currency: 'USD',
        low: 39000, p50: 52000, high: 77000, unit: 'year', asOf: '2026-03',
        url: 'https://hiretalent.lat/salaries/product-manager-in-costa-rica',
        note: 'Modeled benchmark for a remote hire paid by a US company.',
      },
    ],
  },
];

export const CR_BY_SLUG = Object.fromEntries(CR_BENCHMARKS.map((r) => [r.slug, r])) as Record<string, CostaRicaRoleBenchmark>;
