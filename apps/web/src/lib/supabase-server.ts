import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/* Per-request server Supabase client bound to the auth cookies, or null when
   the project isn't provisioned. Uses the ANON key: queries run under the
   signed-in user's JWT, so the per-user RLS policies in 0010_accounts.sql do
   the authorization. (Service-key access stays where it already lives — the
   raw-REST SB() helpers in the API routes and the CI digest job.) */

export async function supabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        // Server Components may not write cookies; the proxy refresh pass
        // owns that. Swallowing here is the documented @supabase/ssr pattern.
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch { /* read-only context */ }
      },
    },
  });
}
