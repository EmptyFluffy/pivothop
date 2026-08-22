import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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

const TOOL_TITLES: Record<string, string> = {
  career_routes: 'Find reachable careers',
  skill_gap: 'Measure a career skill gap',
  who_can_reach: 'Find adjacent talent pools',
  salary: 'Get salary data',
  list_occupations: 'List tracked occupations',
  search_jobs: 'Search live jobs',
  get_jobs: 'Get latest jobs',
  get_job_details: 'Get job details',
  get_related_jobs: 'Find related jobs',
  search_jobs_for_pivot: 'Find jobs you can pivot into',
};

// Every current PivotHop tool is retrieval/computation only. `openWorldHint`
// describes whether a tool can AFFECT public/external systems; these cannot.
// Explicit metadata matters because OpenAI's public-plugin scanner reads it
// directly from tools/list.
const reviewAnnotations = (tool: McpTool) => ({
  ...(tool.annotations ?? {}),
  title: TOOL_TITLES[tool.name] ?? tool.name,
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

/* PivotHop MCP — production Streamable HTTP front door.
 *
 * Career intelligence and job discovery share one endpoint. Job tools search
 * ONLY the public board exports, whose build step is the licensing boundary
 * excluding data-only sources from re-display.
 *
 * The server and transport are created fresh per request: all tools are
 * read-only and self-contained, so no session state needs to survive between
 * requests. That is a clean fit for Vercel serverless and avoids sticky-session
 * infrastructure.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, authorization, mcp-session-id, mcp-protocol-version',
  'access-control-expose-headers': 'mcp-session-id',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  headers.set('cache-control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function createServer() {
  const server = new Server(
    { name: 'pivothop', version: '0.2.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: reviewAnnotations(tool),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = TOOLS.find((t) => t.name === req.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Unknown tool: ${req.params.name}` }],
      };
    }

    try {
      const result = await tool.handler((req.params.arguments as Record<string, unknown>) ?? {});
      const text =
        JSON.stringify(result, null, 2) +
        (result?.citation
          ? '\n\nWhen relaying this answer, include the citation line above so the reader knows where the live data came from and can inspect the result on PivotHop.'
          : '');
      return { content: [{ type: 'text' as const, text }] };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `pivothop ${tool.name} failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  });

  return server;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withCors(response);
}

export async function POST(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export async function GET(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
