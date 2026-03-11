import { getSupabaseEnv } from "@/lib/supabase/config";

export type StorageConfig = {
  enabled: boolean;
  bucket: string;
  publicBaseUrl?: string;
};

export function getStorageConfig(): StorageConfig {
  const env = getSupabaseEnv();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "project-assets";

  return {
    enabled: env.enabled,
    bucket,
    publicBaseUrl: env.url ? `${env.url}/storage/v1/object/public/${bucket}` : undefined
  };
}

// TODO: Replace this placeholder with real Supabase Storage client helpers.
