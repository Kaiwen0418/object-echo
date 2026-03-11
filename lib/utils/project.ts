import { demoBundle, demoProjects } from "@/data/demo/projects";
import type { MuseumProjectBundle, Project } from "@/types";

export function listProjects(): Project[] {
  return demoProjects;
}

export function getProjectById(projectId: string): MuseumProjectBundle | undefined {
  return demoBundle.project.id === projectId ? demoBundle : undefined;
}

export function getProjectBySlug(slug: string): MuseumProjectBundle | undefined {
  return demoBundle.project.slug === slug ? demoBundle : undefined;
}
