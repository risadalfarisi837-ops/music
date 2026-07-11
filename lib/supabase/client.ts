import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
// This automatically uses localStorage for session persistence which works reliably in Capacitor WebViews
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export function createClient() {
  return supabase;
}
