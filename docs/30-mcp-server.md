# The MCP server

*`apps/mcp` — PivotHop's measurement as a tool AI assistants can call. Built
2026-07-31. Package: `pivothop-mcp` (unscoped, npm).*

---

## Why

When someone asks an assistant *"what can an architect become?"*, the answer is
assembled from scraped prose. This makes it come from measurement instead.

It is **defensive** before it is offensive. The `llms.txt`, the Adjacency Index
and the AEO work all exist because the front door is shifting from Google to
chat. If people stop typing URLs, being the thing that gets *called* is how you
stay reachable.

And it fits the doctrine in a way an apply-agent never could: a read-only tool
over data we already regenerate nightly. No accounts, no stored credentials, no
per-ATS integrations, no liability for what an agent submitted in someone's
name. Those five things are what make auto-apply a team-sized product.

## Architecture

**Local stdio server.** An `npx` package that runs on the *user's* machine and
fetches our public JSON. There is no PivotHop-hosted endpoint in the loop.

That matters for one recurring suggestion — *"put an API key on it, rate-limit
it, stop competitors scraping your scraped data."* It cannot work as described,
because:

- the data is already public and unauthenticated — `pivothop.com/data/architect.json`
  is how the website itself works. A competitor would fetch the files, not the tool.
- there is no server of ours to rate-limit. Gating would mean building a hosted
  service *and* locking down the public JSON, which breaks our own site.

What actually protects the corpus is the **measurement**, not the transport.
Anyone can scrape postings. The taxonomy, licence gates, head-noun guards,
contamination fixes and Spanish mapping are months of judgement and none of it
is in the JSON.

A paid tier makes sense later on things that are genuinely *not* public: the raw
corpus, historical time series, or the employer product (who-can-reach *plus*
the ranked hiring-company list). Built after one paying employer, not before one
user.

## Tools

| Tool | Question |
|---|---|
| `career_routes` | "what can an X become" — the candidate side |
| `skill_gap` | two named roles: readiness, transferable skills, gap, licence |
| `who_can_reach` | **the employer side.** which occupations already cover a role you're hiring for |
| `salary` | posted band, optionally per country |
| `list_occupations` | all 180 and which have measured routes |

`who_can_reach` is the commercially interesting one. Someone asking *"who else
could do this job?"* is a hiring manager with an unfilled role — precisely the
person `/admin/outreach` is trying to email.

## The honesty rule

Occupations below the 50-posting floor return an explicit `insufficient_data`
answer naming the limit. Never an empty object the model can fill in. Never a
guess. Licence gates are reported as hard gates, because no skill overlap
shortens a degree.

**A tool that invents once is dropped forever; one that says "I don't have
enough data on brewmasters" keeps getting called.** The README quotes no
hardcoded coverage count — `list_occupations` reports the live split — because a
stale number in a README is the same lie in slower form.

## Three bugs testing caught

Written down because each is a class, not an incident.

1. **`plumbernaut` returned confident plumber data.** The resolver accepted any
   substring, and "plumber**naut**" contains "plumber". A typo resolving to real
   numbers is exactly what gets a tool distrusted permanently. Fixed with a
   whole-segment match: `senior-ux-designer` still finds `ux-designer`.
2. **`interior designer` would not resolve** while simultaneously being returned
   as a route destination — resolving against `occ-meta.json` (131) when the
   graph emits 180. Now uses `origins.json`: all 180 plus taxonomy **synonyms**,
   so "web designer" lands on UX Designer without guessing.
3. **`who_can_reach` fired 180 parallel fetches per call**, which would have
   hammered the CDN once per question. `export-web-data.py` now precomputes
   `inbound.json` (destination → ranked origins, 146 destinations, 240KB) — one
   fetch. The scan survives as a fallback so the tool works before that file
   deploys.

## Measuring whether it is used

Two signals, deliberately measuring different things:

| signal | where | what it means |
|---|---|---|
| npm downloads | npmjs.com/package/pivothop-mcp | **installs** |
| User-Agent `pivothop-mcp/*` | Vercel request logs | **queries** — every tool call fetches our JSON |
| `?utm_source=mcp` | PostHog / analytics | **click-throughs** to the site |

The gap between them is the interesting reading. High queries with near-zero
clicks means the tool is answering well and keeping people in chat — which is
the known cost of this channel, and better measured than assumed.

Both the citation sentence and the structured `url`/`source` fields carry the
tag. Pages have canonical tags to the clean URL, so it does not fork the
crawlable surface.

## The citation line

Structured `source` fields are droppable — an assistant summarising into prose
keeps the numbers and loses the attribution. So every answer carries a
*sentence*, which survives summarisation because it reads as part of the answer:

> Measured by PivotHop from live job postings. Architect covers 62% of what
> Interior Designer postings ask for. Full working:
> pivothop.com/routes/architect-to-interior-designer?utm_source=mcp

Including on the empty states — *"below the posting floor needed for a
defensible route"* is still a claim worth attributing, and it is the one that
demonstrates we say so rather than guess. The tool result also appends an
instruction to relay it: a field the model was never told to use is a field it
drops.

## Publishing

```bash
npm login
cd apps/mcp && npm publish
```

Then the registries (all free, browser-based): the official MCP Registry,
mcp.so, smithery.ai, glama.ai/mcp, lobehub.com, and a PR to
`punkpeye/awesome-mcp-servers`.

**Tool descriptions are the SEO of MCP.** A model picks a tool by matching the
user's phrasing against the description, so they are written around what people
actually type — *"what can an X become"*, *"who else could do this job"* — not
our internal vocabulary. That mapping is the discovery mechanism and is worth
tuning if real usage shows misses.
