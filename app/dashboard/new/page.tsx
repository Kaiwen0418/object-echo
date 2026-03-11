import Link from "next/link";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

export default function NewProjectPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="site-brand" href="/dashboard">
          OBJECT ECHO
        </Link>
      </header>
      <section className="section-row">
        <div>
          <div className="section-eyebrow">Project setup</div>
          <h1>New project</h1>
        </div>
        <NewProjectForm />
      </section>
    </main>
  );
}
