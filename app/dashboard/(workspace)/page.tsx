import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { ensureCurrentUserProfile, listProjects } from "@/lib/utils/project";

export default async function DashboardPage() {
  const profile = await ensureCurrentUserProfile();
  const projects = await listProjects();

  return (
    <section className="section-row">
      <div>
        <div className="section-eyebrow">Dashboard</div>
        <h1>Your projects</h1>
      </div>
      {profile ? <ProfileCard profile={profile} /> : null}
      <ProjectList projects={projects} />
    </section>
  );
}
