import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Restaure la session Supabase (requise pour NyeAI cloud / Edge Functions) */
export async function ensureSupabaseSession(): Promise<boolean> {
  const { data: first } = await supabase.auth.getSession();
  if (first.session) return true;

  const { data: refreshed } = await supabase.auth.refreshSession();
  return !!refreshed.session;
}
