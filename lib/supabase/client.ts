"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createSupabaseClient() {
  const env = getSupabaseEnv();

  if (!env.enabled) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(env.url!, env.anonKey!);
  }

  return browserClient;
}
