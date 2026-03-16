import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") ?? "/";
  const redirectTo = new URL(next, origin);
  const env = getSupabaseEnv();

  if (!env.enabled) {
    return NextResponse.redirect(redirectTo);
  }

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

  await supabase.auth.signOut();
  return NextResponse.redirect(redirectTo);
}
