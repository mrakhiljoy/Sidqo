/**
 * Supabase server client — lazy-initialized.
 * Uses the service-role key — NEVER import this into client components.
 *
 * Lazy init is important: Next.js collects page data at build time by
 * importing route modules, and we don't want createClient() to fail the
 * build if env vars aren't present in the build environment.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }
  _client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// Proxy so existing `supabase.from(...)` call sites continue to work
// without awaiting or calling a function.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
