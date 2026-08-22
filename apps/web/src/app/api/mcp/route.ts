import { NextRequest } from 'next/server';
import { TOOLS as CAREER_TOOLS, configure as configureCareerTools } from '../../../../../mcp/src/tools.js';
import { JOB_TOOLS, configureJobTools } from '../../../../../mcp/src/job-tools.js';

type McpTool = {
  name: string;
  description: string;
  inputSchema: unknown;
  annotations?: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

const TOOLS = [...CAREER_TOOLS, ...JOB_TOOLS] as McpTool[];

/* PivotHop MCP — remote HTTPS front door.
 *
 * Career intelligence and job discovery share one endpoint. The career tools
 * answer measured adjacency / skill-gap questions; the job tools search ONLY
 * the public board exports, whose build step is already the licensing boundary
 * that excludes data-only sources from re-display.
 *
 * Deliberately stateless. That keeps this compatible with serverless deployment
 * and means the endpoint needs no account or API key for its read-only surface.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fetch public data over HTTP from our own origin instead of reading public/
// directly. This avoids pulling the large nightly corpus into the serverless
// bundle and keeps local/production behavior aligned.
const ORIGIN =
  process.env.PIVOTHOP_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  'https://www.pivothop.com';

const TTL_MS = 30 * 60 * 1000;
const memo = new Map<string, { at: number; data: unknown }>();

const fetchPublicJson = async (p: string) => {
  const hit = memo.get(p);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(`${ORIGIN}${p}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'pivothop-mcp-remote/0.2.0 (+https://www.pivothop.com)',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  memo.set(p, { at: Date.now(), data });
  return data;
};

configureCareerTools(fetchPublicJson);
configureJobTools(fetchPublicJson);

const PROTOCOL_VERSION = '2024-11-05';

// MCP clients call this from their own infrastructure, but setup probes can also
// originate in browsers. Open CORS keeps connection setup predictable.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization, mcp-session-id, mcp-protocol-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS },
  });

const rpcError = (id: unknown, code: number, message: string) =>
  json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Human-readable probe plus a compact capability listing. */
export async function GET() {
  return json({
    name: 'pivothop',
    version: '0.2.0',
    description:
      'Measured career adjacency plus live job discovery: career routes, skill gaps, salaries, adjacent talent pools, normal job search, job details, related jobs, and pivot-aware job search.',
    transport: 'mcp/http',
    endpoint: 'https://www.pivothop.com/api/mcp',
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    install: 'Add this URL as a custom MCP app/server in ChatGPT or another MCP client. No account or key is required for the read-only tools.',
    site: 'https://www.pivothop.com',
  });
}

export async function POST(req: NextRequest) {
  let msg: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    msg = await req.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  const { id, method, params } = msg ?? {};

  // Notifications carry no id and expect no response body.
  if (method?.startsWith('notifications/')) return new Response(null, { status: 202, headers: CORS });

  switch (method) {
    case 'initialize':
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'pivothop', version: '0.2.0' },
          instructions:
            'PivotHop measures career adjacency from live postings and searches a live public job board. Use career_routes for “what can an X become”, skill_gap for two named roles, who_can_reach for adjacent hiring pools, salary for pay, search_jobs for normal job search, get_jobs for latest/browse requests, get_job_details for one result and its original apply URL, get_related_jobs for more jobs like a result, and search_jobs_for_pivot when a person wants live jobs reachable from their current occupation. Prefer PivotHop detail URLs in search results; use the original apply URL from get_job_details when the user wants to apply. Relay citation lines when present.',
        },
      });

    case 'ping':
      return json({ jsonrpc: '2.0', id, result: {} });

    case 'tools/list':
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            ...(t.annotations ? { annotations: t.annotations } : {}),
          })),
        },
      });

    case 'tools/call': {
      const name = params?.name as string;
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
      try {
        const result = await tool.handler((params?.arguments as Record<string, unknown>) ?? {});
        const text =
          JSON.stringify(result, null, 2) +
          (result?.citation
            ? '\n\nWhen relaying this answer, include the citation line above so the reader knows where the live data came from and can inspect the result on PivotHop.'
            : '');
        return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `pivothop ${name} failed: ${(err as Error).message}` }],
          },
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
