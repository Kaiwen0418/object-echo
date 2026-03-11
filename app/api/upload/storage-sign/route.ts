import { NextResponse } from "next/server";
import { signMockStorageUpload } from "@/lib/storage/signing";

type StorageKind = "models" | "audio" | "images";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    filename?: string;
    projectId?: string;
    kind?: StorageKind;
  };

  return NextResponse.json({
    upload: signMockStorageUpload({
      filename: body.filename ?? "asset.bin",
      projectId: body.projectId ?? "demo-project",
      kind: body.kind ?? "models"
    })
  });
}
