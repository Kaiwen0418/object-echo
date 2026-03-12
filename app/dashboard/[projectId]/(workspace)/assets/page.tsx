import { notFound } from "next/navigation";
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
      <article className="panel">
        <div className="section-eyebrow">Asset management</div>
        <h1>Assets</h1>
        <p>TODO: connect uploads to Supabase Storage and external source imports.</p>
        {bundle.assets.map((asset) => (
          <p key={asset.id}>
            {asset.type}: {asset.title ?? asset.sourceUrl}
          </p>
        ))}
      </article>
    </section>
  );
}
