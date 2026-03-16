import Link from "next/link";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

export default function NewProjectPage() {
  return (
    <section className="section-row">
      <div className="dashboard-page-header">
        <Link className="dashboard-back-link" href="/dashboard">
          Back
        </Link>
        <div className="section-eyebrow">Project setup</div>
        <h1>New project</h1>
      </div>
      <NewProjectForm />
    </section>
  );
}
