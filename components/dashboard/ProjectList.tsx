import Link from "next/link";
import type { Project } from "@/types";

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="panel">
        <h2>No projects yet</h2>
        <p>Create your first museum project to start shaping a public collection page.</p>
      </div>
    );
  }

  return (
    <div className="grid-panels">
      {projects.map((project) => (
        <article key={project.id} className="panel">
          <div className="panel-meta">{project.status}</div>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
          <div className="inline-actions">
            <Link className="ghost-button" href={`/dashboard/${project.id}`}>
              Open Project
            </Link>
            {project.status === "published" ? (
              <Link className="ghost-button" href={`/museum/${project.slug}`}>
                Public Page
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
