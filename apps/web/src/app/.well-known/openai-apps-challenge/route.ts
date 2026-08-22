/*
 * OpenAI public-plugin domain verification.
 *
 * The submission portal gives the publisher an exact challenge token and checks
 * https://www.pivothop.com/.well-known/openai-apps-challenge. Put that token in
 * the production Vercel environment as OPENAI_APPS_CHALLENGE and redeploy. The
 * endpoint intentionally returns 404 until a token exists so we never publish a
 * placeholder that could be mistaken for successful verification.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!token) {
    return new Response('OpenAI plugin verification token not configured.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  return new Response(token, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
