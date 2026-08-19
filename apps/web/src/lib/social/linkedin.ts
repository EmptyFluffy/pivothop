import 'server-only';

/* The FUTURE direct-API provider, not wired anywhere today. The current
   publisher is Zapier, consuming /api/social/feed and confirming through
   /api/social/consume, which needs no LinkedIn API approval. When direct
   publishing is wanted, point the queue at publishLinkedInPost() and retire
   the Zap; the selection, copy and store layers do not change. Modern Posts
   API only (no ugcPosts, no browser automation). */

export class LinkedInPermanentError extends Error {}
export class LinkedInTransientError extends Error {}

const API = 'https://api.linkedin.com/rest/posts';

function version(): string { return process.env.LINKEDIN_API_VERSION || '202608'; }

async function refreshAccessToken(): Promise<string | null> {
  const { LINKEDIN_CLIENT_ID: id, LINKEDIN_CLIENT_SECRET: secret, LINKEDIN_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return null;
  try {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh, client_id: id, client_secret: secret }),
    });
    if (!res.ok) return null; // programmatic refresh needs an approved tier; fall back to the stored token
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch { return null; }
}

export async function publishLinkedInPost(text: string): Promise<{ externalId: string }> {
  const org = process.env.LINKEDIN_ORGANIZATION_ID;
  let token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!org) throw new LinkedInPermanentError('LINKEDIN_ORGANIZATION_ID not set');
  if (!token) throw new LinkedInPermanentError('LINKEDIN_ACCESS_TOKEN not set');

  const body = JSON.stringify({
    author: `urn:li:organization:${org}`,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  });

  const attempt = async (bearer: string) => fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': version(),
      'Content-Type': 'application/json',
    },
    body,
  });

  let res = await attempt(token);
  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) { token = fresh; res = await attempt(token); }
  }
  if (res.status === 401 || res.status === 403) {
    throw new LinkedInPermanentError(`linkedin ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  if (res.status === 429 || res.status >= 500) {
    throw new LinkedInTransientError(`linkedin ${res.status}`);
  }
  if (!res.ok && res.status !== 201) {
    throw new LinkedInPermanentError(`linkedin ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const externalId = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || '';
  return { externalId };
}
