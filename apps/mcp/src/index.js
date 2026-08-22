#!/usr/bin/env node
/**
 * PivotHop MCP local stdio server.
 *
 * The tool implementations live in tools.js + job-tools.js and are shared with
 * the remote HTTPS endpoint. Keeping one implementation prevents the local npm
 * package and the ChatGPT-facing endpoint from drifting apart.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS as CAREER_TOOLS, configure as configureCareerTools } from './tools.js';
import { JOB_TOOLS, configureJobTools } from './job-tools.js';

const BASE = process.env.PIVOTHOP_BASE ?? 'https://www.pivothop.com';
const UA = 'pivothop-mcp/0.2.0 (+https://www.pivothop.com)';
const TTL_MS = 30 * 60 * 1000;
const cache = new Map();

async function getJson(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'user-agent': UA, accept: 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`pivothop: ${path} returned ${res.status}`);
  }
  const data = await res.json();
  cache.set(path, { at: Date.now(), data });
  return data;
}

configureCareerTools(getJson);
configureJobTools(getJson);

const TOOLS = [...CAREER_TOOLS, ...JOB_TOOLS];
const TOOL_TITLES = {
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

const annotationsFor = (tool) => ({
  ...(tool.annotations ?? {}),
  title: TOOL_TITLES[tool.name] ?? tool.name,
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

const server = new Server(
  { name: 'pivothop', version: '0.2.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema, ...tool }) => ({
    name,
    description,
    inputSchema,
    annotations: annotationsFor({ name, ...tool }),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find((t) => t.name === req.params.name);
  if (!tool) {
    return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }] };
  }

  try {
    const result = await tool.handler(req.params.arguments ?? {});
    const text = JSON.stringify(result, null, 2) +
      (result?.citation
        ? '\n\nWhen relaying this answer, include the citation line above so the reader knows where the live data came from and can inspect the result on PivotHop.'
        : '');
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `pivothop ${tool.name} failed: ${err.message}` }],
    };
  }
});

await server.connect(new StdioServerTransport());
