import { NextResponse } from "next/server";
import { createUserAvatarSignedUpload } from "@/lib/storage/signing";
import { getCurrentSupabaseUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentSupabaseUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as {
      filename?: string;
    };

    const filename = typeof body.filename === "string" ? body.filename : "avatar.bin";

    return NextResponse.json({
      upload: await createUserAvatarSignedUpload({
        userId: user.id,
        filename
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create avatar upload URL.";
    console.error("Failed to create avatar upload URL", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
