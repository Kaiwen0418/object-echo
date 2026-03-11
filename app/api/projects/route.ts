import { NextResponse } from "next/server";
import { listProjects } from "@/lib/utils/project";

export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST() {
  return NextResponse.json(
    {
      ok: true,
      message: "TODO: create project persistence via Supabase.",
      projectId: "mock-project-id"
    },
    { status: 202 }
  );
}
