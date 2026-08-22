import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// npm workspaces HOISTS dependencies to the repo root, so @sparticuz/chromium
// (67MB) physically lives in /node_modules, not /apps/web/node_modules. Next
// traces from the app directory by default, so without this it never packages
// the binary: the runtime import in render.mjs throws, renderPdf returns null,
// and /api/roadmap silently degrades to lead-capture with delivered=false —
// which is precisely how this failed the first time.
const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // FairElephant retired 2026-08-22; the calculator lives in the salary silo
      { source: '/fairelephant', destination: '/salary/calculator', permanent: true },
    ];
  },
  // First-party proxy for PostHog ingestion (api_host '/ingest' in PostHogInit):
  // events flow through our own domain, so ad-blockers don't null the data.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // PostHog's ingestion endpoints require trailing-slash passthrough.
  skipTrailingSlashRedirect: true,
  // The PDF renderer. Both must stay OUT of the bundler: @sparticuz/chromium
  // ships a ~50MB brotli-compressed binary that webpack would try to inline, and
  // puppeteer-core resolves its browser path at runtime. Listing them here makes
  // Next require() them natively at execution instead. See lib/roadmap/render.mjs.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingRoot: REPO_ROOT,
  // The tracer follows JS requires, so it packaged @sparticuz/chromium's four
  // build/*.js files and stopped — it cannot see that paths.js resolves
  // bin/chromium.br (64MB, the ACTUAL browser) at runtime. Without this the
  // function deploys looking complete and fails on launch. Verified by reading
  // route.js.nft.json rather than trusting a green build.
  outputFileTracingIncludes: {
    '/api/roadmap': ['../../node_modules/@sparticuz/chromium/bin/**'],
  },
  // The route reads public/data/<dynamic>, so the tracer takes the whole
  // directory — 95MB after the Swiss unlock (2026-08-04), of which 65MB is
  // jobs-detail: posting descriptions the route provably never opens (it reads
  // only jobs/, report/ and salaries/ — grep readData in route.ts). Function
  // size has a 250MB ceiling and chromium already costs 64MB; without this
  // exclude, board growth would eventually kill the roadmap PDF in production.
  // Verify after build by reading route.js.nft.json, not by trusting green.
  outputFileTracingExcludes: {
    '/api/roadmap': ['./public/data/jobs-detail/**'],
  },

  // Edge-request diet: logos are content-addressed by company and effectively
  // immutable; a year of browser/CDN cache turns 60 image requests per board
  // view into 60 once per visitor. Board JSON revalidates hourly — it changes
  // once a night.
  async headers() {
    return [
      { source: '/data/logos/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/data/:path*.json', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
    ];
  },
};

export default nextConfig;
