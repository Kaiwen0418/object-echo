import { notFound } from "next/navigation";
import { MuseumExperience } from "@/features/museum/MuseumExperience";
import { getProjectBySlug } from "@/lib/utils/project";

export default async function MuseumPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getProjectBySlug(slug);

  if (!bundle) notFound();

  return <MuseumExperience bundle={bundle} />;
}
