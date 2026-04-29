"use server";

import { revalidatePath } from "next/cache";
import { publishProject, unpublishProject } from "@/lib/utils/project";

export async function toggleProjectPublishAction(projectId: string, nextState: "published" | "draft") {
  if (nextState === "published") {
    await publishProject(projectId);
  } else {
    await unpublishProject(projectId);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${projectId}`);
  revalidatePath(`/dashboard/${projectId}/preview`);
}
