# Costa Rica salary intelligence

Status: implementation spec, 2026-08-24

## Product goal

Build `/salary/by-country/costa-rica` as a transparent hiring and salary-intelligence surface, then create role pages under `/salary/by-country/costa-rica/[occupation]` only when the evidence clears a publication threshold.

The page must not collapse incompatible salary markets into one fake median. A local payroll salary, multinational total compensation, a US-company remote offer, and a contractor hourly rate answer different questions.

## The four lenses

### 1. Official local employee market

Primary source: INEC Encuesta Continua de Empleo (ECE), rolling four quarters.

Use the public-use microdata and calculate weighted distributions ourselves.

Fields:
- `Cod_ocupacion`: four-digit COCR-2011 occupation code.
- `Posicion_empleo`: keep `1 = Asalariado` for the employee benchmark.
- `Ingreso_bruto_principal_monet`: monthly gross monetary income in the main job.
- `Ingreso_bruto_principal_hora`: gross hourly income as a cross-check.
- quarter survey weight (`Vxxx`, documented by the ECE file).

Method:
1. Stack the latest four completed ECE quarters.
2. Keep salaried workers only.
3. Drop missing / sentinel income values and non-positive income.
4. Map PivotHop occupations to one or more explicit COCR-2011 four-digit codes. Never infer a code silently.
5. Calculate weighted P25, P50 and P75 of monthly gross monetary income.
6. Publish raw sample `n`, weighted population estimate, quarter range, and COCR mapping next to the figure.
7. Flag a benchmark as low-confidence below 30 raw observations across the pooled four quarters; do not index a role page from official data alone below that floor.

Why four quarters: many professional four-digit COCR cells are small in one ECE quarter. Pooling a rolling year improves stability while keeping the benchmark current.

Important: INEC is a local labor-market benchmark, not a remote-US-company benchmark.

Official references:
- ECE II Trimestre 2026 catalog: https://sistemas.inec.cr/nada5.4/index.php/catalog/384
- COCR occupation code variable: https://sistemas.inec.cr/nada5.4/index.php/catalog/384/variable/F4/V701?name=Cod_ocupacion
- Employment position: https://sistemas.inec.cr/nada5.4/index.php/catalog/384/variable/F4/V893?name=Posicion_empleo
- Gross monthly monetary income: https://sistemas.inec.cr/nada5.4/index.php/catalog/384/variable/V978
- Gross hourly income: https://sistemas.inec.cr/nada5.4/index.php/catalog/384/variable/V979
- COCR-2011 manual: https://sistemas.inec.cr/sitiosen/sitiosen/Archivos/COCR_2011.pdf

## 2. Multinational / total-comp market

Use sources such as Levels.fyi where there is a direct role-country page. This measures total compensation and can include bonus and equity, so it must never be labeled as base salary.

Store source date and P25/P50/P75 when available. Attribute every displayed figure with an outbound source link.

Initial direct benchmarks:
- Software Engineer: https://www.levels.fyi/t/software-engineer/locations/costa-rica
- Product Designer: https://www.levels.fyi/t/product-designer/locations/costa-rica
- Product Manager: https://www.levels.fyi/t/product-manager/locations/costa-rica
- Accountant: https://www.levels.fyi/t/accountant/locations/costa-rica

## 3. Remote-for-foreign-employer market

Keep this separate from local salaries. It answers: what might a foreign company pay someone located in Costa Rica?

Useful sources vary by role and methodology:
- Plane: remote employee base-salary benchmark and estimated employment cost.
- HireTalent.lat: modeled US-company remote salary ranges by role and country; label it as an estimate, not observed local payroll.
- Lemon.io: actual vetted contract rates for software developers; label contractor rates and seniority/sample separately.

Examples:
- Plane Software Engineer: https://plane.com/salaries/software-engineer/costa-rica
- HireTalent Software Developer: https://hiretalent.lat/salaries/software-developer-in-costa-rica
- HireTalent Product Designer: https://hiretalent.lat/salaries/product-designer-in-costa-rica
- HireTalent Product Manager: https://hiretalent.lat/salaries/product-manager-in-costa-rica
- HireTalent Accountant: https://hiretalent.lat/salaries/accountant-in-costa-rica
- Lemon.io developer rates: https://lemon.io/rate-calculator/costa-rica/

## 4. Live advertised market — PivotHop

Use PivotHop postings only as their own lens:
- Costa Rica-located or Costa Rica-eligible jobs.
- number of live listings;
- number with stated pay;
- P25/P50/P75 only when the observation floor is met;
- remote share and current companies hiring when useful.

Never let PivotHop postings overwrite the official or external benchmarks. They describe advertised openings, which can skew toward multinational and remote-friendly employers.

## Legal floor and employer cost

These are context, not salary benchmarks.

### MTSS minimum wages

Show relevant 2026 generic qualification floors separately from market salaries. For example the official list includes university bachelor and licentiate categories. Do not imply that a qualification floor is the market rate for a profession.

Source: https://www.mtss.go.cr/temas-laborales/salarios/lista_salarios_minimos_2026.pdf

### CCSS / employment cost

Employer-cost estimates must cite the current CCSS rates and distinguish employee deductions from employer contributions. Do not copy a third-party “tax percentage” into PivotHop as if it were law.

Use the current CCSS patron calculator / official contribution material when implementing the hiring-cost module.

## Role mapping

Every publishable role receives a small research record:

```ts
{
  pivotHopSlug: 'software-engineer',
  title: 'Software Engineer',
  cocrCodes: ['2512'],
  cocrLabel: 'Desarrolladores de software',
  sources: [...],
  mappingNote: 'Direct occupation match',
}
```

Some modern titles do not map cleanly to COCR-2011. Product Manager is an example where responsibilities determine whether a managerial or professional code is appropriate. For ambiguous titles, show the external and live-posting lenses but do not manufacture an INEC role-specific figure.

## Publication / indexing gate

A country-role page may be indexable when at least one of these is true:
- official pooled ECE raw `n >= 30` with a direct/defensible COCR mapping; or
- two independent reputable market sources measure the role directly, plus useful PivotHop market context.

Every indexable page must have:
- at least two genuinely different data lenses or one strong official distribution plus live-market context;
- source dates and links;
- a written explanation of what each number measures;
- live role/job context when available;
- a CTA to the salary calculator and employer posting flow.

Otherwise keep the role in the country hub but do not generate/index a thin role page.

## Refresh cadence

- PivotHop postings: nightly.
- ECE: on each INEC quarterly release; recompute rolling four quarters.
- MTSS: annual / when the official list changes.
- CCSS: whenever official contribution rates change.
- External salary benchmarks: monthly check, store the observed source date and page's own update date when shown.

## Source ledger principle

Every displayed number should be answerable with four fields:

`Source · What it measures · Sample/method if known · As-of date`

The UI should make disagreement useful. If local employee pay, multinational total comp and remote-US pay differ sharply, explain why instead of averaging them.
