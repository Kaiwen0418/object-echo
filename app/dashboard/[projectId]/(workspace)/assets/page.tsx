import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetsEditor } from "@/components/dashboard/AssetsEditor";
import { getProjectById } from "@/lib/utils/project";

export default async function AssetsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const bundle = await getProjectById(projectId);

  if (!bundle) notFound();

  return (
    <section className="section-row">
      <div className="dashboard-page-header">
        <Link className="dashboard-back-link" href={`/dashboard/${projectId}`}>
          Back
        </Link>
        <div className="section-eyebrow">Asset management</div>
        <h1>Assets</h1>
      </div>
      <AssetsEditor projectId={projectId} initialAssets={bundle.assets} />
    </section>
  );
}
