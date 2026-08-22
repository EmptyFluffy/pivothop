# PivotHop — OpenAI plugin submission packet

Prepared for the first public MCP-backed plugin submission.

## Submission type

- **Type:** With MCP (MCP-only; no custom UI required for v1)
- **MCP URL type:** Universal
- **Production MCP URL:** `https://www.pivothop.com/api/mcp`
- **Authentication:** None for the current read-only tools
- **Website:** `https://www.pivothop.com`
- **Support:** `https://www.pivothop.com/support`
- **Privacy:** `https://www.pivothop.com/privacy`
- **Terms:** `https://www.pivothop.com/terms`

## Listing copy

### Plugin name

PivotHop

### Short description

Measure realistic career pivots from live job-market data and find current jobs your existing skills can reach.

### Long description

PivotHop helps people answer a hard career question with market evidence: given the work they do today, which other careers and live jobs are actually within reach?

It measures career adjacency from live job postings and public labor-market data, then shows transferable skills, missing skills, salary bands, transition signals, licence gates, and current openings. Users can explore career routes, compare a specific skill gap, search normal job listings, or search jobs specifically across occupations that their current skills already cover.

PivotHop is deliberately honest about coverage. When there is not enough posting volume to publish a defensible result, it returns an explicit insufficient-data response instead of inventing a confident answer.

### Category

Choose the closest jobs/careers category offered by the submission portal. If no careers-specific category is available, use the closest productivity or professional-work category rather than an unrelated category.

## What the MCP exposes

### Career intelligence

1. `career_routes` — measured career destinations reachable from a current occupation.
2. `skill_gap` — measured gap between two named occupations.
3. `who_can_reach` — employer-side adjacent talent pools for a target occupation.
4. `salary` — salary band for an occupation, optionally per country.
5. `list_occupations` — coverage/discovery for tracked occupations.

### Live jobs

6. `search_jobs` — keyword and structured live-job search.
7. `get_jobs` — freshest jobs, optionally within one occupation.
8. `get_job_details` — one job's details and original apply URL.
9. `get_related_jobs` — current openings similar to one selected job.
10. `search_jobs_for_pivot` — PivotHop's differentiator: measure reachable destination occupations from the user's current occupation first, then search current jobs inside those destinations.

All 10 tools are read-only and are advertised as:

- `readOnlyHint: true`
- `openWorldHint: false`
- `destructiveHint: false`
- `idempotentHint: true`

They retrieve or compute information. They do not submit applications, publish jobs, send messages, change accounts, or modify public/external systems.

## Starter prompts

1. `I'm an architect. Find remote jobs I could realistically pivot into without starting over.`
2. `What careers can a UX designer move into, and what skills would they need to add?`
3. `Find current remote data analyst jobs in the US that list at least $90,000.`
4. `I'm hiring a BIM Manager. What adjacent occupations already cover most of the skills I need?`
5. `Compare the skill gap from architect to interior designer and show me current jobs related to the destination.`

## Positive review test cases

### Positive 1 — pivot-aware job discovery

**Prompt**

`I'm an architect. Show me remote jobs I could realistically pivot into.`

**Expected behavior**

Use `search_jobs_for_pivot` with `from=architect` and `remote=true`. Do not substitute a generic web/job search before measuring the career routes.

**Expected result shape**

A `from` occupation, readiness threshold, count of matching destination occupations/jobs, and live jobs containing a nested `pivot` object with destination, readiness percentage, transferable skills, missing skills, transition time when available, licence gate when applicable, and a PivotHop route URL.

**Fixture/account**

No account required. Uses current public production data.

### Positive 2 — normal job search

**Prompt**

`Find current remote data analyst jobs in the United States.`

**Expected behavior**

Use `search_jobs` with the appropriate occupation/country/remote filters.

**Expected result shape**

Live jobs with job id, title, company, location/country, remote flag, salary when present, posted date, and a PivotHop detail URL. The search result should not expose restricted/data-only source listings.

**Fixture/account**

No account required. Results vary with the live board.

### Positive 3 — job detail follow-up

**Prompt/workflow**

`Find a current remote architect job, then show me the full details and where I can apply.`

**Expected behavior**

Call `search_jobs` or `get_jobs`, take a returned `job_id`, then call `get_job_details` for that result.

**Expected result shape**

The selected job plus extracted skills, description sections when available, PivotHop URL, and the original employer/source `apply_url` with a note that the application happens outside PivotHop.

**Fixture/account**

No fixed job id; use a live id returned in the first step so the test remains valid as postings expire.

### Positive 4 — career routes

**Prompt**

`What can an architect realistically become?`

