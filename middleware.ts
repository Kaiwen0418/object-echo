import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseMiddlewareState } from "@/lib/supabase/middleware";

export function middleware(_request: NextRequest) {
  const state = getSupabaseMiddlewareState();

  // TODO: Enforce auth redirects after Supabase auth integration.
  if (!state.enabled) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
