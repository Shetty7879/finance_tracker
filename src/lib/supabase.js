import { createClient } from '@supabase/supabase-js';

// Centralized credentials from Vite environment variables (sanitized of quotes and trailing slashes)
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '')
  .trim()
  .replace(/^["']|["']$/g, '');
const supabaseUrl = rawUrl.replace(/\/+$/, '');

const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
)
  .trim()
  .replace(/^["']|["']$/g, '');

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Initialize Supabase client centrally and only once
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
