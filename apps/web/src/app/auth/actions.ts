'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase-server';

/* Auth server actions. Every path tolerates the Supabase project not existing
   yet (env absent → supabaseServer() is null): sign-in reports itself
   unavailable instead of erroring, and nothing else on the site depends on it. */

export async function requestMagicLink(
  _prev: { ok: boolean; msg: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; msg: string }> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, msg: 'That does not look like an email address.' };
  }
  const supabase = await supabaseServer();
  if (!supabase) {
    return { ok: false, msg: 'Sign-in is not live yet. Your saved jobs stay in this browser meanwhile.' };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    // rate limits and transport errors land here; the message stays generic
    return { ok: false, msg: 'Could not send the link. Wait a minute and try again.' };
  }
  return { ok: true, msg: email };
}

/* The /auth/confirm POST target. GET renders the interstitial (so mail
   scanners that prefetch the link never consume the one-time token); only
   this POST verifies. Handles both the token_hash link and the typeable
   6-digit code from the same email. */
export async function verifyToken(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get('token_hash') || '');
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const code = String(formData.get('code') || '').trim();
  const nextPath = String(formData.get('next') || '/dashboard');
  // only ever redirect within the site
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';

  const supabase = await supabaseServer();
  if (!supabase) redirect('/signin');

  const { error } = tokenHash
    ? await supabase!.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
    : await supabase!.auth.verifyOtp({ type: 'email', email, token: code });

  if (error) {
    redirect(`/auth/confirm?error=expired&next=${encodeURIComponent(next)}`);
  }

  // First sign-in detector: no email_prefs row yet. Insert the default row
  // (frequency 'off' — the digest is explicit opt-in). The welcome email
  // hangs off this same signal when the email phase lands.
  const { data: u } = await supabase!.auth.getUser();
  if (u?.user) {
    await supabase!.from('email_prefs').upsert(
      { user_id: u.user.id },
      { onConflict: 'user_id', ignoreDuplicates: true },
    );
  }
  redirect(next);
}
