# Redesign V2 · 05 · Migration plan (Step 3)

*Decisions locked 2026-08-20 with Carlos. The design step is closed on seven
prototyped families. Everything below happens on `redesign-v2`; merging to
production is a separate, final decision.*

## Locked decisions
1. **Theme: user toggle, sitewide.** Both measured worlds ship: dark (black,
   gold #F0B43C, the Creative Boom jobs statement) and light (white, electric
   violet #6219FF, the It's Nice That world). Toggle lives in the nav.
   Initial theme = the visitor's `prefers-color-scheme`; an explicit choice
   persists in localStorage and wins thereafter. A tiny inline head script
   applies the stored class before first paint so neither mode ever flashes.
2. **Typeface: Instrument Sans stays** (brand continuity, already
   self-hosted). A licensed grotesk (Roobert / Diatype class) remains an open
   option Carlos may buy later; the token system makes that a one-line swap.
3. **Accents: the violet/gold pair as measured.** `--value` is mode-aware;
   `--amber`/fills follow the mode. No third accent; semantic coral stays for
   gaps only.
4. **Match figures** live in the inspector and the measure, never as a row
   column.

## Order (from the brief §21, unchanged)
- **Phase A · jobs family**: `/jobs` board → occupation pages → facet pages →
  job detail → expired states.
- **Phase B · career intelligence**: routes hub → route pages → compare →
  salary.
- **Phase C · editorial**: home → research index → articles → adjacency
  index → glossary → about/employers → specials.

## The gates (every template, no exceptions)
Before a family is called migrated, diff against `03-baseline.md` capture:
URL, status, canonical, robots, title/description intent, JSON-LD blocks,
H1/H2 semantics, server-rendered text presence, internal link destinations,
sitemap inclusion. Plus: the class-collision audit against `globals.css`
(the lab hit real collisions twice), `npm run build`, `check:links`, and
both-mode screenshots reviewed. Presentation changes only; anything that
would touch SEO behavior stops and gets documented first.

## Mechanics
- V2 styles enter production templates as a namespaced stylesheet under a
  `.v2` page wrapper (the lab's audited approach), imported only by migrated
  routes; `globals.css` remains untouched until the last template leaves it.
- The theme bootstrap (inline script + nav toggle + localStorage contract) is
  shared infra built once at the start of Phase A.
- Migrated pages keep their exact TSX data/SEO output; markup changes are
  presentational, and where markup must move, the gate diff proves the
  crawlable content survived.

## Status
- [x] Theme bootstrap infra (2026-08-20)
- [x] Phase A: /jobs (2026-08-20, gates green)
- [x] Phase A: /jobs (2026-08-20, gates green)/[occ]
- [ ] Phase A: facet pages
- [x] Phase A: /jobs (2026-08-20, gates green)/[occ]/[id] + expired states
- [ ] Phase A SEO regression sign-off → then B, then C
