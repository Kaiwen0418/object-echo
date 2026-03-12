"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/lib/utils/project";

export type CreateProjectState = {
  fieldErrors?: {
    title?: string;
    slug?: string;
  };
  error?: string;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = slugify(slugInput || title);

  if (!title) {
    return { fieldErrors: { title: "Project title is required." } };
  }

  if (!slug) {
    return { fieldErrors: { slug: "Slug is required." } };
  }

  try {
    const project = await createProject({
      title,
      slug,
      description
    });

    redirect(`/dashboard/${project.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project.";

    if (message.includes("duplicate key") || message.includes("projects_slug_key")) {
      return { fieldErrors: { slug: "That slug is already in use." } };
    }

    return { error: message };
  }
}
