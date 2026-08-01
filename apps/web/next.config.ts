import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
