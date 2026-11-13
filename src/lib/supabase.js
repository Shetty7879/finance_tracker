import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or local developer override
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();

// Optional local dev storage override if configured in-app
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('fridaytrack_supabase_url')?.trim() : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('fridaytrack_supabase_key')?.trim() : null;

export const supabaseUrl = envUrl || storedUrl || '';
export const supabaseKey = envKey || storedKey || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Create Supabase client instance
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Helper to update dynamic credentials in browser for local testing without server restart
 */
export function saveCustomSupabaseConfig(url, key) {
  if (url && key) {
    localStorage.setItem('fridaytrack_supabase_url', url.trim());
    localStorage.setItem('fridaytrack_supabase_key', key.trim());
    window.location.reload();
  }
}

/**
 * Clear custom credentials
 */
export function clearCustomSupabaseConfig() {
  localStorage.removeItem('fridaytrack_supabase_url');
  localStorage.removeItem('fridaytrack_supabase_key');
  window.location.reload();
}

