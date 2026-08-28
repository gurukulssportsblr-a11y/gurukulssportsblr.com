import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://egrpofmcquzcurmtwwix.supabase.co';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project'))
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : DEFAULT_SUPABASE_URL;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PRIVATE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

class NoopWebSocket {}

export function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: NoopWebSocket as any,
    },
  });
}