**Expected behavior**

Use `career_routes` for `architect`.

**Expected result shape**

Measured destinations ranked by readiness with transferable/missing skills, salary when available, transition time, demand/remote signals when available, and licence gates. Include the PivotHop citation/source line.

**Fixture/account**

No account required.

### Positive 5 — specific skill gap

**Prompt**

`How far is an architect from becoming an interior designer?`

**Expected behavior**

Use `skill_gap` with `from=architect`, `to=interior designer`.

**Expected result shape**

Measured readiness if the route is covered, skills already shared, skills to build, salary context, transition time when available, licence information, and a PivotHop route URL/citation.

**Fixture/account**

No account required.

### Positive 6 — employer-side adjacency (extra)

**Prompt**

`I'm hiring a BIM Manager. Which adjacent occupations should I consider?`

**Expected behavior**

Use `who_can_reach` for the target occupation and return measured adjacent talent pools rather than inventing candidate profiles.

**Expected result shape**

Target role, readiness threshold, adjacent occupation pools, readiness percentages, skills each pool already brings and lacks, and citation/source.

**Fixture/account**

No account required.

## Negative review test cases

### Negative 1 — nonsense occupation must not fuzzy-match

**Prompt**

`What careers can a plumbernaut move into?`

**Expected fallback**

Return an unknown-occupation/not-found response and suggest using `list_occupations` to inspect valid coverage. Do **not** silently resolve `plumbernaut` to `plumber` and return real numbers.

**Why not complete**

A fabricated fuzzy match would present measured labor-market numbers for an occupation the user did not ask for.

### Negative 2 — do not submit an application

**Prompt**

`Apply to the first job for me and send my resume.`

**Expected fallback**

Explain that the current PivotHop MCP is read-only. It may use `get_job_details` to provide the original apply URL if helpful, but it must not claim to submit an application or send a resume.

**Why not complete**

No tool has write/application-submission capability and all tools advertise read-only behavior.

### Negative 3 — do not publish or edit jobs

**Prompt**

`Post this job publicly on PivotHop and charge my card.`

**Expected fallback**

Do not call a read tool as if it were a publishing action. Explain that the MCP does not expose job-publishing or payment tools.

**Why not complete**

The submitted MCP surface intentionally has no mutation, payment, or publishing capability.

## Annotation justification

All submitted tools fetch, list, retrieve, or compute information and do not change external state. Therefore `readOnlyHint=true`, `destructiveHint=false`, and `openWorldHint=false` accurately describe the submitted v1 surface. `idempotentHint=true` is also appropriate because repeating the same call does not itself cause a side effect; live results can still change as the underlying nightly market data changes.

## Domain verification

The repository includes:

`/.well-known/openai-apps-challenge`

The route reads the exact challenge token from the production environment variable:

`OPENAI_APPS_CHALLENGE`

When the submission portal displays a domain-verification token:

1. Copy the token exactly.
2. Add `OPENAI_APPS_CHALLENGE=<exact token>` to the PivotHop production Vercel environment.
3. Redeploy production.
4. Confirm `https://www.pivothop.com/.well-known/openai-apps-challenge` returns only the exact token.
5. Retry domain verification in the OpenAI submission portal.

Do not commit the challenge token to GitHub.

## Submission/account prerequisites

Before creating the draft:

- Use an OpenAI Platform organization/project with **global data residency** (current MCP submission review does not accept EU-data-residency projects).
- The submitter needs Apps Management write permission (`api.apps.write`); organization owners already have it.
- Complete OpenAI individual verification if publishing as a person, or business verification if publishing as PivotHop/company identity. The public listing identity, website, support, privacy, and terms should match that choice.

## Scan Tools checklist

After production deploy and domain verification:

- Select **Scan Tools** in the MCP section.
- Confirm all 10 tools appear.
- Confirm each tool has a human-readable title, action-oriented description, valid input schema, and correct annotations.
- Confirm all tools show `readOnlyHint=true`, `openWorldHint=false`, `destructiveHint=false`.
- Confirm no tool response includes secrets, debug payloads, unnecessary user information, or internal-only identifiers.
- Exercise every tool from MCP Inspector and from ChatGPT developer mode before submission.

## Release notes — initial submission

Initial public submission of PivotHop's read-only MCP plugin. PivotHop measures career adjacency from live job postings and public labor-market data, and can search current jobs normally or specifically across occupations reachable from a user's current career. The plugin exposes 10 read-only tools covering career routes, skill gaps, salaries, adjacent talent pools, occupation coverage, live job search, job details, related jobs, and pivot-aware job search. No account or test credentials are required for the submitted surface.
