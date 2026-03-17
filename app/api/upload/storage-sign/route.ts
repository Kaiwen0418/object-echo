import { NextResponse } from "next/server";
import { MAX_ASSET_STORAGE_BYTES_PER_USER, MAX_SINGLE_ASSET_UPLOAD_BYTES, formatBytes } from "@/lib/limits";
import { getStorageConfig } from "@/lib/storage/client";
import { createStorageSignedUpload } from "@/lib/storage/signing";
import { createSupabaseAdminClient, createSupabaseServerClient, getCurrentSupabaseUser } from "@/lib/supabase/server";

type StorageKind = "model" | "audio" | "image";

async function getUserStorageUsageBytes(projectIds: string[]) {
  const admin = createSupabaseAdminClient();
  const storage = getStorageConfig();

  if (!admin || !storage.enabled) {
    return 0;
  }

  let total = 0;

  for (const projectId of projectIds) {
    const { data, error } = await admin.storage.from(storage.bucket).list(`projects/${projectId}/uploads`, {
      limit: 1000
    });

    if (error) {
      throw error;
    }

    for (const item of data ?? []) {
      const metadata = item.metadata as { size?: number } | null;
      total += typeof metadata?.size === "number" ? metadata.size : 0;
    }
  }

  return total;
}

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
      fileSize?: number;
    };

    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const filename = typeof body.filename === "string" ? body.filename : "asset.bin";
    const kind = body.kind === "audio" || body.kind === "image" || body.kind === "model" ? body.kind : "model";
    const fileSize = typeof body.fileSize === "number" && Number.isFinite(body.fileSize) ? Math.max(0, Math.floor(body.fileSize)) : 0;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    if (fileSize <= 0) {
      return NextResponse.json({ error: "fileSize is required." }, { status: 400 });
    }

    if (fileSize > MAX_SINGLE_ASSET_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Each upload must be ${formatBytes(MAX_SINGLE_ASSET_UPLOAD_BYTES)} or smaller.` },
        { status: 400 }
      );
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

    const { data: userProjects, error: userProjectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)
      .returns<Array<{ id: string }>>();

    if (userProjectsError) {
      return NextResponse.json({ error: userProjectsError.message }, { status: 500 });
    }

    const currentUsageBytes = await getUserStorageUsageBytes((userProjects ?? []).map((candidate) => candidate.id));

    if (currentUsageBytes + fileSize > MAX_ASSET_STORAGE_BYTES_PER_USER) {
      return NextResponse.json(
        { error: `You can store up to ${formatBytes(MAX_ASSET_STORAGE_BYTES_PER_USER)} of uploaded assets per account.` },
        { status: 400 }
      );
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
