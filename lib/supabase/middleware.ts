export function getSupabaseMiddlewareState() {
  return {
    enabled: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  };
}

// TODO: Enforce protected routes when authentication is connected.
