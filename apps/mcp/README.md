# PivotHop MCP server

**Measured career adjacency plus live job discovery for AI assistants.** Which careers a person's skills already reach, the gap, the salary, the licence gates, and current jobs in reachable destinations — computed from live postings rather than guessed from prose.

Ask an assistant *"I'm an architect — what remote jobs could I realistically pivot into without starting over?"* PivotHop can measure the route first, then search current openings in the reachable occupations.

## Remote endpoint

```
https://www.pivothop.com/api/mcp
```

This is the production endpoint for MCP clients that accept remote HTTPS servers, including the server submitted for a public ChatGPT/Codex plugin. No account or API key is required for the read-only tools.

## Local package

Claude Desktop, Claude Code, Cursor, VS Code, and other stdio MCP clients can use:

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

Or:

```bash
npx -y pivothop-mcp
```

## Tools

### Career intelligence

| Tool | Answers |
|---|---|
| `career_routes` | *"What can a UX designer become?"* — measured destinations with readiness, transferable/missing skills, salary, transition time, and licence gates |
| `skill_gap` | *"How far is architect from interior designer?"* — the measured gap between two roles |
| `who_can_reach` | *"Who else could do this job?"* — adjacent talent pools for an employer |
| `salary` | Posted p25 / median / p75 for an occupation, optionally per country |
| `list_occupations` | All tracked occupations and which have measured routes |

### Live jobs

| Tool | Answers |
|---|---|
| `search_jobs` | Normal live-job search by keywords, occupation, country, remote status, level, salary, equity, visa sponsorship, or four-day week |
| `get_jobs` | Freshest live jobs, optionally for one occupation |
| `get_job_details` | Full details for one result, including extracted skills, description sections, and the original apply URL |
| `get_related_jobs` | More current openings similar to a selected job |
| `search_jobs_for_pivot` | *"I'm an architect — show me remote jobs I can realistically pivot into"* — measures reachable occupations first, then searches jobs inside them |

## What "readiness" means

Readiness is the share of a destination occupation's typical posting requirements already covered by the origin occupation's measured skill profile.

It is **not** a probability of being hired and **not** a share of candidates. A 66% architect → interior designer readiness means roughly two thirds of what interior-design postings typically ask for already appears in the architect skill profile.

## The honesty rule

Some occupations do not clear the minimum live-posting floor required for a defensible career route. Those return explicit `insufficient_data` responses rather than invented numbers. Licence gates are treated as hard gates when the occupation legally requires a credential.

The job tools follow the same rule. They read only PivotHop's public board exports. Sources that PivotHop uses for aggregate analysis but is not cleared to re-display are excluded upstream and therefore cannot appear through the MCP job tools.

## Data and attribution

The server reads current public data from `pivothop.com` and caches it for 30 minutes in-process. The underlying corpus is refreshed on the site's regular data pipeline.

PivotHop URLs returned by the MCP carry `utm_source=mcp`, allowing MCP click-throughs to be measured separately from normal search/referral traffic. Job search results link to PivotHop detail pages; `get_job_details` exposes the original employer/source apply URL when the user wants to apply.

## Links

- Site — https://www.pivothop.com
- Jobs — https://www.pivothop.com/jobs
- The Adjacency Index — https://www.pivothop.com/adjacency-index
- Method and glossary — https://www.pivothop.com/glossary

MIT.
