import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // First-party proxy for PostHog ingestion (api_host '/ingest' in PostHogInit):
  // events flow through our own domain, so ad-blockers don't null the data.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // PostHog's ingestion endpoints require trailing-slash passthrough.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
