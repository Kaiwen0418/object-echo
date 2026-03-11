import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;
  const redirectTo = new URL(next, origin);
  const env = getSupabaseEnv();

  if (!env.enabled) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(redirectTo);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(env.url!, env.anonKey!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  const errorRedirect = new URL("/login", origin);
  errorRedirect.searchParams.set("error", "oauth_callback_failed");
  return NextResponse.redirect(errorRedirect);
}
