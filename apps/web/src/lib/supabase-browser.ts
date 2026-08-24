'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/* Browser Supabase client, or null when the project isn't provisioned yet.
   Every caller must tolerate null — the guest-save flow is fully functional
   without a backend, and sign-in simply reports itself unavailable. */

let _client: SupabaseClient | null | undefined;

export function supabaseBrowser(): SupabaseClient | null {
  if (_client !== undefined) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  _client = url && key ? createBrowserClient(url, key) : null;
  return _client;
}
