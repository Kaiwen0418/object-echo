import Link from "next/link";
import { notFound } from "next/navigation";
import { DevicesEditor } from "@/components/dashboard/DevicesEditor";
import { getProjectById } from "@/lib/utils/project";

export default async function DevicesPage({
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
        <Link className="site-brand" href={`/dashboard/${projectId}`}>
          OBJECT ECHO
        </Link>
      </header>
      <section className="section-row">
        <div>
          <div className="section-eyebrow">Editable device list</div>
          <h1>Devices</h1>
        </div>
        <DevicesEditor initialDevices={bundle.devices} />
      </section>
    </main>
  );
}
