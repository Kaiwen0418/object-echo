import Link from "next/link";
import { notFound } from "next/navigation";
import { MuseumExperience } from "@/features/museum/MuseumExperience";
import { getProjectById } from "@/lib/utils/project";

export default async function PreviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const bundle = await getProjectById(projectId);

  if (!bundle) notFound();

  return (
    <>
      <section className="section-row dashboard-preview-shell">
        <div className="dashboard-page-header">
          <Link className="dashboard-back-link" href={`/dashboard/${projectId}`}>
            Back
          </Link>
          <div className="section-eyebrow">Preview</div>
          <h1>{bundle.project.title}</h1>
        </div>
      </section>
      <MuseumExperience bundle={bundle} />
    </>
  );
}
