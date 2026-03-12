import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { SignOutLink } from "@/components/auth/SignOutLink";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { listProjects } from "@/lib/utils/project";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/">
          OBJECT ECHO
        </Link>
        <div className="site-header-stack">
          <div className="site-nav">
            <Link className="primary-button" href="/dashboard/new">
              New Project
            </Link>
            <SignOutLink />
          </div>
          <AuthStatus />
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
