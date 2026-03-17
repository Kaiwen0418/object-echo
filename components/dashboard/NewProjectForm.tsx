"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction, type CreateProjectState } from "@/app/dashboard/new/actions";

const initialState: CreateProjectState = {};

type FormErrors = {
  title?: string;
};

export function NewProjectForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!state.projectId) return;
    router.push(`/dashboard/${state.projectId}`);
  }, [router, state.projectId]);

  const validate = (formData: FormData) => {
    const nextErrors: FormErrors = {};
    const title = formData.get("title");

    if (typeof title !== "string" || !title.trim()) {
      nextErrors.title = "Project title is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <form
      className="panel form-grid"
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);

        if (!validate(formData)) {
          event.preventDefault();
        }
      }}
      onChange={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
          return;
        }

        if (target.name === "title" && errors.title) {
          setErrors((current) => ({
            ...current,
            title: target.value.trim() ? undefined : current.title
          }));
        }
      }}
    >
      <div>
        <label htmlFor="title">Project title</label>
        <input
          id="title"
          name="title"
          value={title}
          placeholder="Blueberry Device Museum"
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(errors.title || state.fieldErrors?.title)}
          aria-describedby={errors.title || state.fieldErrors?.title ? "project-title-error" : undefined}
        />
        {errors.title || state.fieldErrors?.title ? (
          <p id="project-title-error" className="field-error">
            {errors.title ?? state.fieldErrors?.title}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the collection and mood."
        />
      </div>
      {state.error ? <div className="panel auth-alert">{state.error}</div> : null}
      {state.success ? <p className="field-success">{state.success}</p> : null}
      <div className="inline-actions">
        <button type="submit" className="primary-button form-submit-button" disabled={isPending}>
          {isPending ? "Creating..." : "Create Project"}
        </button>
        <span className="inline-note">Projects are now persisted to Supabase.</span>
      </div>
    </form>
  );
}
