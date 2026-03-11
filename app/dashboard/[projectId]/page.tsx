import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/utils/project";

export default async function ProjectOverviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const bundle = getProjectById(projectId);

  if (!bundle) notFound();

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/dashboard">
          OBJECT ECHO
        </Link>
        <nav className="site-nav">
          <Link className="nav-link" href={`/dashboard/${projectId}/devices`}>
            Devices
          </Link>
          <Link className="nav-link" href={`/dashboard/${projectId}/assets`}>
            Assets
          </Link>
          <Link className="nav-link" href={`/dashboard/${projectId}/preview`}>
            Preview
          </Link>
        </nav>
      </header>
      <section className="section-row">
        <article className="panel">
          <div className="section-eyebrow">Project overview</div>
          <h1>{bundle.project.title}</h1>
          <p>{bundle.project.description}</p>
          <p>Devices: {bundle.devices.length}</p>
          <p>Assets: {bundle.assets.length}</p>
        </article>
      </section>
    </main>
  );
}
