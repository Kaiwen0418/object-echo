"use client";

import { useActionState } from "react";
import { createProjectAction, type CreateProjectState } from "@/app/dashboard/new/actions";

const initialState: CreateProjectState = {};

export function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);

  return (
    <form className="panel form-grid" action={formAction}>
      <div>
        <label htmlFor="title">Project title</label>
        <input id="title" name="title" placeholder="Blueberry Device Museum" required />
      </div>
      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" placeholder="blueberry-device-museum" />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={5} placeholder="Describe the collection and mood." />
      </div>
      {state.error ? <div className="panel auth-alert">{state.error}</div> : null}
      <div className="inline-actions">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "Creating..." : "Create Project"}
        </button>
        <span className="inline-note">Projects are now persisted to Supabase.</span>
      </div>
    </form>
  );
}
