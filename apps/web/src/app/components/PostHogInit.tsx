'use client';
import { useEffect } from 'react';

/* PostHog analytics — the graceful ladder, like every integration here: no-ops
   entirely until NEXT_PUBLIC_POSTHOG_KEY exists in the env (the phc_ project
   key is publishable by design — it identifies the project, it can't read
   data — but it still lives in env, never hardcoded).

   Config choices, deliberate:
   - api_host '/ingest': first-party reverse proxy (next.config rewrites), so
     ad-blockers don't null the data.
   - defaults '2025-05-24': automatic pageviews including App Router history
     navigation — no manual route-change wiring.
   - person_profiles 'identified_only': visitors stay anonymous events (cheaper,
     and the honest-instrument privacy posture); profiles only if we ever
     explicitly identify someone.
   - session recording stays OFF; enable from the dashboard if ever wanted. */
export function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'identified_only',
        disable_session_recording: true,
        respect_dnt: true,
      });
    });
  }, []);
  return null;
}
