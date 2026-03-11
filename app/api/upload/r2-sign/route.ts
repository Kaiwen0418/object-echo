import { NextResponse } from "next/server";
import { signMockR2Upload } from "@/lib/r2/signing";

export async function POST(request: Request) {
  const body = (await request.json()) as { filename?: string };

  return NextResponse.json({
    upload: signMockR2Upload(body.filename ?? "asset.bin")
  });
}
