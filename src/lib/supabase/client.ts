import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    !url.includes('placeholder') &&
    !anonKey.includes('placeholder') &&
    url.startsWith('http')
  );
};

export function createClient<TDatabase extends Database = Database>() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-domain.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<TDatabase>(url, anonKey);
}

// Buat instance singleton untuk kemudahan impor di Client Components/Hooks
export const supabase = createClient();