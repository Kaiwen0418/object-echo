import { getStorageConfig } from "@/lib/storage/client";

export type MockStorageSignedUpload = {
  bucket: string;
  path: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
};

type SignMockStorageUploadParams = {
  projectId: string;
  kind: "models" | "audio" | "images";
  filename: string;
};

export function signMockStorageUpload({
  projectId,
  kind,
  filename
}: SignMockStorageUploadParams): MockStorageSignedUpload {
  const storage = getStorageConfig();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `projects/${projectId}/${kind}/${Date.now()}-${safeFilename}`;
  const publicUrl =
    storage.publicBaseUrl !== undefined
      ? `${storage.publicBaseUrl}/${path}`
      : `https://mock-storage.local/${storage.bucket}/${path}`;

  return {
    bucket: storage.bucket,
    path,
    uploadUrl: `${publicUrl}?token=mock-upload-token`,
    publicUrl,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
}

// TODO: Replace with Supabase Storage signed upload URL generation.
