# Multilingual title mapping

*How the miner reads job titles that are not in English. Phase 1 (Spanish +
Portuguese) shipped 2026-07-29. Implementation: `apps/scraper/src/normalize/titles-i18n.js`.*

---

## The loss this addresses

Title mapping is the miner's largest single loss. Roughly a third of every raw
posting never reaches an occupation, and therefore never reaches the board or the
graph. Part of that third is vocabulary — job titles we have no occupation for.
Part of it is not vocabulary at all. It is language.

Measured against the live corpus on 2026-07-29:

| | |
|---|---|
| Unmapped postings with a Spanish or Portuguese title | 1,217 (938 distinct) |
| Where they come from | Adzuna's ES/MX/CO/BR markets, GetOnBoard's LatAm feed |
| GetOnBoard ingested / surviving normalize, before | 1,035 / 402 (38.8%) |
| GetOnBoard surviving normalize, after | 534 (51.6%) |
| Corpus mapping rate, before → after | 63.8% → 64.2% |
| Distinct unmapped titles, before → after | 50,747 → 50,246 |

GetOnBoard is the clearest case: the source had just been paginated from 226 to
1,035 ingested postings, and more than half of the new volume was landing on the
floor because its titles read "Ingeniero/a DevOps Senior".

## Why a translation layer and not synonyms

The obvious fix is to paste Spanish strings into each occupation's `synonyms[]`
in `packages/data/taxonomy/occupations.json`. It was rejected: Spanish needs one
entry per gender × number × qualifier combination — *ingeniero de datos*,
*ingeniera de datos*, *ingeniero/a de datos*, *ingenieros de datos* — across 180
occupations, and none of that work transfers to the next language.

The layer translates instead, then hands a plain English title to the matcher
that already exists. One table per language; the occupation taxonomy stays
monolingual.

## The hard part is word order

Romance job titles are **head-initial**: *ingeniero de software* is
engineer-of-software. English is **head-final**: software engineer. A
word-for-word swap produces "engineer of software", which matches nothing.

So translation is followed by a reordering pass that moves the head noun to the
end. That single rule is what makes the layer work at all.

Two refinements were learned from the corpus, not from theory:

- **Take the FIRST head noun, not the last.** Because Romance is head-initial,
  the leading noun is the job and everything after it qualifies. Taking the last
  head turned *Consultora de Médicos* — a consultant **for** doctors — into a
  physician.
- **Curated multiword phrases run before the word table**, because their parts
  translate wrong in isolation. *Recursos humanos* is not "resources human", and
  *representante médico* is a pharmaceutical sales rep in Latin America, not a
  doctor.

## The guard that keeps English safe

The first working version mapped 1,424 postings — and roughly half of them were
false. `senior` and `junior` sat in the word table as tokens to drop, so any
English title containing them counted as "translated", got reordered, and matched
the wrong job. *Senior Forward Deployed Engineer – Full stack* came out a
software-engineer; *Junior Designer – Growth and Marketing* came out a
graphic-designer.

This is the same failure as the greedy skill aliases: a weak signal treated as
proof. The fix has three parts, and the third is the real one:

1. Dropped tokens live in their own `DROP` set and count as evidence of nothing.
2. Words spelled identically in English — *civil*, *legal*, *industrial*,
   *visual* — are translated but never counted as evidence either (`ALSO_ENGLISH`).
3. **The head noun must itself be Romance-derived.** Provenance is tracked
   per-word through translation; if the head came from a word that was already
   English, the layer returns null and the title stays unmapped.

After the guard: 724 postings, 73 occupations, and a full-corpus scan finds zero
English titles routed through the tier.

The layer also runs **only after English matching has already failed**, as the
last tier of `mapTitle`. Combined with the head guard, the ~64% that map today
cannot regress through it.

## Accent folding (a bug fixed on the way)

`cleanSegment` mapped every non-ASCII byte to a space, so *médico* became "m
dico" and *Ingénieur Système* became three fragments. Worse, the accented and
unaccented spellings of one word could never match each other, though the corpus
carries both — *diseñador gráfico* (6) and *diseñador grafico* (3) are the same
job. Titles and synonyms are now NFD-folded before the character filter. This is
language-agnostic and helps every phase below.

## Honest misses are correct

Spanish must never map what English would not. *Técnico Mecánico* translates
cleanly to "mechanical technician" and then maps to nothing — because
"Mechanical Technician" maps to nothing in English either. That is a taxonomy
gap, not a translation bug, and closing it belongs to a different piece of work.
Leaving it unmapped keeps the two paths consistent.

## Protected by the gate

24 cases were added to `apps/scraper/test/gold.json` (47 → 71 titles), including
the negative cases: the two English titles that leaked, and a French title that
must stay unmapped until phase 3. The gold set runs in `verify`, which is the
nightly publish gate.

## Phases

Deliberately one language at a time — each pass exposes bugs in the shared
machinery that the next language would otherwise inherit.

| Phase | Language | Status | Prize |
|---|---|---|---|
| 1 | Spanish + Portuguese | **shipped 2026-07-29** | +698 postings; GetOnBoard +33% |
| 2 | German | next | `arbeitnow` survives at 26.1% (2,525 raw → 660) — the worst rate of any source |
| 3 | French | after | Adzuna FR, plus the Canadian bilingual postings |

German needs a genuinely different rule and is the reason phase 2 is separate
work rather than another table: German is **head-final and compounds**
(*Softwareentwickler*, *Bauingenieur*), so the reorder pass is unnecessary but
compound splitting is required — the opposite problem from Romance.
