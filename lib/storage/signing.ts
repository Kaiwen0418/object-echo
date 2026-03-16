import { getStorageConfig } from "@/lib/storage/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type StorageSignedUpload = {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
  expiresAt: string;
};

type CreateStorageSignedUploadParams = {
  projectId: string;
  kind: "model" | "audio" | "image";
  filename: string;
};

export async function createStorageSignedUpload({
  projectId,
  kind,
  filename
}: CreateStorageSignedUploadParams): Promise<StorageSignedUpload> {
  const storage = getStorageConfig();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `projects/${projectId}/uploads/${kind}-${Date.now()}-${safeFilename}`;
  const admin = createSupabaseAdminClient();

  if (!storage.enabled || !admin) {
    throw new Error("Supabase Storage is not configured.");
  }

  const { data, error } = await admin.storage.from(storage.bucket).createSignedUploadUrl(path);

  if (error || !data) {
    throw error ?? new Error("Failed to create signed upload URL.");
  }

  const publicUrl =
    storage.publicBaseUrl !== undefined
      ? `${storage.publicBaseUrl}/${path}`
      : `https://mock-storage.local/${storage.bucket}/${path}`;

  return {
    bucket: storage.bucket,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
}
