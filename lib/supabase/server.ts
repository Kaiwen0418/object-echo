type SupabaseServerPlaceholder = {
  enabled: boolean;
  serviceRoleConfigured: boolean;
};

export function createSupabaseServerClient(): SupabaseServerPlaceholder {
  return {
    enabled: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}

// TODO: Replace with server-side auth/session helpers after real Supabase wiring.
