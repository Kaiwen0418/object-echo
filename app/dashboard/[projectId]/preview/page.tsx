import { notFound } from "next/navigation";
import { MuseumExperience } from "@/features/museum/MuseumExperience";
import { getProjectById } from "@/lib/utils/project";

export default async function PreviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const bundle = getProjectById(projectId);

  if (!bundle) notFound();

  return <MuseumExperience bundle={bundle} />;
}
