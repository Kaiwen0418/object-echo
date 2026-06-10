import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type HeartbeatResult = {
  status: "healthy" | "unhealthy";
  checkedAt: string;
  latencyMs: number;
};

function getDeploymentUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return host ? `https://${host}` : process.env.NEXT_PUBLIC_APP_URL;
}

export async function recordHeartbeat(): Promise<HeartbeatResult> {
  const checkedAt = new Date().toISOString();
  const startedAt = performance.now();
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error: probeError } = await supabase
    .from("service_heartbeat_logs")
    .select("id")
    .limit(1);
  const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
  const status = probeError ? "unhealthy" : "healthy";

  const { error: insertError } = await supabase.from("service_heartbeat_logs").insert({
    service_name: process.env.HEARTBEAT_SERVICE_NAME ?? "object-echo-web",
    status,
    latency_ms: latencyMs,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    deployment_url: getDeploymentUrl(),
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA,
    error_message: probeError?.message ?? null,
    checked_at: checkedAt
  });

  if (insertError) {
    throw new Error(`Failed to write heartbeat log: ${insertError.message}`);
  }

  if (probeError) {
    throw new Error(`Database health probe failed: ${probeError.message}`);
  }

  return { status, checkedAt, latencyMs };
}
