import { ProjectList } from "@/components/dashboard/ProjectList";
import { listProjects } from "@/lib/utils/project";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <section className="section-row">
      <div>
        <div className="section-eyebrow">Dashboard</div>
        <h1>Your projects</h1>
      </div>
      <ProjectList projects={projects} />
    </section>
  );
}
