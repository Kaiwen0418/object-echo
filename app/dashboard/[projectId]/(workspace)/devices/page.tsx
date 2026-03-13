import { notFound } from "next/navigation";
import { DevicesEditor } from "@/components/dashboard/DevicesEditor";
import { getProjectById } from "@/lib/utils/project";

export default async function DevicesPage({
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
        <div className="section-eyebrow">Editable device list</div>
        <h1>Devices</h1>
      </div>
      <DevicesEditor projectId={projectId} initialDevices={bundle.devices} />
    </section>
  );
}
