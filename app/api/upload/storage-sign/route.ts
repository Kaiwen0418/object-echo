import { NextResponse } from "next/server";
import { createStorageSignedUpload } from "@/lib/storage/signing";
import { createSupabaseServerClient, getCurrentSupabaseUser } from "@/lib/supabase/server";

type StorageKind = "models" | "audio" | "images";

export async function POST(request: Request) {
  try {
    const user = await getCurrentSupabaseUser();
    const supabase = await createSupabaseServerClient();

    if (!user || !supabase) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as {
      filename?: string;
      projectId?: string;
      kind?: StorageKind;
    };

    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const filename = typeof body.filename === "string" ? body.filename : "asset.bin";
    const kind = body.kind === "audio" || body.kind === "images" || body.kind === "models" ? body.kind : "models";

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      upload: await createStorageSignedUpload({
        filename,
        projectId,
        kind
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create signed upload URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
