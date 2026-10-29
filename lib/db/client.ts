import { createClient, SupabaseClient } from '@supabase/supabase-js';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the Supabase service-role client.
 *
 * In live mode (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'), this strictly throws if
 * NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.
 *
 * In demo mode, it falls back to a dummy URL and key for safe offline development/demos.
 */
export function getDbClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isDemoMode && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error(
      '[Supabase DB] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in live mode. ' +
      'Please configure .env.local or set NEXT_PUBLIC_DEMO_MODE=true.'
    );
  }

  clientInstance = createClient(
    supabaseUrl || 'https://demo.supabase.co',
    serviceRoleKey || 'demo-service-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return clientInstance;
}

/**
 * Returns an anonymous (public) Supabase client to test RLS policies.
 */
export function getAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isDemoMode && (!supabaseUrl || !anonKey)) {
    throw new Error(
      '[Supabase DB] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in live mode.'
    );
  }

  return createClient(
    supabaseUrl || 'https://demo.supabase.co',
    anonKey || 'demo-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
