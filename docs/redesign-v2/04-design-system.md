# Redesign V2 · 04 · Design system

*Extracted 2026-08-20 after anchor approval ("too cold, lacks life; as a first step it works"), which is why warmth is a token decision here rather than a later patch. Everything lives in `apps/web/src/app/design-lab/` (`v2.css` + `system.tsx`) until migration begins.*

## The dark pass (creativeboom.com/jobs, measured 2026-08-20)

Measured, not eyeballed: Creative Boom's site body is white with **Roobert**
(Displaay) at 60px/500 for H1s, and their new jobs board is a **pure black
`#000` statement section** inside the light site. Row anatomy from their board:
huge "Title at Company" line with the connective in grey, one loud color
(gold) reserved for salary, quiet hairlines, and outlined pill Apply actions.
The class of design-led boards (It's Nice That, If You Could) shares the
pattern: type does the layout, chrome stays silent, one color carries value.

**Dual mode (2026-08-20):** dark is the default and the statement; the light
mode is measured from the same world's light citizens (It's Nice That runs
Bradford on white with #141414 ink; If You Could runs ABC Diatype the same
way): white field, `--surface #FAF8F2`, the measured CB cream `#FBF7EF` as
selection fill, and the gold deepened to `#A8790E` for text contrast on white
(`--value` is the mode-aware readable gold; `--amber #F0B43C` stays the fill
gold in both modes). The lab bar carries the toggle; the choice persists.
Panels follow the grammar in both modes: mono uppercase rail labels, gold
checks, 30px gold salary in the inspector, mono pager, pill filter tokens.

Applied here: black field, `--amber #F0B43C` replaces cobalt as the value
color (salary, match, measure, active dot, the one filled Apply), pill
outlines for actions, 23px row titles with the grey "at", and the warmth now
lives in the monogram tints against black. The light tokens below are kept as
the documented alternate; CB itself proves the hybrid (dark board sections
inside a light editorial site) is a legitimate end-state to choose later.

## Tokens

| Token | Value | Note |
|---|---|---|
| `--bg` | `#FDFCF9` | near-white with a warm hair; the creativeboom.com pass (their body measures #FFFFFF with a #FBF7EF cream accent surface) |
| `--surface` | `#FFFFFF` | pure white |
| `--bg-2` | `#FBF7EF` | the measured Creative Boom cream, demoted to supporting surface: selection fill, hovers |
| `--text` | `#1A1712` | warm near-black |
| `--text-2` | `#6B665B` | secondary |
| `--border` / `--border-strong` | `#E9E3D6` / `#C6BFAE` | rules and controls |
| `--accent` | `#234BFF` | ONE accent: active nav, match emphasis, selection marker, measure tick, brand-value links |
| `--pos` / `--gap` / `--amber` | `#3D7A50` / `#C4573A` / `#B07C24` | semantic only: overlap, gap, caution |
| spacing | 4 · 8 · 16 · 24 · 32 · 48 · 64 | `--s1..--s7` |
| radius | 3px (`--r`) · 6px monogram tiles | low, never pill except legacy contexts |
| motion | 180ms `cubic-bezier(.3,.7,.3,1)` | underline, row hover, selection |

## Type
- **Instrument Sans** for all UI (swapped from Inter in the warmth pass: warmer letterforms AND continuity with production's brand face, so V1 and V2 share an identity thread).
- **JetBrains Mono** only where content is data: figures, `.vnum` tabular columns, `.lab` labels (10px uppercase, sparing).
- Scale: hero clamp(34..54) 650 · page 24 · job title 15.5/600 · body 15/1.55 · meta 12.5 · label 10.

## Signature gestures (exactly two)
1. **The measure**: origin dot, 1px rule, accent tick at the target, covered-share fill, mono caption. Appears on inspectors, route pages, and the homepage.
2. **Monogram tints**: deterministic warm-tinted company tiles (6 muted pairs, hash of the name). This is the "life" in the rows; it also previews how real logos slot in.

## Interaction
- **Underline** (`.ul`): 1px, 3px below baseline, sweeps left→right in 180ms, overshoots 3px. Near-black default; `.ul-accent` reserved for brand-meaningful actions.
- Primary button: black, hover → accent. Ghost: hairline border. Text actions for tertiary.
- Selected row: surface change + 2px accent left marker. Focus: 2px accent outline, offset 2.

## Components (`system.tsx`)
`V2Nav` · `LabBar` (lab chrome only) · `Monogram` · `RouteMeasure` · `SearchUnit` · `FilterToken` · `Pill(have|miss)` · `Stat`. Row and inspector remain inline in the board page until a second surface needs them (the brief's extraction rule). CSS-only primitives: `.rows/.row`, `.insp`, `.tokens/.tok`, `.sec-rule`, `.vstats`, `.lab`, `.ul`.

## Hard-learned rule for migration
Production `globals.css` loads on every route, so **every V2 class name must be audited against it before use**; the lab hit collisions twice (`.hero`, `.search`, `.go`, `.sel`, `.on`, `.k`, `.v`...) and now holds zero. During migration the same audit gates every template family, until the day globals.css itself is retired.

## Deliberately not designed yet
Mobile choreography (bottom-sheet filters, sticky actions), loading/empty/error states, motion beyond the underline, real logo handling, dark contexts. Each lands with its first consuming template, styled from these tokens.
