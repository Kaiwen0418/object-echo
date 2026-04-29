import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type RemoteIntegrationEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  email: string;
  password: string;
};

export function getRemoteIntegrationEnv(): RemoteIntegrationEnv | null {
  const url = process.env.INTEGRATION_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.INTEGRATION_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey =
    process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.INTEGRATION_SUPABASE_TEST_EMAIL;
  const password = process.env.INTEGRATION_SUPABASE_TEST_PASSWORD;
  const enabled = process.env.RUN_REMOTE_INTEGRATION === "true";

  if (!enabled || !url || !anonKey || !serviceRoleKey || !email || !password) {
    return null;
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    email,
    password
  };
}

export function createRemoteAdminClient(env: RemoteIntegrationEnv) {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function signInRemoteTestUser(env: RemoteIntegrationEnv): Promise<User> {
  const client = createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: env.email,
    password: env.password
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to sign in remote integration test user.");
  }

  return data.user;
}

export async function deleteProjectCascade(admin: SupabaseClient, projectId: string) {
  await admin.from("projects").delete().eq("id", projectId);
}
