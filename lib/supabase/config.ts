export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    anonKey,
    enabled: Boolean(url && anonKey)
  };
}

function getBaseUrl(baseUrl?: string) {
  return baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getAuthCallbackUrl(nextPath = "/dashboard", baseUrl?: string) {
  const callback = new URL("/auth/callback", getBaseUrl(baseUrl));
  callback.searchParams.set("next", nextPath);
  return callback.toString();
}

export function getAppUrl(path = "/", baseUrl?: string) {
  return new URL(path, getBaseUrl(baseUrl)).toString();
}
