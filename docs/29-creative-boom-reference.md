# Creative Boom — design reference

*Measured from creativeboom.com on 2026-07-30, not described from memory. The
north star for "Swiss but not stiff": serious structure, friendly surface.
Adopted pieces are recorded in `docs/01-style-direction.md`; this file is the
source material and the reasoning.*

> An earlier version of this analysis measured **designboom.com** by mistake.
> Different site, different system. Where the two disagree, this file wins.

---

## Stack

| | |
|---|---|
| CSS | **Tailwind v4** — `--tw-*` and `--color-*` theme tokens, `oklch()`, `rounded-full` compiled to `3.40282e38px` |
| Stylesheet | one file, **88KB**, `/assets/front/css/main.<hash>.css` |
| Backend | custom, PHP-shaped (`/assets/front/` convention). No `__NEXT_DATA__`, no `wp-content` |
| Edge | Cloudflare |

**No React. No Next.js.** Same conclusion the designboom read reached by a
different route: the site that reads as warm and expensive is hand-built CSS on
an unremarkable backend. PivotHop is already on a more modern stack than its own
reference. **The gap is never the framework.**

## Type

**ABC Diatype** (ABC Dinamo, commercial licence). A grotesk that is Swiss-adjacent
but warmer than Helvetica — a real share of the friendliness is simply that face.

Three roles: `--font-display`, `--font-sans`, `--font-mono`.

**We are not buying it.** Space Grotesk — already ours — is the closest good free
relative and is arguably more characterful. Non-negotiable #7 (two typefaces)
stands; a "display" role can be the same family at a different weight and optical
size, which is what we do.

## Colour — the mechanism worth stealing

Their tokens resolve to a complete named system, and the pattern is the whole
answer to "friendly but still serious":

| accent (saturated) | its pale wash |
|---|---|
| `orange-900` `#ff6432` | `orange-100` `#fcefed` |
| `lilac-900` `#ed91fa` | `lilac-200` `#f6ecfa` |
| `mist-900` `#b4dcdc` | `mist-200` `#f1f6f6` |
| `yellow-900` `#ffc828` | — |
| `green-900` `#05aa82` | — |

On a strict black ramp — `#000 · #1a1a1a · #333 · #4d4d4d · #999 · #b3b3b3 ·
#e6e6e6 · #f7f7f7` — over white and `cream-900 #fbf7ef`.

**Every accent exists twice: saturated for marks, ~3% saturation for
backgrounds.** The friendliness comes almost entirely from the washes. The
seriousness survives because the structural layer is a black ramp on cream and
colour never touches the type or the grid — it sits *behind* them.

This does not violate our non-negotiable #6. **A wash is not an accent, it is
paper.** Our `--paper #f5f3ed` is already essentially their `cream-900 #fbf7ef`,
and `--accent-tint #e3e8f7` is already a Klein wash — we invented the mechanism
and then used it once.

**Not copied:** their five saturated hues. A magazine needs a different identity
per article; an instrument needs one colour to mean one thing, which is why the
graph is readable at all.

## Radius

Mostly `0`. Sharp containers, selective `5px` / `8px`, and `rounded-full`
reserved for pills and circular icon buttons.

So the rule we had already reasoned our way to is confirmed by measurement:
**pill the touchpoints, keep the structure sharp.**

## Motion

`--default-transition-duration: .15s`, `--default-transition-timing-function:
cubic-bezier(.4, 0, .2, 1)` (ease-in-out).

We run 120–180ms on the browser default `ease`. **We are within noise of them.
Motion was never the gap.** Adopting their curve is a refinement, not a fix.

## The underline technique — the best single detail on the site

```
underline underline-offset-2 decoration-2
decoration-transparent transition-colors group-hover:decoration-black-900
```

The underline is **always rendered**, but its colour is transparent. On hover only
the `text-decoration-color` animates.

Because the underline is permanently in the layout, nothing reflows and nothing
jumps — it *fades in*. That is the entire reason it reads as contemporary and
expensive rather than as a default browser underline being switched on. Thickness
`2px`, offset `2px`.

Copy this exactly. It is free, it is a pure CSS idea, and it is the thing you
notice without being able to name.

## What we adopted, and when

- **2026-07-30** — hero underline on the emphasised word; nav in the wordmark
  face; chips pilled with the fade-underline state model and the `.15s
  cubic-bezier(.4,0,.2,1)` curve. Tokens `--ease`, `--dur`, `--r-pill`,
  `--r-soft` added to `globals.css`.

## What we deliberately have not adopted

- The multi-hue accent set (see above).
- Section washes beyond the existing `--accent-tint`. Designed, not shipped —
  worth doing next, as three papers that long pages alternate between.
- A third typeface.
