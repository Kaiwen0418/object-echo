"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction, type CreateProjectState } from "@/app/dashboard/new/actions";

const initialState: CreateProjectState = {};

type FormErrors = {
  title?: string;
  slug?: string;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewProjectForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!state.projectId) return;
    router.push(`/dashboard/${state.projectId}`);
  }, [router, state.projectId]);

  const validate = (formData: FormData) => {
    const nextErrors: FormErrors = {};
    const title = formData.get("title");
    const slug = formData.get("slug");

    if (typeof title !== "string" || !title.trim()) {
      nextErrors.title = "Project title is required.";
    }

    const resolvedSlug = slugify(typeof slug === "string" && slug.trim() ? slug : typeof title === "string" ? title : "");

    if (!resolvedSlug) {
      nextErrors.slug = "Slug is required.";
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

        if (target.name === "title" && (errors.title || errors.slug)) {
          setErrors((current) => ({
            ...current,
            title: target.value.trim() ? undefined : current.title,
            slug: slugify(target.value) ? undefined : current.slug
          }));
          return;
        }

        if (target.name === "slug" && errors.slug) {
          setErrors((current) => ({
            ...current,
            slug: slugify(target.value) ? undefined : current.slug
          }));
        }
      }}
    >
      <div>
        <label htmlFor="title">Project title</label>
        <input
          id="title"
          name="title"
          placeholder="Blueberry Device Museum"
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
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          placeholder="blueberry-device-museum"
          aria-invalid={Boolean(errors.slug || state.fieldErrors?.slug)}
          aria-describedby={errors.slug || state.fieldErrors?.slug ? "project-slug-error" : "project-slug-help"}
        />
        <p id="project-slug-help" className="field-help">
          Leave blank to generate it from the project title.
        </p>
        {errors.slug || state.fieldErrors?.slug ? (
          <p id="project-slug-error" className="field-error">
            {errors.slug ?? state.fieldErrors?.slug}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={5} placeholder="Describe the collection and mood." />
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
