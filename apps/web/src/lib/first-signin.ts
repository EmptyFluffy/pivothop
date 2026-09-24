import type { SupabaseClient, User } from '@supabase/supabase-js';
import { SITE_EMAIL } from './site';

/* The first-sign-in detector, in one place for the three sign-in paths
   (OAuth callback, One Tap, magic link): insert the email_prefs default row;
   if the insert lands (no row existed) this is a new account, and the founder
   gets one email with who it is. A duplicate means a returning user: silent.
   Postmark env absent: the insert still happens, no mail. */
export async function firstSignIn(supabase: SupabaseClient, user: User): Promise<boolean> {
  const { error } = await supabase.from('email_prefs').insert({ user_id: user.id });
  if (error) return false; // 23505 duplicate = returning user; anything else, do not spam
  await notifyNewUser(user); // awaited: a serverless function may end before a detached fetch does
  return true;
}

async function notifyNewUser(u: User): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) return;
  const m = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(m.full_name ?? m.name ?? '');
  const provider = String((u.app_metadata as Record<string, unknown> | undefined)?.provider ?? 'email');
  const lines = [
    `${u.email ?? '(no email)'}${name ? ` (${name})` : ''} just created an account.`,
    '',
    `Provider: ${provider}`,
    `User id: ${u.id}`,
    `Created: ${u.created_at}`,
    m.avatar_url ? `Avatar: ${String(m.avatar_url)}` : '',
    '',
    'Row in Supabase: Table Editor, profiles.',
  ].filter((l) => l !== null);
  await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      From: from,
      To: process.env.POSTMARK_NOTIFY_TO || SITE_EMAIL,
      Subject: `New PivotHop user: ${u.email ?? u.id}`,
      TextBody: lines.join('\n'),
      MessageStream: 'outbound',
    }),
  }).catch(() => {});
}
