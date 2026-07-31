# PivotHop MCP server

**Measured career adjacency for AI assistants.** Which careers a person's skills
already reach, the gap, the salary, the licence gates — computed nightly from
~260,000 live job postings, not guessed from prose.

Ask an assistant *"what can an architect become?"* and today the answer is
assembled from whatever it read on the web. This makes it come from measurement.

## Install

### Easiest — no install (Claude web/desktop/mobile, ChatGPT)

Add this as a **custom connector**:

```
https://www.pivothop.com/api/mcp
```

Claude → Settings → Connectors → Add custom connector. ChatGPT accepts remote
HTTPS endpoints only, so this is the *only* option there.

### Local package (Claude Desktop, Claude Code, Cursor, VS Code)

```json
{
  "mcpServers": {
    "pivothop": {
      "command": "npx",
      "args": ["-y", "pivothop-mcp"]
    }
  }
}
```

**Anything else that speaks MCP over stdio:**

```bash
npx -y pivothop-mcp
```

No API key. No account. Reads public data from pivothop.com.

## Tools

| Tool | Answers |
|---|---|
| `career_routes` | *"What can a UX designer become?"* — destinations with readiness, skills you have and lack, salary, transition time, licence gates |
| `skill_gap` | *"How far is architect from interior designer?"* — the measured gap between two specific roles |
| `who_can_reach` | *"Who else could do this job?"* — the employer question: which occupations already cover a role you're hiring for |
| `salary` | Posted band (p25 / median / p75) per occupation, optionally per country |
| `list_occupations` | All 180 tracked occupations, and which have measured routes |

## What "readiness" means

The share of a destination's typical posting requirements already covered by the
origin occupation's skills, measured from live postings.

It is **not** a probability of being hired, and **not** a share of candidates. A
66% architect→interior-designer readiness means two thirds of what interior
design postings ask for is already in the architect skill profile.

## The honesty rule

**Some occupations have no measured routes** — they sit below the 50-posting
floor needed for a defensible number, and the count moves as the corpus and its
cleaning improve. Those return an explicit `insufficient_data` answer saying so.
`list_occupations` reports the live split rather than a number baked in here.

The server will not guess. A tool that invents a confident answer gets caught
once and distrusted forever; one that says *"I don't have enough data on
brewmasters"* stays useful. Licence gates work the same way: a required
credential is reported as a hard gate, because no amount of skill overlap
shortens a degree.

## Data

Live from `pivothop.com`, cached 30 minutes in-process. The corpus is
re-scraped and re-scored nightly, so answers track the current market rather
than a snapshot frozen at publish time.

Sources: ~15 job boards and public APIs, plus US BLS OEWS wage data and observed
occupational mobility flows.

## Links

- Site — https://www.pivothop.com
- The Adjacency Index (citable numbers) — https://www.pivothop.com/adjacency-index
- Method and glossary — https://www.pivothop.com/glossary

MIT.
