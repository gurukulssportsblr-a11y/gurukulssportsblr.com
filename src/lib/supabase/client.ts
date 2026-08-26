import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export function createClient() {
  if (!isSupabaseConfigured) {
    return createSupabaseClient(
      'https://placeholder-domain-gurukul.supabase.co',
      'placeholder-anon-key'
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
