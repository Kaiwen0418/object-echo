import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/utils/project";

export default async function ProjectOverviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const bundle = await getProjectById(projectId);

  if (!bundle) notFound();

  return (
    <section className="section-row">
      <Link className="dashboard-back-link" href="/dashboard">
        Back
      </Link>
      <article className="panel">
        <div className="section-eyebrow">Project overview</div>
        <h1>{bundle.project.title}</h1>
        <p>{bundle.project.description}</p>
        <p>Devices: {bundle.devices.length}</p>
        <p>Assets: {bundle.assets.length}</p>
        <div className="inline-actions">
          <Link className="primary-button" href={`/dashboard/${projectId}/devices`}>
            Edit Collection
          </Link>
          <Link className="ghost-button" href={`/dashboard/${projectId}/preview`}>
            Preview Museum
          </Link>
        </div>
      </article>
    </section>
  );
}
