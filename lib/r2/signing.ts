export type MockR2SignedUpload = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
};

export function signMockR2Upload(filename: string): MockR2SignedUpload {
  const key = `projects/demo/uploads/${Date.now()}-${filename}`;

  return {
    key,
    uploadUrl: `https://mock-r2-upload.local/${key}`,
    publicUrl: `${process.env.R2_PUBLIC_BASE_URL ?? "https://cdn.example.com"}/${key}`,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
}

// TODO: Replace with a real signed PUT URL flow for Cloudflare R2.
