---
name: pivothop-voice
description: |
  The PivotHop house voice for blog posts and site copy, plus the specific
  writing tells of this project's AI collaborator that must be caught and
  rationed. Use together with the humanizer skill when drafting or editing
  any blog post: draft, then audit against BOTH skills, then revise.
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
---

# PivotHop house voice

Deadpan, editorial, numbers over adjectives. The register of a careful trade
journalist who happens to own the dataset. Warm is fine; motivational is not.

## Hard rules (never break)

- No em dashes. Use periods, commas, colons, or parentheses.
- No exclamation points. No rhetorical questions as section openers.
- Numbers over adjectives: "1,698 postings" not "a huge dataset".
- Every claim traceable: our pipeline, a named dataset, or a dated news source.
- Bold is a signpost for load-bearing numbers and claims, never whole sentences.
- Conclusions are earned, not appended. "Where this leaves you" must contain
  a decision aid, not a recap.

## The collaborator's tells (catch and ration these)

These are the known habits of this project's AI writer. A post may keep AT
MOST ONE of each per piece; more than that and it reads machine-made:

1. **The aphoristic closer.** Every section ending in a quotable punchline
   ("Medians do not give interviews."). One per post, maximum. Most sections
   should end on information, not applause.
2. **The triad.** Three parallel items, three parallel sentences, rule of
   three everywhere. Break the rhythm: use two, or four, or a list.
3. **"The honest X" / "measured" / "priced" lexicon.** House words, worn out
   by repetition. Each may appear once per post. Find plain synonyms or cut.
4. **The colon hinge.** "The pattern: ..." / "The catch: ...". Two per post,
   maximum.
5. **The appositive pile.** Sentences accumulating ", which is..." clauses.
   Split them.
6. **Anaphora openers.** Consecutive sentences or paragraphs opening with the
   same word ("The... The... The..."). Vary or merge.
7. **The mirrored antithesis.** "X is not A. It is B." Powerful once, tic
   twice. One per post.
8. **Over-tidy paragraphs.** Every paragraph the same 3-4 sentence shape.
   Let one run long, let another be a single sentence, occasionally.
9. **Meta-narration.** "Here is what the data says" / "Read that again" /
   "Notice the pattern". Trust the reader; show the thing.
10. **The disclaimer flourish.** Turning every honesty note into a bow
    ("...which we mention because apparently it needs saying"). Honesty
    notes should be flat.

## What human sounds like here

- An observation that is slightly too specific to be invented.
- A sentence that starts mid-thought because the previous one earned it.
- An admission without ceremony ("We got this wrong for two weeks.").
- Small asides in parentheses, used sparingly (like this one).
- A number given roughly when precision would be false ("about half"),
  precisely when it matters ("44 percent").
- Occasional first person singular from Carlos where biography warrants it.

## Workflow for every post

1. Draft to the docs/16 playbook spec (structure, visuals, FAQs, schema).
2. Audit pass with the humanizer skill patterns AND the tells list above.
   Count violations per tell; enforce the rations.
3. Read the post aloud in your head at speaking pace. Anywhere you hear the
   same drumbeat twice, change the drum.
4. Final check: zero em dashes, bold-only-numbers, sources box, one
   aphorism budget spent or banked.
