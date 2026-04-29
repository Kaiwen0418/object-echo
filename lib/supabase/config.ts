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

export function getAuthCallbackUrl(nextPath = "/dashboard") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callback = new URL("/auth/callback", baseUrl);
  callback.searchParams.set("next", nextPath);
  return callback.toString();
}

export function getAppUrl(path = "/") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}
