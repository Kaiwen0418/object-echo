import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

export default function NewProjectPage() {
  return (
    <section className="section-row">
      <div>
        <div className="section-eyebrow">Project setup</div>
        <h1>New project</h1>
      </div>
      <NewProjectForm />
    </section>
  );
}
