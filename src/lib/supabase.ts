import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Restaure la session Supabase (requise pour NyeAI cloud / Edge Functions) */
export async function ensureSupabaseSession(): Promise<boolean> {
  const { data: first } = await supabase.auth.getSession();
  if (first.session?.access_token) return true;

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error) console.warn('[Supabase] refreshSession:', error.message);
  return !!refreshed.session?.access_token;
}

/** Token JWT utilisateur pour appeler les Edge Functions */
export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!(await ensureSupabaseSession())) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
