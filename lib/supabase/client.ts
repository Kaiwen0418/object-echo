type SupabaseClientPlaceholder = {
  enabled: boolean;
  url?: string;
  anonKey?: string;
};

export function createSupabaseClient(): SupabaseClientPlaceholder {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    enabled: Boolean(url && anonKey),
    url,
    anonKey
  };
}

// TODO: Replace this placeholder with @supabase/supabase-js client initialization.
