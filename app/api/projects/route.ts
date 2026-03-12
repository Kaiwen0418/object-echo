import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/utils/project";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    description?: string;
  };

  try {
    const project = await createProject({
      title: body.title ?? "",
      slug: body.slug ?? "",
      description: body.description ?? ""
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
