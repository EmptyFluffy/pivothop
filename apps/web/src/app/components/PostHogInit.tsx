/* PostHog is now initialized via instrumentation-client.ts (Next.js 15.3+
   approach). This component is kept as a no-op so the layout import is stable. */
export function PostHogInit() {
  return null;
}
