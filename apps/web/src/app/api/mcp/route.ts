import { NextRequest } from 'next/server';
import { TOOLS as RAW_TOOLS, configure } from '../../../../../mcp/src/tools.js';

/** The five handlers have different argument shapes, so TypeScript infers their
 *  INTERSECTION and then rejects a generic dispatch — every call would have to
 *  satisfy all five signatures at once. The dispatcher is generic by nature: it
 *  forwards whatever JSON-RPC delivered. One narrow type at the boundary is
 *  honest about that; the tools validate their own arguments. */
type McpTool = {
  name: string;
  description: string;
  inputSchema: unknown;
  handler: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};
const TOOLS = RAW_TOOLS as McpTool[];

/* PivotHop MCP — REMOTE front door.
 *
 * The npm package (pivothop-mcp) is a local stdio server: the user edits a JSON
 * config, needs Node, and it reaches Claude Desktop / Cursor / VS Code only.
 * ChatGPT accepts remote HTTPS endpoints ONLY, and so do claude.ai and Claude
 * mobile — which is where anyone who is not a developer actually is. So the
 * package alone reaches the smallest possible audience.
 *
 * This endpoint is the same five tools behind a URL. No install: paste
 * https://www.pivothop.com/api/mcp into Claude's custom connectors or ChatGPT.
 *
 * Same data path as the package (a fetch of our own public JSON), but from
 * Vercel's network rather than the user's, so it is closer and CDN-cached.
 *
 * Deliberately stateless. The MCP spec allows a session-less server for a
 * tools-only surface, and statelessness is what lets this live as a serverless
 * route rather than a service someone has to keep alive. That distinction is
 * the whole reason this fits a one-person operation. */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fetched over HTTP from our own origin rather than read off disk.
//
// Reading public/ directly looked cheaper, but the dynamic path made Turbopack
// match 11,884 files and pull the whole directory into the serverless bundle —
// megabytes of job JSON shipped with every cold start, to save a request that
// the CDN answers in single-digit milliseconds. The hop is the cheaper side of
// that trade, and it keeps dev and production on identical code paths.
const ORIGIN =
  process.env.PIVOTHOP_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  'https://www.pivothop.com';

const TTL_MS = 30 * 60 * 1000;
const memo = new Map<string, { at: number; data: unknown }>();

configure(async (p: string) => {
  const hit = memo.get(p);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(`${ORIGIN}${p}`, { headers: { accept: 'application/json' } });
  if (!res.ok) return null;      // missing file behaves as "no data"
  const data = await res.json();
  memo.set(p, { at: Date.now(), data });
  return data;
});

const PROTOCOL_VERSION = '2024-11-05';

// Anthropic and OpenAI call this from their own infrastructure, not the user's
// browser, but connectors are also probed from web clients — so CORS has to be
// open or the connector fails at setup with an opaque error.
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

/** Some clients probe with GET before connecting. Answer with something a human
 *  can read too, since this URL will end up pasted into chat windows. */
export async function GET() {
  return json({
    name: 'pivothop',
    version: '0.1.0',
    description:
      'Measured career adjacency from live job postings: which careers a set of skills already reaches, the gap, the salary, and the licence gates.',
    transport: 'mcp/http',
    endpoint: 'https://www.pivothop.com/api/mcp',
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    install: 'Add this URL as a custom connector in Claude, or as an MCP server in ChatGPT. No account or key.',
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

  // Notifications carry no id and expect no body — answering one with a result
  // makes strict clients drop the connection.
  if (method?.startsWith('notifications/')) return new Response(null, { status: 202, headers: CORS });

  switch (method) {
    case 'initialize':
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'pivothop', version: '0.1.0' },
          instructions:
            'PivotHop measures how close one occupation sits to another using live job postings. Use career_routes for "what can an X become", skill_gap for two named roles, who_can_reach when someone is hiring and wants adjacent talent, and salary for pay. Always relay the citation line in the response so the reader knows what measured the answer.',
        },
      });

    case 'ping':
      return json({ jsonrpc: '2.0', id, result: {} });

    case 'tools/list':
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
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
            ? '\n\nWhen relaying this answer, include the citation line above so the reader knows what measured it and where to see the full working.'
            : '');
        return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
      } catch (err) {
        // Report the failure as a tool error, not a protocol error: the client
        // should surface "that lookup failed" rather than drop the connection.
        return json({
          jsonrpc: '2.0',
          id,
          result: { isError: true, content: [{ type: 'text', text: `pivothop ${name} failed: ${(err as Error).message}` }] },
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
