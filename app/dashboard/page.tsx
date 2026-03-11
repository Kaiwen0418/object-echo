import Link from "next/link";
import { SignOutLink } from "@/components/auth/SignOutLink";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { listProjects } from "@/lib/utils/project";

export default function DashboardPage() {
  const projects = listProjects();

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
        <div className="site-nav">
          <Link className="primary-button" href="/dashboard/new">
            New Project
          </Link>
          <SignOutLink />
        </div>
      </header>
      <section className="section-row">
        <div>
          <div className="section-eyebrow">Dashboard</div>
          <h1>Your projects</h1>
        </div>
        <ProjectList projects={projects} />
      </section>
    </main>
  );
}
