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
      <div>
        <div className="section-eyebrow">Asset management</div>
        <h1>Assets</h1>
      </div>
      <AssetsEditor projectId={projectId} initialAssets={bundle.assets} />
    </section>
  );
}
